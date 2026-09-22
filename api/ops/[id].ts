import { badRequest, json, notFound, route } from '../_lib/http.js';
import { objectIdParam, stringParam } from '../_lib/params.js';
import { ITEM } from '../_lib/ops/registry.js';

/**
 * GET   /api/ops/:id?resource=<name>                  -> detail
 * PATCH /api/ops/:id?resource=<name>  { ...body }      -> edit
 * POST  /api/ops/:id?resource=<name>&action=<action>   -> named state transition
 */
export default route({
  GET: async (req, res) => {
    const resource = stringParam(req, 'resource');
    const id = objectIdParam(req);
    const entry = resource ? ITEM[resource] : undefined;
    if (!entry?.get) throw notFound(`Unknown resource: ${resource ?? '(none)'}`);
    await entry.get(req, res, id);
  },
  PATCH: async (req, res) => {
    const resource = stringParam(req, 'resource');
    const id = objectIdParam(req);
    const entry = resource ? ITEM[resource] : undefined;
    if (!entry?.update) throw badRequest(`Cannot edit resource: ${resource ?? '(none)'}`);
    await entry.update(req, res, id);
  },
  POST: async (req, res) => {
    const resource = stringParam(req, 'resource');
    const action = stringParam(req, 'action');
    const id = objectIdParam(req);
    const entry = resource ? ITEM[resource] : undefined;
    const handler = action ? entry?.actions?.[action] : undefined;
    if (!handler) {
      json(res, 404, { error: `Unknown action "${action ?? ''}" for resource "${resource ?? ''}"`, code: 'not_found' });
      return;
    }
    await handler(req, res, id);
  },
});
