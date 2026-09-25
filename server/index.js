// Entry point: connect to MongoDB, then start the HTTP server.

import { config } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';

async function start() {
  try {
    await connectDB();
  } catch (err) {
    console.error(`❌ Could not connect to MongoDB at ${config.mongoUri}\n   ${err.message}`);
    console.error('   Is MongoDB running? Check MONGO_URI in server/.env');
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`🚀 API ready on http://localhost:${config.port}/api  (AI_MODE=${config.ai.mode})`);
  });

  // Close connections cleanly on Ctrl+C / when the host stops the process
  const shutdown = async (signal) => {
    console.log(`\n${signal} received, shutting down...`);
    server.close();
    await disconnectDB();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
