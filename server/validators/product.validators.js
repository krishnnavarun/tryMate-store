import { z } from 'zod';
import { CATEGORIES, PRODUCT_TYPES } from '../models/Product.js';

export const PRODUCT_SORTS = ['newest', 'price_asc', 'price_desc', 'name'];

// GET /api/products?category&type&color&minPrice&maxPrice&sort&page&limit
// &suitsMe=true (logged-in users with a fit profile). Unknown query params are ignored.
export const listProductsQuery = z
  .object({
    category: z.enum(CATEGORIES).optional(),
    type: z.enum(PRODUCT_TYPES).optional(),
    color: z.string().trim().min(1).max(40).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sort: z.enum(PRODUCT_SORTS).default('newest'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(48).default(12),
    suitsMe: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => v === 'true'),
  })
  .refine((q) => q.minPrice == null || q.maxPrice == null || q.minPrice <= q.maxPrice, {
    message: 'minPrice must be less than or equal to maxPrice',
    path: ['minPrice'],
  });

export const slugParams = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{1,140}$/, 'invalid product slug'),
});
