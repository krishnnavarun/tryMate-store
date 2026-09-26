import axios from 'axios';

// The one axios instance the whole app uses.
// Base URL comes from client/.env (VITE_API_URL).
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
  // Send the httpOnly auth cookie with every request (the server sets it on login)
  withCredentials: true,
  timeout: 20000,
});

// Every error the server sends looks like { error_code, message }.
// This interceptor copies those onto the error so components can just read
// `err.userMessage` / `err.errorCode` without digging into err.response.data.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data;
    if (axios.isCancel(error)) {
      error.errorCode = 'CANCELED'; // we aborted it on purpose (e.g. closed the try-on window)
      return Promise.reject(error);
    }
    error.errorCode = data?.error_code ?? (error.response ? 'UNKNOWN' : 'NETWORK_ERROR');
    error.userMessage = getFriendlyMessage(error.errorCode, data?.message);
    return Promise.reject(error);
  },
);

// Store errors whose server message is written for customers and safe to show as-is
const SHOW_SERVER_MESSAGE = new Set([
  'VALIDATION_ERROR',
  'INVALID_INPUT', // e.g. "image: the image is too small"
  'NOT_FOUND',
  'CONFLICT',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'OUT_OF_STOCK',
  'CART_EMPTY',
  'RATE_LIMITED',
  'NO_FIT_PROFILE',
  'AI_UNAVAILABLE',
  'AI_TIMEOUT',
]);

// AI error codes → friendly messages (PROJECT_SPEC.md §4)
export const AI_MESSAGES = {
  NO_PERSON_DETECTED: "We couldn't find a person in the photo. Try a clear, full-body photo.",
  MULTIPLE_PEOPLE: 'Please use a photo with only you in it.',
  PARTIAL_BODY: 'We need your full body, head to feet, in the photo.',
  FACE_NOT_FOUND: "We couldn't see your face clearly, so color suggestions may be missing.",
  TRYON_FAILED: 'Try-on is busy right now. Please try again in a minute.',
  TRYON_TIMEOUT: 'Try-on is busy right now. Please try again in a minute.',
};

const GENERIC = 'Something went wrong on our side. Please try again.';

function getFriendlyMessage(code, serverMessage) {
  if (code === 'NETWORK_ERROR') return "Can't reach the server. Check your connection and try again.";
  if (AI_MESSAGES[code]) return AI_MESSAGES[code];
  if (SHOW_SERVER_MESSAGE.has(code) && serverMessage) return serverMessage;
  return GENERIC; // INTERNAL_ERROR and anything unknown
}
