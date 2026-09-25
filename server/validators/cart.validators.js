import { z } from 'zod';
import { MAX_QTY_PER_ITEM } from '../models/Cart.js';
import { objectId } from './common.js';

const qty = z.coerce.number().int().min(1).max(MAX_QTY_PER_ITEM, `max ${MAX_QTY_PER_ITEM} per item`);

export const addItemBody = z.object({
  productId: objectId,
  size: z.string().trim().min(1).max(10),
  color: z.string().trim().min(1).max(40),
  qty: qty.default(1),
});

export const updateItemBody = z.object({ qty });

export const itemParams = z.object({ itemId: objectId });
