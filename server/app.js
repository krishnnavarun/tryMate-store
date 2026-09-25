// Builds the Express app (no listen() here, so it can be imported by tests/scripts).

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

export function createApp() {
  const app = express();

  // Hosts like Render/Railway sit behind a proxy; needed for correct client IPs (rate limits)
  if (config.isProduction) app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: config.clientUrl, // only our React app may call the API from a browser
      credentials: true, // allow cookies (auth, Phase 2)
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser()); // fills req.cookies (the auth token lives in a cookie)

  app.use('/api', apiRoutes);
  app.use('/api', notFound);

  app.use(errorHandler);
  return app;
}
