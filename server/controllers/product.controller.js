import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/strings.js';

// What the price actually is: the discount price when there is one.
// Filtering and sorting use this, so "under ₹1500" includes discounted items.
const EFFECTIVE_PRICE = { $ifNull: ['$discountPrice', '$price'] };

const SORT_STAGES = {
  newest: { createdAt: -1, _id: -1 },
  price_asc: { effectivePrice: 1, _id: 1 },
  price_desc: { effectivePrice: -1, _id: 1 },
  name: { name: 1, _id: 1 },
};

// Fields sent for product cards. The full product (size chart, stock, description)
// is only sent by GET /api/products/:slug.
const CARD_FIELDS = {
  name: 1,
  slug: 1,
  brand: 1,
  price: 1,
  discountPrice: 1,
  effectivePrice: 1,
  category: 1,
  type: 1,
  gender: 1,
  colors: 1,
  images: 1,
  createdAt: 1,
};

// GET /api/products
export async function listProducts(req, res) {
  const { category, type, color, minPrice, maxPrice, sort, page, limit } = req.valid.query;

  const match = {};
  if (category) match.category = category;
  if (type) match.type = type;
  // Exact color name, case-insensitive ("navy" matches "Navy")
  if (color) match['colors.name'] = new RegExp(`^${escapeRegex(color)}$`, 'i');

  const priceMatch = {};
  if (minPrice != null) priceMatch.$gte = minPrice;
  if (maxPrice != null) priceMatch.$lte = maxPrice;

  const pipeline = [
    { $match: match },
    { $addFields: { effectivePrice: EFFECTIVE_PRICE } },
    ...(Object.keys(priceMatch).length ? [{ $match: { effectivePrice: priceMatch } }] : []),
    {
      // $facet runs two pipelines on the same results: one page of items + the total count
      $facet: {
        items: [
          { $sort: SORT_STAGES[sort] },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          { $project: CARD_FIELDS },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ];

  const [[result], filters] = await Promise.all([Product.aggregate(pipeline), getFilterOptions(category)]);
  const total = result.total[0]?.count ?? 0;

  res.json({
    items: result.items,
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
    filters,
  });
}

// Options for the shop's filter UI (types, colors, price range), computed from the
// whole catalog (optionally within a category) so choosing one filter doesn't hide
// the others' options.
async function getFilterOptions(category) {
  const [result] = await Product.aggregate([
    { $match: category ? { category } : {} },
    { $addFields: { effectivePrice: EFFECTIVE_PRICE } },
    {
      $facet: {
        types: [{ $group: { _id: '$type' } }, { $sort: { _id: 1 } }],
        colors: [
          { $unwind: '$colors' },
          { $group: { _id: '$colors.name', hex: { $first: '$colors.hex' } } },
          { $sort: { _id: 1 } },
        ],
        price: [{ $group: { _id: null, min: { $min: '$effectivePrice' }, max: { $max: '$effectivePrice' } } }],
      },
    },
  ]);

  return {
    types: result.types.map((t) => t._id),
    colors: result.colors.map((c) => ({ name: c._id, hex: c.hex })),
    price: { min: result.price[0]?.min ?? 0, max: result.price[0]?.max ?? 0 },
  };
}

// GET /api/products/:slug
export async function getProductBySlug(req, res) {
  // .lean() returns a plain object (faster; Maps become plain objects automatically)
  const product = await Product.findOne({ slug: req.valid.params.slug }).select('-__v').lean();
  if (!product) throw ApiError.notFound('Product not found');
  res.json(product);
}
