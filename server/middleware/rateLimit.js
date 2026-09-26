import { rateLimit } from 'express-rate-limit';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

// Builds a limiter that answers with our usual { error_code, message } shape.
// perUser: count per logged-in user (use after requireAuth) instead of per IP.
function limiter({ windowMs, limit, message, perUser = false }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8', // RateLimit headers tell the client when it can retry
    legacyHeaders: false,
    ...(perUser && { keyGenerator: (req) => `user:${req.user._id}` }),
    handler: (_req, _res, next) => next(new ApiError(429, 'RATE_LIMITED', message)),
  });
}

// Slows down password guessing on login/register. Looser outside production, where
// development and the end-to-end tests register many accounts from one machine.
export const authLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: config.isProduction ? 20 : 200,
  message: 'Too many attempts. Please wait a few minutes and try again.',
});

// Body scans run the AI models: 20 per hour per user is plenty for re-takes
export const scanLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  perUser: true,
  message: "You've scanned a lot in the last hour. Please try again a bit later.",
});

// Each try-on costs money on the AI provider (PROJECT_SPEC.md Phase 6: 10 per hour per user)
export const tryOnLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  perUser: true,
  message: "You've reached the try-on limit (10 per hour). Please try again later.",
});

// Size recommendations are cheap, but each calls the AI service
export const recommendationLimiter = limiter({
  windowMs: 60 * 1000,
  limit: 60,
  perUser: true,
  message: 'Too many requests. Please slow down a little.',
});
