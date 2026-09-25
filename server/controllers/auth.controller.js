import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { clearAuthCookie, setAuthCookie } from '../utils/authToken.js';

// When the email doesn't exist we still run a bcrypt compare (against this dummy hash),
// so "unknown email" and "wrong password" take the same time and an attacker can't use
// response times to find out which emails are registered.
let dummyHash;
async function compareDummy(password) {
  dummyHash ??= await User.hashPassword('dummy-password-for-timing');
  await bcrypt.compare(password, dummyHash);
  return false;
}

// Only these fields are sent to the client
function publicUser(user) {
  const { _id, name, email, role, fitProfile, fitPreference, createdAt } = user;
  return { _id, name, email, role, fitProfile: fitProfile ?? null, fitPreference, createdAt };
}

// POST /api/auth/register
export async function register(req, res) {
  const { name, email, password } = req.valid.body;

  if (await User.exists({ email })) {
    throw ApiError.conflict('An account with this email already exists');
  }

  // Always "customer": nobody can make themselves admin through this route
  const user = await User.create({ name, email, passwordHash: await User.hashPassword(password) });

  setAuthCookie(res, user._id);
  res.status(201).json({ user: publicUser(user) });
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = req.valid.body;

  const user = await User.findOne({ email }).select('+passwordHash');
  const passwordOk = user ? await user.checkPassword(password) : await compareDummy(password);

  // Same message for both cases: don't reveal whether the email exists
  if (!user || !passwordOk) throw ApiError.unauthorized('Invalid email or password');

  setAuthCookie(res, user._id);
  res.json({ user: publicUser(user) });
}

// POST /api/auth/logout
export function logout(_req, res) {
  clearAuthCookie(res);
  res.status(204).end();
}

// GET /api/auth/me
export function me(req, res) {
  res.json({ user: publicUser(req.user) });
}
