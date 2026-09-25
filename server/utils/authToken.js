// JWT + cookie helpers.
//
// Why an httpOnly cookie (and not a Bearer token in localStorage)?
// - httpOnly: JavaScript can't read the cookie, so an XSS bug can't steal the session.
// - The browser sends it automatically, so the client has no token code at all.
// - sameSite=lax: the browser won't attach it to POST/PATCH/DELETE requests started by
//   other sites, which (together with CORS allowing only CLIENT_URL) blocks CSRF.
// Production note: the client and API should share a site (e.g. proxy /api through the
// client's host, see README) so the cookie stays first-party.

import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const AUTH_COOKIE = 'trymate_token';
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

// Returns the user id, or null if the token is missing, expired or tampered with
export function verifyToken(token) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

const cookieOptions = () => ({
  httpOnly: true,
  secure: config.isProduction, // HTTPS only in production (localhost is plain http)
  sameSite: 'lax',
  path: '/',
});

export function setAuthCookie(res, userId) {
  res.cookie(AUTH_COOKIE, signToken(userId), { ...cookieOptions(), maxAge: TOKEN_TTL_SECONDS * 1000 });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, cookieOptions());
}
