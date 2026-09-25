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

// Use after requireAuth
export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') throw ApiError.forbidden();
  next();
}
