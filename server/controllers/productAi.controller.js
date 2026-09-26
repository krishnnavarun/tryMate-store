// AI features on a product page: size recommendation and virtual try-on.

import { Product } from '../models/Product.js';
import { recommendSize, tryOn } from '../services/aiClient.js';
import { getCachedRecommendation, setCachedRecommendation } from '../services/recommendationCache.js';
import { ApiError } from '../utils/ApiError.js';

async function findProduct(id) {
  const product = await Product.findById(id).lean();
  if (!product) throw ApiError.notFound('Product not found');
  return product;
}

// GET /api/products/:id/size-recommendation
// → { recommendedSize, perSize: { S: { score, note }, ... }, fitPreference }
export async function getSizeRecommendation(req, res) {
  const { fitProfile, fitPreference, _id: userId } = req.user;
  if (!fitProfile?.measurements) {
    throw new ApiError(409, 'NO_FIT_PROFILE', 'Scan your body first to get a size recommendation.');
  }
  const product = await findProduct(req.valid.params.id);

  const cached = getCachedRecommendation(userId, product._id, fitPreference, product.updatedAt);
  if (cached) return res.json(cached);

  const result = await recommendSize({
    measurements: fitProfile.measurements,
    sizeChart: product.sizeChart,
    category: product.category,
    fitPreference,
    requestId: req.id,
  });
  const body = {
    recommendedSize: result.recommended_size,
    perSize: result.per_size,
    fitPreference,
  };
  setCachedRecommendation(userId, product._id, fitPreference, product.updatedAt, body);
  res.json(body);
}

// POST /api/products/:id/try-on  (multipart: image, color?)
// The photo is forwarded from memory and discarded; nothing about it is stored.
// → { resultImage (URL or data: URL), latencyMs, provider }
export async function tryOnProduct(req, res) {
  const product = await findProduct(req.valid.params.id);
  const color = req.valid.body.color ?? product.colors[0]?.name;

  const result = await tryOn({
    file: req.file,
    garmentImageUrl: product.garmentImageUrl,
    category: product.category,
    garmentDescription: `${color ?? ''} ${product.name}`.trim(),
    requestId: req.id,
  });

  // Exactly one of the two is set; a data: URL can go straight into an <img src>
  const resultImage = result.result_image_url ?? `data:image/jpeg;base64,${result.result_image_base64}`;
  res.json({ resultImage, latencyMs: result.latency_ms, provider: result.provider });
}
