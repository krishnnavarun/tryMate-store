import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';
import authRoutes from './auth.routes.js';
import cartRoutes from './cart.routes.js';
import fitProfileRoutes from './fitProfile.routes.js';
import orderRoutes from './order.routes.js';
import productRoutes from './product.routes.js';

// Everything here is mounted under /api (see app.js)
const router = Router();

router.get('/health', getHealth);
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/fit-profile', fitProfileRoutes);
// Size recommendation + try-on live under /products/:id (product.routes.js)

export default router;
