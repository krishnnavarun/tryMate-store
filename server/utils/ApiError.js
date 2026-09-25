// Throw an ApiError from any route/controller to send a clean JSON error:
//   throw ApiError.notFound('Product not found');
//   → 404 { "error_code": "NOT_FOUND", "message": "Product not found" }
//
// The { error_code, message } shape is the same one the AI service uses, so the client
// only has to understand one error format (AI errors are passed through in Phase 3).

export class ApiError extends Error {
  constructor(statusCode, errorCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }

  static badRequest(message = 'Invalid request', details) {
    return new ApiError(400, 'VALIDATION_ERROR', message, details);
  }

  static unauthorized(message = 'Please log in to continue') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'You do not have permission to do that') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Not found') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message = 'Already exists') {
    return new ApiError(409, 'CONFLICT', message);
  }
}
