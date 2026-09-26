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
