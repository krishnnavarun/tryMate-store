import { api } from './client.js';

// params: { category, type, color, minPrice, maxPrice, sort, page, limit, suitsMe }
// → { items, page, limit, total, pages, filters: { types, colors, price: { min, max } } }
// Items carry `suitsYou` ({ color, matches } or null) for logged-in users with a fit profile.
export async function fetchProducts(params = {}, { signal } = {}) {
  const { data } = await api.get('/products', { params, signal });
  return data;
}

// Full product; `suitingColors` = names of its colours that suit the logged-in user
export async function fetchProduct(slug, { signal } = {}) {
  const { data } = await api.get(`/products/${encodeURIComponent(slug)}`, { signal });
  return data;
}

// → { recommendedSize, perSize: { S: { score, note } ... }, fitPreference }
export async function fetchSizeRecommendation(productId, { signal } = {}) {
  const { data } = await api.get(`/products/${productId}/size-recommendation`, { signal });
  return data;
}

// → { resultImage (URL or data: URL), latencyMs, provider }. Can take up to ~2 minutes.
export async function tryOnProduct(productId, { photo, color, signal }) {
  const form = new FormData();
  form.append('image', photo, photo.name || 'photo.jpg');
  if (color) form.append('color', color);
  const { data } = await api.post(`/products/${productId}/try-on`, form, { timeout: 140_000, signal });
  return data;
}
