import { getDb } from '../_lib/db.js';
import { env } from '../_lib/env.js';
import { email } from '../_lib/email.js';
import { badRequest, json, notFound, route } from '../_lib/http.js';
import { stringParam } from '../_lib/params.js';
import { LIST_CREATE } from '../_lib/ops/registry.js';

/**
 * GET  /api/ops?resource=health                 -> unauthenticated readiness probe
 *                                                    (was api/health.ts — merged here to
 *                                                    stay under Vercel's 12-function limit)
 * GET  /api/ops?resource=<name>&...filters       -> list
 * POST /api/ops?resource=<name>  { ...body }     -> create
 *
 * See _lib/ops/registry.ts for the full resource list (jobs, trips, vehicles,
 * drivers, workshops, maintenance, parts, tyres, expenses, fuel, invoices,
 * alerts, reports, vehiclePnl). Each resource's real logic lives in its own
 * _lib/ops/*.ts module — this file only routes by `?resource=`.
 */
export default route({
  GET: async (req, res) => {
    const resource = stringParam(req, 'resource');
    if (resource === 'health') return healthCheck(req, res);
    if (!resource || !LIST_CREATE[resource]?.list) throw notFound(`Unknown resource: ${resource ?? '(none)'}`);
    await LIST_CREATE[resource].list!(req, res);
  },
  POST: async (req, res) => {
    const resource = stringParam(req, 'resource');
    if (!resource || !LIST_CREATE[resource]?.create) throw badRequest(`Cannot create resource: ${resource ?? '(none)'}`);
    await LIST_CREATE[resource].create!(req, res);
  },
});

async function healthCheck(_req: import('@vercel/node').VercelRequest, res: import('@vercel/node').VercelResponse) {
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
}
