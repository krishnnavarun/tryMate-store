import { Router } from 'express';
import { deleteFitProfile, getFitProfile, scan, updatePreference } from '../controllers/fitProfile.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { scanLimiter } from '../middleware/rateLimit.js';
import { singlePhoto } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { preferenceBody, scanBody } from '../validators/fitProfile.validators.js';

const router = Router();
router.use(requireAuth);

router.get('/', getFitProfile);
// Order matters: limiter before the upload, so a blocked request isn't read into memory
router.post('/scan', scanLimiter, singlePhoto('image'), validate({ body: scanBody }), scan);
router.put('/preference', validate({ body: preferenceBody }), updatePreference);
router.delete('/', deleteFitProfile);

export default router;
