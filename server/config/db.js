import mongoose from 'mongoose';
import { config } from './env.js';

// Remove fields that aren't in the schema from query filters, so stray user input
// can never turn into a filter on some unexpected field.
mongoose.set('strictQuery', true);

export async function connectDB() {
  // serverSelectionTimeoutMS: fail after 5 s if MongoDB isn't running (default is 30 s)
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
  const { host, port, name } = mongoose.connection;
  console.log(`✅ MongoDB connected: ${host}:${port}/${name}`);
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

// Human-readable connection state for /api/health
export function dbStatus() {
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  return states[mongoose.connection.readyState] ?? 'unknown';
}
