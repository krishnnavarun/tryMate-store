import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { effectivePrice, imageForColor } from '../utils/pricing.js';

// Take `qty` units of one size out of stock, only if enough are left.
// The check and the decrement happen in ONE atomic MongoDB update, so two customers
// buying the last item at the same moment can't both succeed.
async function reserveStock(productId, size, qty) {
  const result = await Product.updateOne(
    { _id: productId, [`stock.${size}`]: { $gte: qty } },
    { $inc: { [`stock.${size}`]: -qty } },
  );
  return result.matchedCount === 1; // matched only if enough stock was left
}

function releaseStock(productId, size, qty) {
  return Product.updateOne({ _id: productId }, { $inc: { [`stock.${size}`]: qty } });
}

// POST /api/orders  { shippingAddress }
// Turns the user's cart into an order. Payment is a demo: nothing is charged.
export async function createOrder(req, res) {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product').lean();
  const lines = (cart?.items ?? []).filter((item) => item.product);
  if (lines.length === 0) throw new ApiError(400, 'CART_EMPTY', 'Your cart is empty');

  // Reserve stock line by line. If any line fails, give back what we already took.
  // (A MongoDB transaction would do this for us, but transactions need a replica set,
  // and a default local MongoDB is a single server.)
  const reserved = [];
  try {
    for (const line of lines) {
      const ok = await reserveStock(line.product._id, line.size, line.qty);
      if (!ok) {
        throw new ApiError(
          409,
          'OUT_OF_STOCK',
          `${line.product.name} (size ${line.size}) doesn't have enough stock left. Please update your cart.`,
        );
      }
      reserved.push(line);
    }

    const items = lines.map(({ product, size, color, qty }) => ({
      product: product._id,
      name: product.name,
      slug: product.slug,
      image: imageForColor(product, color),
      price: effectivePrice(product),
      size,
      color,
      qty,
    }));

    const order = await Order.create({
      user: req.user._id,
      items,
      total: items.reduce((sum, i) => sum + i.price * i.qty, 0),
      shippingAddress: req.valid.body.shippingAddress,
    });

    await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });
    res.status(201).json(order);
  } catch (err) {
    await Promise.all(reserved.map((line) => releaseStock(line.product._id, line.size, line.qty)));
    throw err;
  }
}

// GET /api/orders: the logged-in user's orders, newest first
export async function listOrders(req, res) {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100).lean();
  res.json(orders);
}

// GET /api/orders/:id: only the owner (or an admin) can see an order
export async function getOrder(req, res) {
  const filter = { _id: req.valid.params.id };
  if (req.user.role !== 'admin') filter.user = req.user._id;

  const order = await Order.findOne(filter).lean();
  // 404 (not 403) for other people's orders, so order ids can't be probed
  if (!order) throw ApiError.notFound('Order not found');
  res.json(order);
}

// ---- order status ----------------------------------------------------------------------

// Allowed status changes. Delivered and cancelled are final.
export const NEXT_STATUSES = { placed: ['shipped', 'cancelled'], shipped: ['delivered'], delivered: [], cancelled: [] };

// Change the status in ONE atomic update that only matches when the change is allowed from
// the order's current status, so two clicks at the same moment can't both cancel an order
// (and put its stock back twice). A cancelled order's items go back into stock.
async function changeStatus(filter, status) {
  const allowedFrom = Object.keys(NEXT_STATUSES).filter((from) => NEXT_STATUSES[from].includes(status));
  const order = await Order.findOneAndUpdate(
    { ...filter, status: { $in: allowedFrom } },
    { $set: { status } },
    { returnDocument: 'after' },
  ).lean();
  if (order && status === 'cancelled') {
    await Promise.all(order.items.map((item) => releaseStock(item.product, item.size, item.qty)));
  }
  return order;
}

// POST /api/orders/:id/cancel: customers can cancel their own order until it ships
export async function cancelOrder(req, res) {
  const filter = { _id: req.valid.params.id, user: req.user._id };
  const order = await changeStatus(filter, 'cancelled');
  if (order) return res.json(order);
  if (!(await Order.exists(filter))) throw ApiError.notFound('Order not found');
  throw new ApiError(409, 'CANNOT_CANCEL', 'This order can no longer be cancelled (it has shipped or was already cancelled).');
}

// GET /api/admin/orders?status=: every order, newest first, with the customer's name + email
export async function listAllOrders(req, res) {
  const { status } = req.valid.query;
  const orders = await Order.find(status ? { status } : {})
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('user', 'name email')
    .lean();
  res.json(orders);
}

// PATCH /api/admin/orders/:id  { status: shipped | delivered | cancelled }
export async function updateOrderStatus(req, res) {
  const { status } = req.valid.body;
  const order = await changeStatus({ _id: req.valid.params.id }, status);
  if (order) return res.json(order);
  const current = await Order.findById(req.valid.params.id, 'status').lean();
  if (!current) throw ApiError.notFound('Order not found');
  throw new ApiError(409, 'INVALID_STATUS_CHANGE', `An order that is ${current.status} can't be marked ${status}.`);
}
