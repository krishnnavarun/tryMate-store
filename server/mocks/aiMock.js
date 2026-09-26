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

// ---- simplified version of the real size scoring (tryMate-Ai app/services/sizing.py) ----
const FIELDS = { chest: ['chest_cm', 4, 'chest'], waist: ['waist_cm', 4, 'waist'], shoulder: ['shoulder_cm', 2, 'shoulders'] };
const WEIGHTS = { upper_body: { chest: 0.5, shoulder: 0.3, waist: 0.2 }, dresses: { chest: 0.45, waist: 0.45, shoulder: 0.1 }, lower_body: { waist: 1 } };
const IDEAL = { slim: 0.75, regular: 0.5, loose: 0.25 };

function scoreSize(ranges, m, category, fit) {
  const weights = WEIGHTS[category] ?? WEIGHTS.upper_body;
  let total = 0;
  let squared = 0;
  const issues = { tight: [], loose: [] };
  for (const [field, range] of Object.entries(ranges)) {
    const def = FIELDS[field];
    if (!def || !weights[field] || !Array.isArray(range)) continue;
    const [key, sigma, label] = def;
    const ideal = range[0] + IDEAL[fit] * (range[1] - range[0]);
    const d = (m[key] - ideal) / sigma;
    squared += weights[field] * d * d;
    total += weights[field];
    if (Math.abs(d) >= 0.75) issues[d > 0 ? 'tight' : 'loose'].push(label);
  }
  if (!total) return { score: 0, note: 'No comparable measurements in this size chart' };
  const parts = [];
  if (issues.tight.length) parts.push(`tight at ${issues.tight.join(' and ')}`);
  if (issues.loose.length) parts.push(`loose at ${issues.loose.join(' and ')}`);
  const note = parts.length ? parts.join(', ').replace(/^./, (c) => c.toUpperCase()) : 'Good fit';
  return { score: Math.round(Math.exp((-0.5 * squared) / total) * 100) / 100, note };
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
    res.json({ recommended_size: best, per_size: perSize });
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
