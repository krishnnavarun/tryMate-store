// Give an existing account the admin role (registration always creates customers).
//
//   npm run make-admin -- you@example.com            (from the repo root or server/)
//   npm run make-admin -- you@example.com --remove   (back to customer)

import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';

const email = process.argv[2]?.trim().toLowerCase();
const remove = process.argv.includes('--remove');

if (!email || email.startsWith('--')) {
  console.error('Usage: npm run make-admin -- <email> [--remove]');
  process.exit(1);
}

await connectDB();
try {
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { role: remove ? 'customer' : 'admin' } },
    { returnDocument: 'after' },
  );
  if (!user) {
    console.error(`❌ No account with email ${email}. Register it in the store first.`);
    process.exitCode = 1;
  } else {
    console.log(`✅ ${user.email} is now ${user.role === 'admin' ? 'an admin' : 'a customer'}. Refresh the store page to see the change.`);
  }
} finally {
  await disconnectDB();
}
