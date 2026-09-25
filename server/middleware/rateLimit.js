import { rateLimit } from 'express-rate-limit';
import { ApiError } from '../utils/ApiError.js';

// Builds a per-IP limiter that answers with our usual { error_code, message } shape.
// (The per-user try-on limiter is added in Phase 6.)
function limiter({ windowMs, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8', // RateLimit headers tell the client when it can retry
    legacyHeaders: false,
    handler: (_req, _res, next) => next(new ApiError(429, 'RATE_LIMITED', message)),
  });
}

// Slows down password guessing on login/register
export const authLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: 'Too many attempts. Please wait a few minutes and try again.',
});
