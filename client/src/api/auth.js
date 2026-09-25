import { api } from './client.js';

// The server sets/clears an httpOnly cookie; the client never sees the token itself.

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data.user;
}

export async function login({ email, password }) {
  const { data } = await api.post('/auth/login', { email, password });
  return data.user;
}

export async function register({ name, email, password }) {
  const { data } = await api.post('/auth/register', { name, email, password });
  return data.user;
}

export async function logout() {
  await api.post('/auth/logout');
}
