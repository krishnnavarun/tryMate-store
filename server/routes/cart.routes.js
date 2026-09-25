import { Router } from 'express';
import { addItem, getCart, removeItem, updateItem } from '../controllers/cart.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { addItemBody, itemParams, updateItemBody } from '../validators/cart.validators.js';

const router = Router();
router.use(requireAuth);

router.get('/', getCart);
router.post('/items', validate({ body: addItemBody }), addItem);
router.patch('/items/:itemId', validate({ params: itemParams, body: updateItemBody }), updateItem);
router.delete('/items/:itemId', validate({ params: itemParams }), removeItem);

export default router;
