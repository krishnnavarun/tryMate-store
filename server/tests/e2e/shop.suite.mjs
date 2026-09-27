// Auth, cart and orders (Phase 2), on the run's own test product:
// stock S 0 (sold out), M 8, L 3, XL 5 · price 1000, discount 800 · colours Olive, Sky Blue

import { check, client, PASSWORD, uniqueEmail } from './lib.mjs';

const ADDRESS = {
  fullName: 'Test Buyer',
  phone: '+91 98765 43210',
  line1: '1 Test Street',
  city: 'Chennai',
  state: 'Tamil Nadu',
  postalCode: '600001',
  country: 'India',
};

export async function runShopSuite({ product }) {
  const email = uniqueEmail('buyer');
  const a = client();
  const b = client();

  console.log('\nAuth');
  let r = await a('GET', '/auth/me');
  check('me when logged out → 200 { user: null }', r.status === 200 && r.body.user === null, r);
  r = await a('POST', '/auth/register', { json: { name: 'Test Buyer', email, password: 'short' } });
  check('weak password → 400', r.status === 400 && r.body.error_code === 'VALIDATION_ERROR', r);
  r = await a('POST', '/auth/register', { json: { name: 'Test Buyer', email: email.toUpperCase(), password: PASSWORD } });
  check('register → 201, email lower-cased, no hash', r.status === 201 && r.body.user.email === email && !('passwordHash' in r.body.user), r);
  check('cookie is httpOnly + SameSite=Lax', /HttpOnly/i.test(r.setCookie ?? '') && /SameSite=Lax/i.test(r.setCookie ?? ''), r.setCookie);
  check('new accounts are customers', r.body.user?.role === 'customer', r.body);
  r = await b('POST', '/auth/register', { json: { name: 'Dup', email, password: PASSWORD, role: 'admin' } });
  check('duplicate email → 409', r.status === 409 && r.body.error_code === 'CONFLICT', r);
  r = await b('POST', '/auth/login', { json: { email, password: 'wrong-password' } });
  check('wrong password → 401 generic message', r.status === 401 && r.body.message === 'Invalid email or password', r);
  r = await b('POST', '/auth/login', { json: { email: `nobody${email}`, password: PASSWORD } });
  check('unknown email → the same 401', r.status === 401 && r.body.message === 'Invalid email or password', r);
  r = await b('POST', '/auth/login', { json: { email, password: PASSWORD } });
  check('login → 200', r.status === 200 && r.body.user.email === email, r);
  r = await b('POST', '/auth/logout');
  check('logout → 204 and clears the cookie', r.status === 204 && /trymate_token=;/.test(r.setCookie ?? ''), r.setCookie);

  console.log('\nCart');
  const id = product._id;
  r = await b('GET', '/cart');
  check('cart when logged out → 401', r.status === 401, r);
  r = await a('POST', '/cart/items', { json: { productId: id, size: 'M', color: 'Olive', qty: 2 } });
  check('add → 201, priced at the discount', r.status === 201 && r.body.itemCount === 2 && r.body.subtotal === 1600, r.body);
  r = await a('POST', '/cart/items', { json: { productId: id, size: 'M', color: 'Olive', qty: 1 } });
  check('same product/size/colour merges into one line', r.body.items.length === 1 && r.body.items[0].qty === 3, r.body);
  r = await a('POST', '/cart/items', { json: { productId: id, size: 'M', color: 'Sky Blue' } });
  check('another colour is a new line with its own image', r.body.items.length === 2 && r.body.items[1].product.image.includes('87CEEB'), r.body);
  r = await a('POST', '/cart/items', { json: { productId: id, size: 'S', color: 'Olive' } });
  check('sold-out size → 409 OUT_OF_STOCK', r.status === 409 && r.body.error_code === 'OUT_OF_STOCK', r);
  r = await a('POST', '/cart/items', { json: { productId: id, size: 'L', color: 'Olive', qty: 4 } });
  check('more than in stock → 409 "Only 3 left"', r.status === 409 && /Only 3 left/.test(r.body.message), r);
  r = await a('POST', '/cart/items', { json: { productId: id, size: 'XS', color: 'Olive' } });
  check('unknown size → 400', r.status === 400, r);
  r = await a('POST', '/cart/items', { json: { productId: id, size: 'M', color: 'Purple' } });
  check('unknown colour → 400', r.status === 400, r);
  r = await a('POST', '/cart/items', { json: { productId: 'nope', size: 'M', color: 'Olive' } });
  check('bad product id → 400', r.status === 400, r);
  const lineId = (await a('GET', '/cart')).body.items[1]._id;
  r = await a('PATCH', `/cart/items/${lineId}`, { json: { qty: 4 } });
  check('change quantity', r.status === 200 && r.body.items[1].qty === 4, r);
  r = await a('PATCH', `/cart/items/${lineId}`, { json: { qty: 11 } });
  check('quantity over 10 → 400', r.status === 400, r);
  r = await a('DELETE', `/cart/items/${lineId}`);
  check('remove a line', r.status === 200 && r.body.items.length === 1, r);
  r = await a('DELETE', `/cart/items/${lineId}`);
  check('remove it again → 404', r.status === 404, r);

  console.log('\nOrders');
  const stockOf = async (size) => (await a('GET', `/products/${product.slug}`)).body.stock[size];
  r = await a('POST', '/orders', { json: { shippingAddress: { ...ADDRESS, phone: 'x' } } });
  check('invalid phone → 400', r.status === 400, r);
  const before = await stockOf('M');
  r = await a('POST', '/orders', { json: { shippingAddress: ADDRESS } });
  check('place order → 201 with the price paid', r.status === 201 && r.body.total === 2400 && r.body.items[0].price === 800, r);
  const orderId = r.body._id;
  check('stock went down by 3', before - (await stockOf('M')) === 3);
  r = await a('GET', '/cart');
  check('cart is empty afterwards', r.body.items.length === 0, r.body);
  r = await a('POST', '/orders', { json: { shippingAddress: ADDRESS } });
  check('order with an empty cart → 400 CART_EMPTY', r.status === 400 && r.body.error_code === 'CART_EMPTY', r);
  r = await a('GET', '/orders');
  check('order list', r.status === 200 && r.body.length === 1 && r.body[0]._id === orderId, r);
  r = await a('GET', `/orders/${orderId}`);
  check('order detail', r.status === 200 && r.body.shippingAddress.city === 'Chennai', r);

  const c = client();
  await c('POST', '/auth/register', { json: { name: 'Other', email: uniqueEmail('other'), password: PASSWORD } });
  r = await c('GET', `/orders/${orderId}`);
  check("someone else's order → 404", r.status === 404, r);

  // Two buyers want the last items (L has 3): the second order must fail and change nothing
  await a('POST', '/cart/items', { json: { productId: id, size: 'L', color: 'Olive', qty: 3 } });
  await c('POST', '/cart/items', { json: { productId: id, size: 'L', color: 'Olive', qty: 2 } });
  r = await c('POST', '/orders', { json: { shippingAddress: ADDRESS } });
  check('first buyer gets 2 of the 3', r.status === 201, r);
  r = await a('POST', '/orders', { json: { shippingAddress: ADDRESS } });
  check('second buyer (wants 3) → 409 OUT_OF_STOCK', r.status === 409 && r.body.error_code === 'OUT_OF_STOCK', r);
  check('the failed order left 1 in stock', (await stockOf('L')) === 1);
  r = await a('GET', '/cart');
  check('the failed order kept the cart and flags the problem', r.body.items.length === 1 && r.body.hasStockIssues === true, r.body);

  console.log('\nSearch');
  const search = async (q) => a('GET', `/products?q=${encodeURIComponent(q)}&limit=48`);
  const found = (res) => res.body.items?.some((p) => p._id === id);
  r = await search(product.name);
  check('the full product name finds exactly that product', r.status === 200 && r.body.total === 1 && found(r), r.body);
  r = await search('olive e2e');
  check('words match in any order, colours included ("olive e2e")', found(r), r.body);
  r = await search('E2E tees');
  check('plurals and the type work ("tees" finds a tee)', found(r), r.body);
  r = await search('e2e polo');
  check('every word must match ("e2e polo" finds nothing)', r.status === 200 && r.body.total === 0, r.body);
  r = await search('x'.repeat(81));
  check('a search over 80 characters → 400', r.status === 400, r);
}
