import { Router } from 'express';
import { login, logout, me, register } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { loginBody, registerBody } from '../validators/auth.validators.js';

const router = Router();

router.post('/register', authLimiter, validate({ body: registerBody }), register);
router.post('/login', authLimiter, validate({ body: loginBody }), login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
