import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email('enter a valid email address'));

export const registerBody = z.object({
  name: z.string().trim().min(1, 'name is required').max(80),
  email,
  // bcrypt only uses the first 72 bytes of a password, so longer ones are rejected
  // instead of being silently cut.
  password: z
    .string()
    .min(8, 'password must be at least 8 characters')
    .refine((p) => Buffer.byteLength(p, 'utf8') <= 72, 'password is too long (max 72 bytes)'),
});

export const loginBody = z.object({
  email,
  password: z.string().min(1, 'password is required').max(200),
});
