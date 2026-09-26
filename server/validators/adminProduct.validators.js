import { z } from 'zod';
import { CATEGORIES, GENDERS, PRODUCT_TYPES, SIZE_FIELDS } from '../models/Product.js';

const httpUrl = z.string().trim().regex(/^https?:\/\/\S+$/i, 'must be an http(s) URL').max(2000);
const hexColor = z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, 'must be a hex color like #1F2A44');
// Size labels become MongoDB map keys, so no dots or $ (and keep them short)
const sizeLabel = z.string().trim().regex(/^[A-Za-z0-9]{1,6}$/, 'size labels are 1–6 letters/digits (e.g. S, XL, 32)');

// [min, max] in cm
const cmRange = z
  .tuple([z.number().min(0).max(300), z.number().min(0).max(300)])
  .refine(([min, max]) => min <= max, 'min must be less than or equal to max');

const sizeRanges = z
  .object(Object.fromEntries(SIZE_FIELDS.map((field) => [field, cmRange.optional()])))
  .strict();

// Body for POST /api/products and PUT /api/products/:id (PUT replaces the whole product)
export const productBody = z
  .object({
    name: z.string().trim().min(1, 'name is required').max(120),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]{1,140}$/, 'slug: lowercase letters, digits and dashes only')
      .optional()
      .or(z.literal('').transform(() => undefined)),
    description: z.string().max(4000).default(''),
    brand: z.string().trim().min(1, 'brand is required').max(80),
    price: z.number().positive('price must be more than 0'),
    discountPrice: z.number().positive().nullable().optional(),
    category: z.enum(CATEGORIES),
    type: z.enum(PRODUCT_TYPES),
    gender: z.enum(GENDERS),
    colors: z
      .array(z.object({ name: z.string().trim().min(1).max(40), hex: hexColor }))
      .min(1, 'add at least one color')
      .max(12),
    images: z.array(httpUrl).min(1, 'add at least one image').max(12),
    garmentImageUrl: httpUrl,
    sizeChart: z.record(sizeLabel, sizeRanges).refine((chart) => Object.keys(chart).length > 0, 'add at least one size'),
    stock: z.record(sizeLabel, z.number().int().min(0).max(100000)).default({}),
  })
  .superRefine((p, ctx) => {
    if (p.discountPrice != null && p.discountPrice >= p.price) {
      ctx.addIssue({ code: 'custom', path: ['discountPrice'], message: 'discount price must be lower than the price' });
    }
    const sizes = new Set(Object.keys(p.sizeChart));
    for (const size of Object.keys(p.stock)) {
      if (!sizes.has(size)) {
        ctx.addIssue({ code: 'custom', path: ['stock', size], message: `stock has size "${size}", which isn't in the size chart` });
      }
    }
    const names = p.colors.map((c) => c.name.toLowerCase());
    if (new Set(names).size !== names.length) {
      ctx.addIssue({ code: 'custom', path: ['colors'], message: 'color names must be unique' });
    }
  });
