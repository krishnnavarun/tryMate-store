// The only place the store talks to the AI service (real or mock).
//
// - Adds the X-API-Key header (the browser never sees the key or calls the AI directly).
// - Forwards uploaded photos straight from memory (multer buffer → form-data → axios).
//   Nothing is written to disk and photos are never logged.
// - Turns every failure into an ApiError the client understands: AI errors keep their
//   error_code (NO_PERSON_DETECTED, TRYON_FAILED...), network problems become AI_UNAVAILABLE.

import axios from 'axios';
import FormData from 'form-data';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const TIMEOUTS_MS = {
  health: 3_000,
  analyze: 60_000,
  recommendSize: 15_000,
  tryOn: 130_000, // the AI service itself gives up after 120 s
};

// AI error codes the store passes on to the client as-is (with the HTTP status we reply with)
const PASS_THROUGH = {
  INVALID_INPUT: 422,
  NO_PERSON_DETECTED: 422,
  MULTIPLE_PEOPLE: 422,
  PARTIAL_BODY: 422,
  FACE_NOT_FOUND: 422,
  TRYON_FAILED: 502,
  TRYON_TIMEOUT: 504,
  RATE_LIMITED: 429,
};

// In mock mode the mock is mounted inside this server (see app.js)
export function aiBaseUrl() {
  return config.ai.mode === 'mock' ? `http://127.0.0.1:${config.port}/__mock-ai` : config.ai.url;
}

const http = axios.create({ maxBodyLength: 25 * 1024 * 1024, maxContentLength: 40 * 1024 * 1024 });

async function call(method, path, { data, headers, timeout, requestId }) {
  try {
    const response = await http.request({
      method,
      url: `${aiBaseUrl()}${path}`,
      data,
      timeout,
      headers: {
        ...headers,
        'X-API-Key': config.ai.key,
        ...(requestId ? { 'X-Request-ID': requestId } : {}),
      },
    });
    return response.data;
  } catch (err) {
    throw toApiError(err, path);
  }
}

function toApiError(err, path) {
  // The AI service answered with an error
  if (err.response) {
    const { status, data } = err.response;
    const code = data?.error_code;
    if (code && PASS_THROUGH[code]) {
      return new ApiError(PASS_THROUGH[code], code, data.message ?? code);
    }
    // UNAUTHORIZED here means OUR key is wrong: a server config problem, not the user's fault
    console.error(`AI service ${path} failed: HTTP ${status} ${code ?? ''} ${data?.message ?? ''}`);
    return new ApiError(502, 'INTERNAL_ERROR', 'Something went wrong on our side. Please try again.');
  }
  // We gave up waiting
  if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
    const code = path === '/try-on' ? 'TRYON_TIMEOUT' : 'AI_TIMEOUT';
    return new ApiError(504, code, 'The fit service took too long to respond. Please try again.');
  }
  // No answer at all (service down, wrong URL)
  console.error(`AI service unreachable at ${aiBaseUrl()}${path}: ${err.code ?? err.message}`);
  return new ApiError(503, 'AI_UNAVAILABLE', 'The fit service is not available right now. Please try again later.');
}

function photoForm(fields, files) {
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null && value !== '') form.append(name, String(value));
  }
  for (const [name, file] of Object.entries(files)) {
    // knownLength lets form-data compute Content-Length, so the AI service can reject
    // oversized uploads before reading them
    form.append(name, file.buffer, {
      filename: file.originalname || 'photo.jpg',
      contentType: file.mimetype,
      knownLength: file.buffer.length,
    });
  }
  return form;
}

// ---- the four endpoints (PROJECT_SPEC.md §4) ------------------------------------------

export async function aiHealth() {
  return call('get', '/health', { timeout: TIMEOUTS_MS.health });
}

export async function analyzeBody({ file, heightCm, weightKg, requestId }) {
  const form = photoForm({ height_cm: heightCm, weight_kg: weightKg }, { image: file });
  return call('post', '/analyze', { data: form, headers: form.getHeaders(), timeout: TIMEOUTS_MS.analyze, requestId });
}

export async function recommendSize({ measurements, sizeChart, category, fitPreference, requestId }) {
  return call('post', '/recommend-size', {
    data: { measurements, size_chart: sizeChart, category, fit_preference: fitPreference },
    timeout: TIMEOUTS_MS.recommendSize,
    requestId,
  });
}

export async function tryOn({ file, garmentImageUrl, category, garmentDescription, requestId }) {
  const form = photoForm(
    { category, garment_image_url: garmentImageUrl, garment_description: garmentDescription },
    { person_image: file },
  );
  return call('post', '/try-on', { data: form, headers: form.getHeaders(), timeout: TIMEOUTS_MS.tryOn, requestId });
}
