import { Router } from 'express';
import { getProductBySlug, listProducts } from '../controllers/product.controller.js';
import { validate } from '../middleware/validate.js';
import { listProductsQuery, slugParams } from '../validators/product.validators.js';

const router = Router();

// Express 5 forwards errors thrown in async handlers to the error handler automatically,
// so controllers don't need try/catch or an asyncHandler wrapper.
router.get('/', validate({ query: listProductsQuery }), listProducts);
router.get('/:slug', validate({ params: slugParams }), getProductBySlug);

// Admin create/update/delete: Phase 2 (auth) / Phase 8 (admin UI)

export default router;
