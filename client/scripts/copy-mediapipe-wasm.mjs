// Copies MediaPipe's WebAssembly runtime from node_modules into public/, so the live
// fitting room loads it from our own site (no third-party CDN, works with any version bump).
// Runs automatically before `npm run dev` and `npm run build` (see package.json).

import { cpSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const client = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const from = path.join(client, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const to = path.join(client, 'public', 'mediapipe', 'wasm');

if (!existsSync(from)) {
  console.error('❌ @mediapipe/tasks-vision is not installed. Run npm install in client/.');
  process.exit(1);
}
cpSync(from, to, { recursive: true });
console.log('✓ MediaPipe wasm copied to public/mediapipe/wasm');
