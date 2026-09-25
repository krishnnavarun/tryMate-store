import { api } from './client.js';

// params: { category, type, color, minPrice, maxPrice, sort, page, limit }
// → { items, page, limit, total, pages, filters: { types, colors, price: { min, max } } }
export async function fetchProducts(params = {}, { signal } = {}) {
  const { data } = await api.get('/products', { params, signal });
  return data;
}

export async function fetchProduct(slug, { signal } = {}) {
  const { data } = await api.get(`/products/${encodeURIComponent(slug)}`, { signal });
  return data;
}
