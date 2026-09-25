import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

// 404 for any /api route that doesn't exist
export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// Turn known error types into an ApiError; anything else becomes a 500.
function normalize(err) {
  if (err instanceof ApiError) return err;

  // Invalid JSON body (thrown by express.json())
  if (err.type === 'entity.parse.failed') {
    return ApiError.badRequest('Request body is not valid JSON');
  }
  if (err.type === 'entity.too.large') {
    return new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
  }

  // Mongoose schema validation failed
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return ApiError.badRequest(details.map((d) => `${d.field}: ${d.message}`).join('; '), details);
  }

  // A malformed ObjectId, e.g. /api/products/not-an-id/...
  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }

  // Unique index violation (e.g. duplicate slug or email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'value';
    return ApiError.conflict(`That ${field} is already in use`);
  }

  return null;
}

// Express recognises an error handler by its 4 arguments, so `_next` must stay.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const apiError = normalize(err);

  if (!apiError) {
    // Unexpected bug: log everything on the server, show nothing internal to the user.
    console.error(`💥 ${req.method} ${req.originalUrl}\n`, err);
    return res.status(500).json({
      error_code: 'INTERNAL_ERROR',
      message: 'Something went wrong on our side. Please try again.',
      ...(config.isProduction ? {} : { debug: err.message }),
    });
  }

  res.status(apiError.statusCode).json({
    error_code: apiError.errorCode,
    message: apiError.message,
    ...(apiError.details ? { details: apiError.details } : {}),
  });
}
