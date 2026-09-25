import { api } from './client.js';

// Every cart call returns the whole cart:
// { items: [{ _id, product, size, color, qty, unitPrice, lineTotal, available, inStock }],
//   itemCount, subtotal, hasStockIssues }

export async function fetchCart() {
  const { data } = await api.get('/cart');
  return data;
}

export async function addCartItem({ productId, size, color, qty = 1 }) {
  const { data } = await api.post('/cart/items', { productId, size, color, qty });
  return data;
}

export async function updateCartItem(itemId, qty) {
  const { data } = await api.patch(`/cart/items/${itemId}`, { qty });
  return data;
}

export async function removeCartItem(itemId) {
  const { data } = await api.delete(`/cart/items/${itemId}`);
  return data;
}
