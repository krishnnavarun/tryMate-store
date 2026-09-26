import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { AUTH_COOKIE, clearAuthCookie, verifyToken } from '../utils/authToken.js';

// Only logged-in users get past this. Sets req.user (a plain object, no password hash).
export async function requireAuth(req, res, next) {
  const userId = verifyToken(req.cookies?.[AUTH_COOKIE]);
  if (!userId) throw ApiError.unauthorized();

  const user = await User.findById(userId).lean();
  if (!user) {
    // Valid token, but the account no longer exists
    clearAuthCookie(res);
    throw ApiError.unauthorized();
  }

  req.user = user;
  next();
}

// Like requireAuth, but lets logged-out visitors through (req.user stays undefined).
// Used where being logged in only adds something, e.g. "Suits you" tags on the shop page.
export async function optionalAuth(req, _res, next) {
  const userId = verifyToken(req.cookies?.[AUTH_COOKIE]);
  if (userId) req.user = (await User.findById(userId).lean()) ?? undefined;
  next();
}

// Use after requireAuth
export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') throw ApiError.forbidden();
  next();
}
