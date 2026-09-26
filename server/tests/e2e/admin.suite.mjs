// Admin product API (Phase 8): permissions, validation, create / update / delete.

import { check, client, PASSWORD, TEST_PRODUCT_PREFIX, uniqueEmail } from './lib.mjs';

export async function runAdminSuite({ admin, productBody }) {
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
}
