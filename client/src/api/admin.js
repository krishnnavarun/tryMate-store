import { api } from './client.js';

// product: the full product body (see server/validators/adminProduct.validators.js)
export async function createProduct(product) {
  const { data } = await api.post('/products', product);
  return data;
}

export async function updateProduct(id, product) {
  const { data } = await api.put(`/products/${id}`, product);
  return data;
}

export async function deleteProduct(id) {
  await api.delete(`/products/${id}`);
}

// Every order (optionally only one status), newest first, with the customer's name + email
export async function fetchAllOrders({ status, signal } = {}) {
  const { data } = await api.get('/admin/orders', { params: { status }, signal });
  return data;
}

// status: shipped | delivered | cancelled (cancelling puts the items back in stock)
export async function updateOrderStatus(id, status) {
  const { data } = await api.patch(`/admin/orders/${encodeURIComponent(id)}`, { status });
  return data;
}
