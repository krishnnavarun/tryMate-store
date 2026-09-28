import { Router } from 'express';
import { cancelOrder, createOrder, getOrder, listOrders } from '../controllers/order.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParams } from '../validators/common.js';
import { createOrderBody } from '../validators/order.validators.js';

const router = Router();
router.use(requireAuth);

router.post('/', validate({ body: createOrderBody }), createOrder);
router.get('/', listOrders);
router.get('/:id', validate({ params: idParams }), getOrder);
router.post('/:id/cancel', validate({ params: idParams }), cancelOrder);

export default router;
