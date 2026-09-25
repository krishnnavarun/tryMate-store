import { z } from 'zod';

const text = (max, label) => z.string().trim().min(1, `${label} is required`).max(max);

export const createOrderBody = z.object({
  shippingAddress: z.object({
    fullName: text(80, 'full name'),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9+\-\s()]{7,20}$/, 'enter a valid phone number'),
    line1: text(120, 'address'),
    line2: z.string().trim().max(120).optional(),
    city: text(60, 'city'),
    state: text(60, 'state'),
    postalCode: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9\s-]{3,12}$/, 'enter a valid postal code'),
    country: text(60, 'country'),
  }),
});
