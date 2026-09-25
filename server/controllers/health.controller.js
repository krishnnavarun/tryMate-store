import axios from 'axios';
import { config } from '../config/env.js';
import { dbStatus } from '../config/db.js';

// Ask the AI service (or the mock) for its /health. Short timeout: this must stay fast.
async function checkAiService() {
  try {
    const { data } = await axios.get(`${config.ai.url}/health`, { timeout: 2000 });
    return { status: 'ok', version: data?.version ?? null };
  } catch {
    return { status: 'unreachable', version: null };
  }
}

// GET /api/health → server + DB + AI service status
// 200 when the store can serve requests (DB connected). The AI service being down
// doesn't make the store unusable, so it reports "degraded" instead of failing.
export async function getHealth(_req, res) {
  const db = dbStatus();
  const ai = await checkAiService();

  const status = db !== 'connected' ? 'down' : ai.status !== 'ok' ? 'degraded' : 'ok';

  res.status(status === 'down' ? 503 : 200).json({
    status,
    server: { status: 'ok', env: config.env, uptimeSec: Math.round(process.uptime()) },
    db: { status: db },
    ai: { status: ai.status, mode: config.ai.mode, url: config.ai.url, version: ai.version },
  });
}
