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
    error.errorCode = data?.error_code ?? (error.response ? 'UNKNOWN' : 'NETWORK_ERROR');
    error.userMessage = getFriendlyMessage(error.errorCode, data?.message);
    return Promise.reject(error);
  },
);

// Store errors whose server message is written for customers and safe to show as-is
const SHOW_SERVER_MESSAGE = new Set([
  'VALIDATION_ERROR',
  'NOT_FOUND',
  'CONFLICT',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'OUT_OF_STOCK',
  'CART_EMPTY',
  'RATE_LIMITED',
]);

function getFriendlyMessage(code, serverMessage) {
  if (code === 'NETWORK_ERROR') return "Can't reach the server. Check your connection and try again.";
  if (SHOW_SERVER_MESSAGE.has(code) && serverMessage) return serverMessage;
  // AI error codes get their friendly messages here in Phase 3 (PROJECT_SPEC.md §4)
  return 'Something went wrong on our side. Please try again.';
}
