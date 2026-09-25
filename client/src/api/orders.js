import { api } from './client.js';

export async function createOrder(shippingAddress) {
  const { data } = await api.post('/orders', { shippingAddress });
  return data;
}

export async function fetchOrders({ signal } = {}) {
  const { data } = await api.get('/orders', { signal });
  return data;
}

export async function fetchOrder(id, { signal } = {}) {
  const { data } = await api.get(`/orders/${encodeURIComponent(id)}`, { signal });
  return data;
}
