import { z } from 'zod';
import { FIT_PREFERENCES } from '../models/User.js';

// Multipart form fields arrive as strings, hence z.coerce
export const scanBody = z.object({
  heightCm: z.coerce
    .number({ error: 'height is required' })
    .min(120, 'height must be at least 120 cm')
    .max(230, 'height must be at most 230 cm'),
  weightKg: z
    .union([z.literal(''), z.coerce.number().min(20, 'weight must be at least 20 kg').max(400, 'weight must be at most 400 kg')])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
});

export const preferenceBody = z.object({
  fitPreference: z.enum(FIT_PREFERENCES),
});
