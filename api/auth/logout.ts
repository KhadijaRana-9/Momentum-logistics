import { json, route } from '../_lib/http.ts';
import { clearSessionCookie, getSession } from '../_lib/auth.ts';
import { writeAudit } from '../_lib/audit.ts';

export default route({
  POST: async (req, res) => {
    const session = await getSession(req).catch(() => null);
    clearSessionCookie(res);
    if (session) {
      await writeAudit({ actor: session, action: 'auth.logout', entity: 'user', entityId: session.id, req });
    }
    json(res, 200, { ok: true });
  },
});
