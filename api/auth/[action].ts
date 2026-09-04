import { collection } from '../_lib/db.js';
import { COLLECTIONS, permissionsForRole, type UserDoc } from '../_lib/models.js';
import { badRequest, json, notFound, route, unauthorized } from '../_lib/http.js';
import { validate } from '../_lib/validation.js';
import { clearSessionCookie, getSession, setSessionCookie, signSession, verifyPassword } from '../_lib/auth.js';
import { rateLimit } from '../_lib/rateLimit.js';
import { writeAudit } from '../_lib/audit.js';
import { stringParam } from '../_lib/params.js';

/**
 * Consolidated auth endpoint (keeps the function count under the Vercel Hobby
 * limit): /api/auth/login, /api/auth/logout, /api/auth/me all route here via
 * the [action] dynamic segment.
 */
export default route({
  GET: async (req, res) => {
    const action = stringParam(req, 'action');
    if (action !== 'me') throw notFound();

    const session = await getSession(req);
    json(res, 200, { user: session });
  },

  POST: async (req, res) => {
    const action = stringParam(req, 'action');

    if (action === 'login') {
      await rateLimit(req, { name: 'login', limit: 10, windowMs: 5 * 60_000 });

      const body = validate<{ email: string; password: string }>(
        { email: { type: 'email', required: true }, password: { type: 'string', required: true, min: 1, max: 200 } },
        req.body,
      );

      const users = await collection<UserDoc>(COLLECTIONS.users);
      const user = await users.findOne({ email: body.email.toLowerCase() });

      const ok = user
        ? await verifyPassword(body.password, user.passwordHash)
        : await verifyPassword(body.password, '$2a$12$0000000000000000000000000000000000000000000000000000');

      if (!user || !ok) {
        await writeAudit({ actor: null, action: 'auth.login_failed', entity: 'user', entityId: body.email, req });
        throw unauthorized('Invalid email or password');
      }
      if (user.status === 'suspended') throw badRequest('This account has been suspended');

      await users.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date(), updatedAt: new Date() } });

      const token = signSession(user);
      setSessionCookie(res, token);

      await writeAudit({
        actor: { id: String(user._id), name: user.name, email: user.email, role: user.role, permissions: [] },
        action: 'auth.login',
        entity: 'user',
        entityId: String(user._id),
        req,
      });

      json(res, 200, {
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions ?? permissionsForRole(user.role),
        },
      });
      return;
    }

    if (action === 'logout') {
      const session = await getSession(req).catch(() => null);
      clearSessionCookie(res);
      if (session) {
        await writeAudit({ actor: session, action: 'auth.logout', entity: 'user', entityId: session.id, req });
      }
      json(res, 200, { ok: true });
      return;
    }

    throw notFound();
  },
});
