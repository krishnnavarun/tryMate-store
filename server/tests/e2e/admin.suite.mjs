// Admin product API (Phase 8): permissions, validation, create / update / delete;
// order status changes and cancelling (stock goes back).

import { check, client, PASSWORD, TEST_PRODUCT_PREFIX, uniqueEmail } from './lib.mjs';

export async function runAdminSuite({ admin, productBody, product }) {
  console.log('\nAdmin');
  const customer = client();
  await customer('POST', '/auth/register', { json: { name: 'Customer', email: uniqueEmail('cust'), password: PASSWORD } });

  const body = { ...productBody, name: `${TEST_PRODUCT_PREFIX} Admin ${Date.now()}` };
  let r = await customer('POST', '/products', { json: body });
  check('customer can’t create → 403', r.status === 403, r);
  r = await client()('POST', '/products', { json: body });
  check('logged out can’t create → 401', r.status === 401, r);

  const invalid = [
    ['min > max', { sizeChart: { M: { chest: [98, 92] } }, stock: {} }],
    ['unsafe size label', { sizeChart: { 'X.L': { chest: [98, 104] } }, stock: {} }],
    ['stock for a size not in the chart', { stock: { XXXL: 2 } }],
    ['discount ≥ price', { discountPrice: 5000 }],
    ['unknown size-chart field', { sizeChart: { M: { hip: [90, 95] } }, stock: {} }],
  ];
  for (const [label, change] of invalid) {
    r = await admin('POST', '/products', { json: { ...body, ...change } });
    check(`rejects ${label} → 400`, r.status === 400, r);
  }

  r = await admin('POST', '/products', { json: body });
  check('admin creates → 201 with a slug', r.status === 201 && typeof r.body.slug === 'string', r);
  const { _id: id, slug } = r.body;
  r = await admin('POST', '/products', { json: body });
  check('same slug again → 409', r.status === 409, r);

  r = await admin('PUT', `/products/${id}`, { json: { ...body, price: 1100, discountPrice: null, stock: { S: 0, M: 7 } } });
  check('update: new price, discount removed, stock set', r.status === 200 && r.body.price === 1100 && r.body.discountPrice == null && r.body.stock.M === 7, r);
  r = await admin('GET', `/products/${slug}`);
  check('the public page shows the update', r.status === 200 && r.body.price === 1100, r);

  r = await admin('DELETE', `/products/${id}`);
  check('delete → 204', r.status === 204, r);
  r = await admin('DELETE', `/products/${id}`);
  check('delete again → 404', r.status === 404, r);

  console.log('\nOrders: status and cancelling');
  const ADDRESS = {
    fullName: 'Order Tester',
    phone: '+91 98765 43210',
    line1: '1 Test Street',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600001',
    country: 'India',
  };
  const stockOf = async (size) => (await client()('GET', `/products/${product.slug}`)).body.stock[size];
  const placeOrder = async () => {
    await customer('POST', '/cart/items', { json: { productId: product._id, size: 'XL', color: 'Olive', qty: 2 } });
    return customer('POST', '/orders', { json: { shippingAddress: ADDRESS } });
  };
  const before = await stockOf('XL');
  r = await placeOrder();
  const orderId = r.body._id;
  check('an order takes 2 from stock', r.status === 201 && (await stockOf('XL')) === before - 2, r);

  r = await customer('GET', '/admin/orders');
  check('customer can’t list all orders → 403', r.status === 403, r);
  r = await admin('GET', '/admin/orders?status=placed');
  const listed = r.body.find?.((o) => o._id === orderId);
  check('admin sees the order with the customer’s name and email', r.status === 200 && listed?.user?.email?.endsWith('@example.test'), r);
  r = await admin('PATCH', `/admin/orders/${orderId}`, { json: { status: 'delivered' } });
  check('placed → delivered (skipping shipped) → 409', r.status === 409 && r.body.error_code === 'INVALID_STATUS_CHANGE', r);
  r = await admin('PATCH', `/admin/orders/${orderId}`, { json: { status: 'lost' } });
  check('unknown status → 400', r.status === 400, r);
  r = await admin('PATCH', `/admin/orders/${orderId}`, { json: { status: 'shipped' } });
  check('admin marks it shipped', r.status === 200 && r.body.status === 'shipped', r);
  r = await customer('POST', `/orders/${orderId}/cancel`);
  check('a shipped order can’t be cancelled → 409', r.status === 409 && r.body.error_code === 'CANNOT_CANCEL', r);
  r = await admin('PATCH', `/admin/orders/${orderId}`, { json: { status: 'delivered' } });
  check('then delivered', r.status === 200 && r.body.status === 'delivered', r);

  r = await placeOrder();
  const secondId = r.body._id;
  const afterSecond = await stockOf('XL');
  r = await client()('POST', `/orders/${secondId}/cancel`);
  check('cancelling needs a login → 401', r.status === 401, r);
  r = await admin('POST', `/orders/${secondId}/cancel`);
  check('someone else can’t cancel it → 404', r.status === 404, r);
  r = await customer('POST', `/orders/${secondId}/cancel`);
  check('the customer cancels their order', r.status === 200 && r.body.status === 'cancelled', r);
  check('cancelling puts the 2 back in stock', (await stockOf('XL')) === afterSecond + 2);
  r = await customer('POST', `/orders/${secondId}/cancel`);
  check('cancelling twice → 409 (stock not returned twice)', r.status === 409 && (await stockOf('XL')) === afterSecond + 2, r);
}
