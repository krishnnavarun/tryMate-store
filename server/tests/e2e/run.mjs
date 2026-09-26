// End-to-end tests against a RUNNING store server (and its AI: mock or real).
//
//   npm run dev              (in another terminal)
//   npm run test:e2e         (from the repo root or server/)
//
// Options (environment variables):
//   E2E_API_URL   default http://localhost:5000/api
//   E2E_PHOTO     a real full-body photo; required when the server runs with AI_MODE=real
//   E2E_TRYON=1   with AI_MODE=real, also run one real try-on (may cost money)
//
// Safe to run on your development database: the tests create their own users
// (…@example.test) and products ("E2E Test …"), and delete all of them — plus those users'
// carts and orders — when they finish, even if a test fails. Your products are never touched.

import mongoose from 'mongoose';
import { config } from '../../config/env.js';
import { Cart } from '../../models/Cart.js';
import { Order } from '../../models/Order.js';
import { Product } from '../../models/Product.js';
import { User } from '../../models/User.js';
import { runAdminSuite } from './admin.suite.mjs';
import { runAiSuite } from './ai.suite.mjs';
import { API, client, PASSWORD, summary, TEST_EMAIL_DOMAIN, TEST_PRODUCT_PREFIX, uniqueEmail } from './lib.mjs';
import { runShopSuite } from './shop.suite.mjs';

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The run's own product, with stock chosen for the tests (see shop.suite.mjs)
const PRODUCT = {
  name: `${TEST_PRODUCT_PREFIX} Tee ${Date.now()}`,
  brand: 'E2E',
  description: 'Created by npm run test:e2e and deleted when it finishes.',
  price: 1000,
  discountPrice: 800,
  category: 'upper_body',
  type: 'tshirt',
  gender: 'men',
  colors: [
    { name: 'Olive', hex: '#708238' },
    { name: 'Sky Blue', hex: '#87CEEB' },
  ],
  images: [
    'https://placehold.co/600x800/708238/FFFFFF/png?text=E2E+Olive',
    'https://placehold.co/600x800/87CEEB/222222/png?text=E2E+Sky+Blue',
  ],
  garmentImageUrl: 'https://placehold.co/768x1024/708238/FFFFFF/png?text=E2E+flat-lay',
  sizeChart: {
    S: { chest: [86, 92], waist: [74, 80], length: [68, 70], shoulder: [41, 43] },
    M: { chest: [92, 98], waist: [80, 86], length: [70, 72], shoulder: [43, 45] },
    L: { chest: [98, 104], waist: [86, 92], length: [72, 74], shoulder: [45, 47] },
    XL: { chest: [104, 110], waist: [92, 98], length: [74, 76], shoulder: [47, 49] },
  },
  stock: { S: 0, M: 8, L: 3, XL: 5 },
};

async function cleanUp() {
  const users = await User.find({ email: new RegExp(`${escape(TEST_EMAIL_DOMAIN)}$`) }, '_id').lean();
  const ids = users.map((u) => u._id);
  const [carts, orders, removedUsers, products] = await Promise.all([
    Cart.deleteMany({ user: { $in: ids } }),
    Order.deleteMany({ user: { $in: ids } }),
    User.deleteMany({ _id: { $in: ids } }),
    Product.deleteMany({ name: new RegExp(`^${escape(TEST_PRODUCT_PREFIX)} `) }),
  ]);
  console.log(
    `\nCleaned up: ${removedUsers.deletedCount} test users, ${carts.deletedCount} carts, ` +
      `${orders.deletedCount} orders, ${products.deletedCount} test products`,
  );
}

async function main() {
  const health = await fetch(`${API}/health`).then((r) => r.json()).catch(() => null);
  if (!health) {
    console.error(`❌ No store server at ${API}. Start it first (npm run dev), or set E2E_API_URL.`);
    process.exit(1);
  }
  console.log(`Store at ${API} · AI ${health.ai.mode} (${health.ai.status}) · database ${config.mongoUri}`);
  if (health.ai.status !== 'ok') console.log('⚠️  The AI service is not reachable: AI tests will fail.');

  // The tests talk to the server over HTTP; this direct DB connection is only for making
  // the test admin and for cleaning up. It must be the same database the server uses.
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });

  try {
    const admin = client();
    const adminEmail = uniqueEmail('admin');
    await admin('POST', '/auth/register', { json: { name: 'E2E Admin', email: adminEmail, password: PASSWORD } });
    await User.updateOne({ email: adminEmail }, { $set: { role: 'admin' } });

    const created = await admin('POST', '/products', { json: PRODUCT });
    if (created.status !== 201) throw new Error(`Could not create the test product: ${JSON.stringify(created.body)}`);
    const product = created.body;

    await runShopSuite({ product });
    await runAiSuite({ product, aiMode: health.ai.mode });
    await runAdminSuite({ admin, productBody: PRODUCT });
  } finally {
    await cleanUp();
    await mongoose.disconnect();
  }

  const { passed, failed } = summary();
  console.log(failed.length ? `\n❌ ${failed.length} failed, ${passed} passed` : `\n✅ All ${passed} checks passed`);
  process.exitCode = failed.length ? 1 : 0;
}

main().catch(async (err) => {
  console.error('❌', err.message);
  process.exitCode = 1;
});
