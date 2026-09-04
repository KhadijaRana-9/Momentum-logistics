import { collection } from '../_lib/db.ts';
import { COLLECTIONS, permissionsForRole, type UserDoc } from '../_lib/models.ts';
import { badRequest, json, route, unauthorized } from '../_lib/http.ts';
import { validate } from '../_lib/validation.ts';
import { setSessionCookie, signSession, verifyPassword } from '../_lib/auth.ts';
import { rateLimit } from '../_lib/rateLimit.ts';
import { writeAudit } from '../_lib/audit.ts';

export default route({
  POST: async (req, res) => {
    await rateLimit(req, { name: 'login', limit: 10, windowMs: 5 * 60_000 });

    const body = validate<{ email: string; password: string }>(
      { email: { type: 'email', required: true }, password: { type: 'string', required: true, min: 1, max: 200 } },
      req.body,
    );

    const users = await collection<UserDoc>(COLLECTIONS.users);
    const user = await users.findOne({ email: body.email.toLowerCase() });

    // Constant-ish work whether or not the user exists (mitigates enumeration).
    const ok = user ? await verifyPassword(body.password, user.passwordHash) : await verifyPassword(body.password, '$2a$12$0000000000000000000000000000000000000000000000000000');

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
  },
});
