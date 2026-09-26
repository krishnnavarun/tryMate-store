import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { slugify } from '../utils/strings.js';

function toDocument(body) {
  return {
    ...body,
    slug: body.slug || slugify(body.name),
    discountPrice: body.discountPrice ?? undefined,
    // Every size in the chart gets a stock number (0 if not given)
    stock: Object.fromEntries(Object.keys(body.sizeChart).map((size) => [size, body.stock[size] ?? 0])),
  };
}

async function assertSlugFree(slug, exceptId) {
  const clash = await Product.exists({ slug, ...(exceptId ? { _id: { $ne: exceptId } } : {}) });
  if (clash) throw ApiError.conflict(`Another product already uses the slug "${slug}"`);
}

// POST /api/products (admin)
export async function createProduct(req, res) {
  const doc = toDocument(req.valid.body);
  await assertSlugFree(doc.slug);
  const product = await Product.create(doc);
  res.status(201).json(product);
}

// PUT /api/products/:id (admin): replaces the product with the body
export async function updateProduct(req, res) {
  const product = await Product.findById(req.valid.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  const doc = toDocument(req.valid.body);
  await assertSlugFree(doc.slug, product._id);
  product.set(doc);
  if (req.valid.body.discountPrice == null) product.discountPrice = undefined; // allow removing a discount
  await product.save(); // runs the schema validators too
  res.json(product);
}

// DELETE /api/products/:id (admin)
// Carts drop the product automatically; orders keep their own snapshot of it.
export async function deleteProduct(req, res) {
  const result = await Product.deleteOne({ _id: req.valid.params.id });
  if (result.deletedCount === 0) throw ApiError.notFound('Product not found');
  res.status(204).end();
}
