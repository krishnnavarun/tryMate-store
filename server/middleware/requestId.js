import { randomUUID } from 'node:crypto';

// Gives every request an id (req.id), returned in the X-Request-ID header and forwarded to
// the AI service, so a problem can be traced across both services' logs.
export function requestId(req, res, next) {
  req.id = randomUUID().replaceAll('-', '').slice(0, 16);
  res.set('X-Request-ID', req.id);
  next();
}
