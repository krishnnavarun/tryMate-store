import { Cart, MAX_QTY_PER_ITEM } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { effectivePrice, imageForColor } from '../utils/pricing.js';

const PRODUCT_FIELDS = 'name slug images colors price discountPrice stock';

// Builds the cart the client sees: product details, current prices, stock status, totals.
// Prices are always read live from the product, never stored in the cart.
export async function buildCartView(userId) {
  const cart = await Cart.findOne({ user: userId })
    .populate({ path: 'items.product', select: PRODUCT_FIELDS })
    .lean();

  if (!cart) return { items: [], itemCount: 0, subtotal: 0, hasStockIssues: false };

  // Products deleted since they were added: drop them from the cart
  const missing = cart.items.filter((item) => !item.product).map((item) => item._id);
  if (missing.length) {
    await Cart.updateOne({ _id: cart._id }, { $pull: { items: { _id: { $in: missing } } } });
  }

  const items = cart.items
    .filter((item) => item.product)
    .map((item) => {
      const { product } = item;
      const unitPrice = effectivePrice(product);
      const available = product.stock?.[item.size] ?? 0;
      return {
        _id: item._id,
        product: {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          image: imageForColor(product, item.color),
          price: product.price,
          discountPrice: product.discountPrice ?? null,
        },
        size: item.size,
        color: item.color,
        qty: item.qty,
        unitPrice,
        lineTotal: unitPrice * item.qty,
        available,
        inStock: available >= item.qty,
      };
    });

  return {
    items,
    itemCount: items.reduce((sum, i) => sum + i.qty, 0),
    subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0),
    hasStockIssues: items.some((i) => !i.inStock),
  };
}

// `product` is a Mongoose document here, so stock is a Map
function assertStock(product, size, qty) {
  const available = product.stock.get(size) ?? 0;
  if (available < qty) {
    throw new ApiError(
      409,
      'OUT_OF_STOCK',
      available === 0
        ? `${product.name} is sold out in size ${size}`
        : `Only ${available} left of ${product.name} in size ${size}`,
    );
  }
}

// GET /api/cart
export async function getCart(req, res) {
  res.json(await buildCartView(req.user._id));
}

// POST /api/cart/items  { productId, size, color, qty }
// Adding the same product + size + color again increases the quantity of that line.
export async function addItem(req, res) {
  const { productId, size, color, qty } = req.valid.body;

  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');
  if (!product.sizeChart.has(size)) throw ApiError.badRequest(`Size ${size} doesn't exist for this product`);
  if (!product.colors.some((c) => c.name === color)) {
    throw ApiError.badRequest(`Color ${color} doesn't exist for this product`);
  }

  const cart = (await Cart.findOne({ user: req.user._id })) ?? new Cart({ user: req.user._id, items: [] });
  const existing = cart.items.find((i) => i.product.equals(product._id) && i.size === size && i.color === color);
  const newQty = (existing?.qty ?? 0) + qty;

  if (newQty > MAX_QTY_PER_ITEM) {
    throw ApiError.badRequest(`You can add up to ${MAX_QTY_PER_ITEM} of the same item`);
  }
  assertStock(product, size, newQty);

  if (existing) existing.qty = newQty;
  else cart.items.push({ product: product._id, size, color, qty });
  await cart.save();

  res.status(201).json(await buildCartView(req.user._id));
}

// PATCH /api/cart/items/:itemId  { qty }
export async function updateItem(req, res) {
  const { qty } = req.valid.body;
  const cart = await Cart.findOne({ user: req.user._id });
  const item = cart?.items.id(req.valid.params.itemId);
  if (!item) throw ApiError.notFound('Cart item not found');

  const product = await Product.findById(item.product);
  if (!product) throw ApiError.notFound('This product is no longer available');
  assertStock(product, item.size, qty);

  item.qty = qty;
  await cart.save();
  res.json(await buildCartView(req.user._id));
}

// DELETE /api/cart/items/:itemId
export async function removeItem(req, res) {
  const { itemId } = req.valid.params;
  // The item id is part of the filter, so nothing matches if the item isn't in this
  // user's cart. (We can't use modifiedCount: timestamps always $set updatedAt.)
  const result = await Cart.updateOne(
    { user: req.user._id, 'items._id': itemId },
    { $pull: { items: { _id: itemId } } },
  );
  if (result.matchedCount === 0) throw ApiError.notFound('Cart item not found');
  res.json(await buildCartView(req.user._id));
}
