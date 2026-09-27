// A fake AI service that implements the same contract as tryMate-Ai (PROJECT_SPEC.md §4),
// so the whole store can be built and demoed without Python, models or Replicate.
//
// Two ways to use it:
//   1. AI_MODE=mock (default): the store's server mounts it at /__mock-ai. Nothing else to run.
//   2. Standalone on port 8000, like the real service:   npm run mock:ai   (in server/)
//
// Triggering errors (to test every message in the UI):
//   - /analyze with height_cm outside 120–230 (e.g. 999)      → 422 INVALID_INPUT
//   - upload a photo whose FILE NAME contains one of these words:
//       no-person     → 422 NO_PERSON_DETECTED
//       multiple      → 422 MULTIPLE_PEOPLE
//       partial       → 422 PARTIAL_BODY
//       no-face       → 200, skin_tone null + warning (what the real service does)
//       face-error    → 422 FACE_NOT_FOUND (the error form, in case a future version uses it)
//       server-error  → 500 INTERNAL_ERROR
//       tryon-fail    → /try-on 502 TRYON_FAILED
//       tryon-timeout → /try-on 504 TRYON_TIMEOUT
//   - wrong X-API-Key                                          → 401 UNAUTHORIZED

import { fileURLToPath, pathToFileURL } from 'node:url';
import express from 'express';
import multer from 'multer';

const VERSION = '0.1.0-mock';
const TRYON_DELAY_MS = 3000;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 2 } });

const FILENAME_TRIGGERS = {
  'no-person': [422, 'NO_PERSON_DETECTED', 'No person found in the photo. Use a clear full-body photo.'],
  multiple: [422, 'MULTIPLE_PEOPLE', 'More than one person found in the photo.'],
  partial: [422, 'PARTIAL_BODY', 'The full body (head to feet) must be visible in the photo. Couldn\'t see: left ankle.'],
  'face-error': [422, 'FACE_NOT_FOUND', 'No face found in the photo.'],
  'server-error': [500, 'INTERNAL_ERROR', 'Something went wrong on our side.'],
  'tryon-fail': [502, 'TRYON_FAILED', 'The try-on provider returned an error.'],
  'tryon-timeout': [504, 'TRYON_TIMEOUT', 'The try-on provider took too long to respond.'],
};

