import { z } from 'zod';

// A MongoDB ObjectId as a 24-character hex string
export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'invalid id');

export const idParams = z.object({ id: objectId });
