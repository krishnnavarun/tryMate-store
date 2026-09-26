import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { bestColorMatch, SUITS_YOU_MAX_DELTA_E } from '../utils/colorDistance.js';
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
// Logged-in users with suggested colours get a "suitsYou" tag on each item; with
// ?suitsMe=true only the products whose colours suit them are returned.
export async function listProducts(req, res) {
  const { category, type, color, minPrice, maxPrice, sort, page, limit, suitsMe } = req.valid.query;
  const suggestions = req.user?.fitProfile?.colorSuggestions ?? [];
  if (suitsMe && suggestions.length === 0) {
    throw new ApiError(409, 'NO_FIT_PROFILE', 'Scan your body first to see colours that suit you.');
  }

  const match = {};
  if (category) match.category = category;
  if (type) match.type = type;
  // Exact color name, case-insensitive ("navy" matches "Navy")
  if (color) match['colors.name'] = new RegExp(`^${escapeRegex(color)}$`, 'i');

  const priceMatch = {};
  if (minPrice != null) priceMatch.$gte = minPrice;
  if (maxPrice != null) priceMatch.$lte = maxPrice;

  const matchStages = [
    { $match: match },
    { $addFields: { effectivePrice: EFFECTIVE_PRICE } },
    ...(Object.keys(priceMatch).length ? [{ $match: { effectivePrice: priceMatch } }] : []),
  ];

  let items;
  let total;
  const filtersPromise = getFilterOptions(category);

  if (suitsMe) {
    // Colour distance (CIEDE2000) isn't something MongoDB can compute, so: fetch every
    // matching product (the catalogue is small), keep the ones that suit the user, then
    // sort and paginate here. By default the closest colour matches come first.
    const all = await Product.aggregate([...matchStages, { $sort: SORT_STAGES[sort] }, { $project: CARD_FIELDS }]);
    const suiting = all
      .map((item) => ({ ...item, suitsYou: suitsYouTag(item, suggestions) }))
      .filter((item) => item.suitsYou);
    if (sort === 'newest') suiting.sort((a, b) => a.suitsYou.deltaE - b.suitsYou.deltaE);
    total = suiting.length;
    items = suiting.slice((page - 1) * limit, page * limit);
  } else {
    const [result] = await Product.aggregate([
      ...matchStages,
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
    ]);
    total = result.total[0]?.count ?? 0;
    items = result.items.map((item) => ({ ...item, suitsYou: suitsYouTag(item, suggestions) }));
  }

  res.json({
    items,
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
    filters: await filtersPromise,
  });
}

// { color: "Olive", matches: "Olive", deltaE } when one of the product's colours is close
// to one of the user's suggested colours; otherwise null.
function suitsYouTag(product, suggestions) {
  if (!suggestions.length) return null;
  const best = bestColorMatch(product.colors, suggestions);
  if (!best || best.deltaE > SUITS_YOU_MAX_DELTA_E) return null;
  return { color: best.productColor, matches: best.suggestion, deltaE: Math.round(best.deltaE * 10) / 10 };
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
// For logged-in users with suggested colours, `suitingColors` lists the product's colours
// that suit them (same rule as the shop's "Suits you" tag).
export async function getProductBySlug(req, res) {
  // .lean() returns a plain object (faster; Maps become plain objects automatically)
  const product = await Product.findOne({ slug: req.valid.params.slug }).select('-__v').lean();
  if (!product) throw ApiError.notFound('Product not found');

  const suggestions = req.user?.fitProfile?.colorSuggestions ?? [];
  const suitingColors = suggestions.length
    ? product.colors.filter((c) => (bestColorMatch([c], suggestions)?.deltaE ?? Infinity) <= SUITS_YOU_MAX_DELTA_E).map((c) => c.name)
    : [];
  res.json({ ...product, suitingColors });
}
