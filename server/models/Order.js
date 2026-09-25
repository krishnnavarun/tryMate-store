import mongoose from 'mongoose';

export const ORDER_STATUSES = ['placed', 'shipped', 'delivered', 'cancelled'];

// A snapshot of the product at the time of purchase. If the product's name or price
// changes later (or it's deleted), the order still shows what the customer actually bought.
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    slug: String,
    image: String,
    price: { type: Number, required: true, min: 0 }, // unit price actually charged
    size: { type: String, required: true },
    color: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: {
      type: [orderItemSchema],
      validate: { validator: (v) => v.length > 0, message: 'an order needs at least one item' },
    },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: 'placed' },
    // Dummy payment: nothing is charged, we only record that checkout completed
    payment: {
      method: { type: String, default: 'demo' },
      status: { type: String, default: 'paid' },
    },
    shippingAddress: { type: shippingAddressSchema, required: true },
  },
  { timestamps: true, toJSON: { versionKey: false } },
);

export const Order = mongoose.model('Order', orderSchema);
