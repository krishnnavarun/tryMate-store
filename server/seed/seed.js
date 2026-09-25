// Replace all products with the seed catalog.
//
//   npm run seed                  (from the repo root or server/)
//
// Only the `products` collection is touched. Users, carts and orders are left alone.
// Refuses to run with NODE_ENV=production unless you pass --force.

import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { Product } from '../models/Product.js';
import { products } from './products.data.js';

async function seed() {
  if (config.isProduction && !process.argv.includes('--force')) {
    console.error('❌ Refusing to seed with NODE_ENV=production. Re-run with --force if you really mean it.');
    process.exit(1);
  }

  await connectDB();
  console.log(`🌱 Seeding products into database "${mongoose.connection.name}"...`);

  const { deletedCount } = await Product.deleteMany({});
  console.log(`   removed ${deletedCount} existing products`);

  // create() (unlike insertMany) runs the full save middleware, e.g. slug generation
  const created = await Product.create(products);
  await Product.syncIndexes();
  console.log(`   inserted ${created.length} products`);
  for (const p of created) console.log(`   • ${p.slug}`);
}

seed()
  .then(() => console.log('✅ Seed complete'))
  .catch((err) => {
    console.error('❌ Seed failed:', err.message);
    process.exitCode = 1;
  })
  .finally(disconnectDB);
