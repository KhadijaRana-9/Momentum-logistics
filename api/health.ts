import { getDb } from './_lib/db.js';
import { json, route } from './_lib/http.js';
import { env } from './_lib/env.js';
import { email } from './_lib/email.js';

/** Lightweight readiness probe — does not leak connection details. */
export default route({
  GET: async (_req, res) => {
    let db: 'ok' | 'error' = 'error';
    try {
      const database = await getDb();
      await database.command({ ping: 1 });
      db = 'ok';
    } catch {
      db = 'error';
    }
    json(res, db === 'ok' ? 200 : 503, {
      status: db === 'ok' ? 'ok' : 'degraded',
      services: {
        database: db,
        email: email.isConfigured ? 'configured' : 'not_configured',
        ai: env.ai.provider ? 'configured' : 'not_configured',
      },
      time: new Date().toISOString(),
    });
  },
});