// A warm, medium palette (the real service picks one of 9 from the skin tone)
const PALETTE = [
  { name: 'Olive', hex: '#708238' },
  { name: 'Mustard', hex: '#D4A017' },
  { name: 'Rust', hex: '#B7410E' },
  { name: 'Camel', hex: '#C19A6B' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Cream', hex: '#F2E8D5' },
  { name: 'Forest Green', hex: '#228B22' },
  { name: 'Chocolate', hex: '#5C3A21' },
];

// Body proportions of an average 175 cm man; scaled by height with a little randomness
const BASE = { shoulder_cm: 44.0, chest_cm: 96.0, waist_cm: 84.0, torso_cm: 47.0, arm_cm: 59.5, leg_cm: 82.0 };

function sendError(res, status, code, message) {
  res.status(status).json({ error_code: code, message });
}

function triggerFor(file, allowed) {
  const name = (file?.originalname ?? '').toLowerCase();
  const key = allowed.find((word) => name.includes(word));
  return key ? FILENAME_TRIGGERS[key] : null;
}

const round1 = (n) => Math.round(n * 10) / 10;
const wiggle = () => 1 + (Math.random() - 0.5) * 0.06; // ±3 %

// ---- a JavaScript copy of the real size scoring (tryMate-Ai app/services/sizing.py) ----
// Same fields, weights, bell curve, notes, fit breakdown and "between sizes" rule, so the
// store behaves the same with the mock as with the real service.
const LENGTH_PER_TORSO = 1.55;
const SLEEVE_PER_ARM = 1.06;
const FIELDS = {
  chest: { body: (m) => m.chest_cm, sigma: 4, label: 'chest', girth: true },
  waist: { body: (m) => m.waist_cm, sigma: 4, label: 'waist', girth: true },
  shoulder: { body: (m) => m.shoulder_cm, sigma: 2, label: 'shoulders', girth: true },
  length: { body: (m) => m.torso_cm * LENGTH_PER_TORSO, sigma: 4, label: 'length', girth: false },
  sleeve: { body: (m) => m.arm_cm * SLEEVE_PER_ARM, sigma: 2.5, label: 'sleeves', girth: false },
};
const WEIGHTS = {
  upper_body: { chest: 0.45, shoulder: 0.25, waist: 0.15, length: 0.15, sleeve: 0.12 },
  dresses: { chest: 0.35, waist: 0.35, shoulder: 0.1, length: 0.2 },
  lower_body: { waist: 0.6 },
};
const IDEAL = { slim: 0.75, regular: 0.5, loose: 0.25 };

function verdictFor(field, d) {
  const size = Math.abs(d);
  if (size < 0.75) return 'good';
  const strength = size < 1.5 ? 'slightly_' : '';
  if (field.girth) return strength + (d > 0 ? 'tight' : 'loose');
  return strength + (d > 0 ? 'short' : 'long');
}

const joinWords = (items) => (items.length === 1 ? items[0] : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`);

function scoreSize(ranges, m, category, fit) {
  const weights = WEIGHTS[category] ?? WEIGHTS.upper_body;
  let total = 0;
  let squared = 0;
  const fields = [];
  const groups = new Map(); // "tight at" → ["chest"], "slightly long" → []
  for (const [name, range] of Object.entries(ranges)) {
    const field = FIELDS[name];
    if (!field || !weights[name] || !Array.isArray(range)) continue;
    const value = field.body(m);
    const ideal = range[0] + (field.girth ? IDEAL[fit] : 0.5) * (range[1] - range[0]);
    const d = (value - ideal) / field.sigma;
    squared += weights[name] * d * d;
    total += weights[name];
    const verdict = verdictFor(field, d);
    fields.push({
      field: name,
      label: field.label,
      body_cm: round1(value),
      size_min: range[0],
      size_max: range[1],
      ideal_cm: round1(ideal),
      difference_cm: round1(value - ideal),
      verdict,
    });
    if (verdict === 'good') continue;
    const slightly = verdict.startsWith('slightly_') ? 'slightly ' : '';
    const word = verdict.replace('slightly_', '');
    if (field.girth) groups.set(`${slightly}${word} at`, [...(groups.get(`${slightly}${word} at`) ?? []), field.label]);
    else groups.set(name === 'length' ? `${slightly}${word}` : `${slightly}${word} in the ${field.label}`, []);
  }
  if (!total) return { score: 0, note: 'No comparable measurements in this size chart', fields: [] };
  const parts = [...groups].map(([prefix, labels]) => (labels.length ? `${prefix} ${joinWords(labels)}` : prefix));
  const note = parts.length ? parts.join(', ').replace(/^./, (c) => c.toUpperCase()) : 'Good fit';
  return { score: Math.round(Math.exp((-0.5 * squared) / total) * 100) / 100, note, fields };
}

// A neighbouring size that fits almost as well → [size, note], otherwise [null, null]
function betweenSizes(sizes, perSize, best) {
  const i = sizes.indexOf(best);
  const neighbours = [sizes[i - 1], sizes[i + 1]].filter(Boolean);
  if (!neighbours.length || perSize[best].score <= 0) return [null, null];
  const other = neighbours.reduce((a, b) => (perSize[b].score > perSize[a].score ? b : a));
  if (perSize[other].score < 0.75 * perSize[best].score) return [null, null];
  const larger = sizes.indexOf(other) > i;
  const [smaller, bigger] = larger ? [best, other] : [other, best];
  return [other, `You're between ${smaller} and ${bigger}: ${best} is the closer match; ${other} ${larger ? 'fits more relaxed' : 'fits closer'}.`];
}

export function createMockAiApp({ apiKey }) {
  const app = express();
  app.use(express.json({ limit: '200kb' }));

  app.get('/health', (_req, res) => res.json({ status: 'ok', version: VERSION }));

  // Every other route needs the key, like the real service
  app.use((req, res, next) => {
    if (req.get('X-API-Key') !== apiKey) return sendError(res, 401, 'UNAUTHORIZED', 'Missing or invalid X-API-Key header.');
    next();
  });

  app.post('/analyze', upload.single('image'), (req, res) => {
    const height = Number(req.body.height_cm);
    if (!req.file) return sendError(res, 422, 'INVALID_INPUT', 'image: Field required');
    if (!Number.isFinite(height) || height < 120 || height > 230) {
      return sendError(res, 422, 'INVALID_INPUT', 'height_cm: Input should be between 120 and 230');
    }
    const trigger = triggerFor(req.file, ['no-person', 'multiple', 'partial', 'face-error', 'server-error']);
    if (trigger) return sendError(res, ...trigger);

    const scale = height / 175;
    const measurements = Object.fromEntries(Object.entries(BASE).map(([k, v]) => [k, round1(v * scale * wiggle())]));
    const noFace = req.file.originalname.toLowerCase().includes('no-face');

    res.json({
      measurements,
      skin_tone: noFace ? null : { tone: 'medium', undertone: 'warm', hex: '#C68E6A' },
      color_suggestions: noFace ? [] : PALETTE,
      confidence: 0.82,
      warnings: [
        'Mock AI service: these measurements are made up.',
        ...(noFace ? ["We couldn't see your face clearly, so skin tone and color suggestions are missing"] : []),
      ],
      debug_image_base64: null,
    });
  });

  app.post('/recommend-size', (req, res) => {
    const { measurements, size_chart: chart, category = 'upper_body', fit_preference: fit = 'regular' } = req.body ?? {};
    if (!measurements || !chart || !Object.keys(chart).length || !IDEAL[fit]) {
      return sendError(res, 422, 'INVALID_INPUT', 'measurements, size_chart and a valid fit_preference are required');
    }
    const perSize = {};
    let best = null;
    for (const [size, ranges] of Object.entries(chart)) {
      perSize[size] = scoreSize(ranges, measurements, category, fit);
      if (!best || perSize[size].score >= perSize[best].score) best = size;
    }
    const [alternative, note] = betweenSizes(Object.keys(chart), perSize, best);
    res.json({ recommended_size: best, per_size: perSize, alternative_size: alternative, alternative_note: note });
  });

  app.post(
    '/try-on',
    upload.fields([
      { name: 'person_image', maxCount: 1 },
      { name: 'garment_image', maxCount: 1 },
    ]),
    async (req, res) => {
      const person = req.files?.person_image?.[0];
      const garmentFile = req.files?.garment_image?.[0];
      const garmentUrl = req.body.garment_image_url;
      if (!person) return sendError(res, 422, 'INVALID_INPUT', 'person_image: Field required');
      if (!['upper_body', 'lower_body', 'dresses'].includes(req.body.category)) {
        return sendError(res, 422, 'INVALID_INPUT', 'category: must be upper_body, lower_body or dresses');
      }
      if (Boolean(garmentFile) === Boolean(garmentUrl)) {
        return sendError(res, 422, 'INVALID_INPUT', 'Send exactly one of garment_image or garment_image_url.');
      }

      const started = Date.now();
      await new Promise((resolve) => setTimeout(resolve, TRYON_DELAY_MS));
      const trigger = triggerFor(person, ['tryon-fail', 'tryon-timeout']);
      if (trigger) return sendError(res, ...trigger);

      // The "result" is the uploaded person photo itself, sent back as base64 (nothing is stored)
      res.json({
        result_image_url: null,
        result_image_base64: person.buffer.toString('base64'),
        latency_ms: Date.now() - started,
        provider: 'mock',
      });
    },
  );

  // Contract-shaped errors for oversized/odd uploads
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof multer.MulterError) return sendError(res, 422, 'INVALID_INPUT', err.message);
    sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong on our side.');
  });

  return app;
}

// Standalone:  node mocks/aiMock.js   (port 8000, key from AI_SERVICE_KEY or "change-me")
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const { default: dotenv } = await import('dotenv');
  dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });
  const port = Number(process.env.MOCK_AI_PORT ?? 8000);
  createMockAiApp({ apiKey: process.env.AI_SERVICE_KEY ?? 'change-me' }).listen(port, () => {
    console.log(`🤖 Mock AI service on http://localhost:${port}`);
  });
}
