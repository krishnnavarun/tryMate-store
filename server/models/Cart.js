import mongoose from 'mongoose';

export const MAX_QTY_PER_ITEM = 10;

// Each line keeps its own _id: the client uses it for PATCH/DELETE /api/cart/items/:itemId
const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  size: { type: String, required: true },
  color: { type: String, required: true },
  qty: { type: Number, required: true, min: 1, max: MAX_QTY_PER_ITEM },
});

// One cart per user
const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true, toJSON: { versionKey: false } },
);

export const Cart = mongoose.model('Cart', cartSchema);
