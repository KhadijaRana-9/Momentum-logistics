import { collection } from '../_lib/db.ts';
import { COLLECTIONS, ROLE_PERMISSIONS, type UserDoc } from '../_lib/models.ts';
import { conflict, json, route } from '../_lib/http.ts';
import { requireAuth, requirePermission, hashPassword } from '../_lib/auth.ts';
import { validate } from '../_lib/validation.ts';
import { writeAudit } from '../_lib/audit.ts';

const ROLES = Object.keys(ROLE_PERMISSIONS);

export default route({
  // Any authenticated staff member can see the team roster (needed for the
  // "assign lead" picker). Only non-sensitive fields are returned.
  GET: async (req, res) => {
    await requireAuth(req);
    const users = await collection<UserDoc>(COLLECTIONS.users);
    const items = await users
      .find({ status: { $ne: 'suspended' } }, { projection: { name: 1, email: 1, role: 1, status: 1, avatarColor: 1, lastLoginAt: 1 } })
      .sort({ name: 1 })
      .toArray();
    json(res, 200, {
      items: items.map((u) => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        avatarColor: u.avatarColor ?? null,
        lastLoginAt: u.lastLoginAt ?? null,
      })),
    });
  },

  POST: async (req, res) => {
    const session = await requirePermission(req, 'users:manage');
    const body = validate<{ name: string; email: string; role: string; password: string }>(
      {
        name: { type: 'string', required: true, min: 2, max: 80 },
        email: { type: 'email', required: true },
        role: { type: 'enum', values: ROLES, required: true },
        password: { type: 'string', required: true, min: 10, max: 200 },
      },
      req.body,
    );

    const users = await collection<UserDoc>(COLLECTIONS.users);
    if (await users.findOne({ email: body.email.toLowerCase() })) {
      throw conflict('A user with that email already exists');
    }

    const now = new Date();
    const doc: UserDoc = {
      name: body.name,
      email: body.email.toLowerCase(),
      passwordHash: await hashPassword(body.password),
      role: body.role,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    const result = await users.insertOne(doc);
    await writeAudit({ actor: session, action: 'user.created', entity: 'user', entityId: String(result.insertedId), meta: { role: body.role }, req });

    json(res, 201, { user: { id: String(result.insertedId), name: doc.name, email: doc.email, role: doc.role, status: doc.status } });
  },
});
