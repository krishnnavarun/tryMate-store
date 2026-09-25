import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';
import authRoutes from './auth.routes.js';
import cartRoutes from './cart.routes.js';
import orderRoutes from './order.routes.js';
import productRoutes from './product.routes.js';

// Everything here is mounted under /api (see app.js)
const router = Router();

router.get('/health', getHealth);
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);

// Coming in later phases: /fit-profile, size recommendation, try-on

export default router;
