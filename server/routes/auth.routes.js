import { Router } from 'express';
import { login, logout, me, register } from '../controllers/auth.controller.js';
import { optionalAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { loginBody, registerBody } from '../validators/auth.validators.js';

const router = Router();

router.post('/register', authLimiter, validate({ body: registerBody }), register);
router.post('/login', authLimiter, validate({ body: loginBody }), login);
router.post('/logout', logout);
// Logged out → 200 { user: null } (asking "who am I?" isn't an error)
router.get('/me', optionalAuth, me);

export default router;
