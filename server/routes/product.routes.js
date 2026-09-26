import { Router } from 'express';
import { z } from 'zod';
import { getProductBySlug, listProducts } from '../controllers/product.controller.js';
import { createProduct, deleteProduct, updateProduct } from '../controllers/adminProduct.controller.js';
import { getSizeRecommendation, tryOnProduct } from '../controllers/productAi.controller.js';
import { optionalAuth, requireAdmin, requireAuth } from '../middleware/auth.js';
import { recommendationLimiter, tryOnLimiter } from '../middleware/rateLimit.js';
import { singlePhoto } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { productBody } from '../validators/adminProduct.validators.js';
import { idParams } from '../validators/common.js';
import { listProductsQuery, slugParams } from '../validators/product.validators.js';

const router = Router();

// Express 5 forwards errors thrown in async handlers to the error handler automatically,
// so controllers don't need try/catch or an asyncHandler wrapper.

// optionalAuth: logged-in users with a fit profile get "Suits you" tags / the suitsMe filter
router.get('/', optionalAuth, validate({ query: listProductsQuery }), listProducts);
router.get('/:slug', optionalAuth, validate({ params: slugParams }), getProductBySlug);

// AI features (logged-in users only)
router.get(
  '/:id/size-recommendation',
  requireAuth,
  recommendationLimiter,
  validate({ params: idParams }),
  getSizeRecommendation,
);
router.post(
  '/:id/try-on',
  requireAuth,
  tryOnLimiter, // before the upload, so blocked requests aren't read into memory
  validate({ params: idParams }),
  singlePhoto('image'),
  validate({ body: z.object({ color: z.string().trim().min(1).max(40).optional() }) }),
  tryOnProduct,
);

// Admin
router.post('/', requireAuth, requireAdmin, validate({ body: productBody }), createProduct);
router.put('/:id', requireAuth, requireAdmin, validate({ params: idParams, body: productBody }), updateProduct);
router.delete('/:id', requireAuth, requireAdmin, validate({ params: idParams }), deleteProduct);

export default router;
