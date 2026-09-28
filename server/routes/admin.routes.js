import { Router } from 'express';
import { listAllOrders, updateOrderStatus } from '../controllers/order.controller.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParams } from '../validators/common.js';
import { adminOrdersQuery, orderStatusBody } from '../validators/order.validators.js';

// Admin-only endpoints that aren't about one product (admin product CRUD lives in
// product.routes.js). Mounted under /api/admin.
const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/orders', validate({ query: adminOrdersQuery }), listAllOrders);
router.patch('/orders/:id', validate({ params: idParams, body: orderStatusBody }), updateOrderStatus);

export default router;
