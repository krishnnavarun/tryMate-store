// Live body tracking in the browser with MediaPipe PoseLandmarker (the JavaScript version
// of the model the AI service uses). Everything runs on the shopper's device: the camera
// video is never uploaded.
//
// The "lite" model is used here: it's small (≈5 MB) and fast enough for 20–30 frames per
// second on a laptop or phone. (The AI service uses "heavy" because it measures one photo.)

import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

// Copied from node_modules by client/scripts/copy-mediapipe-wasm.mjs
const WASM_PATH = '/mediapipe/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

let loading = null;

// Some browsers never answer when asked for a GPU; don't wait for them forever
const GPU_TIMEOUT_MS = 20_000;

export function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function create(delegate) {
  const files = await FilesetResolver.forVisionTasks(WASM_PATH);
  return PoseLandmarker.createFromOptions(files, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate },
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
}

// One landmarker for the whole app, created on first use. GPU is much faster; some
// browsers/devices can't provide it, so we fall back to the CPU.
export function loadPoseLandmarker() {
  loading ??= withTimeout(create('GPU'), GPU_TIMEOUT_MS, 'GPU start-up timed out')
    .catch(() => create('CPU'))
    .catch((err) => {
      loading = null; // allow a retry later
      throw err;
    });
  return loading;
}

// Landmark indices we use (same numbering as the Python service)
export const P = {
  NOSE: 0,
  L_SHOULDER: 11,
  R_SHOULDER: 12,
  L_ELBOW: 13,
  R_ELBOW: 14,
  L_WRIST: 15,
  R_WRIST: 16,
  L_HIP: 23,
  R_HIP: 24,
};
