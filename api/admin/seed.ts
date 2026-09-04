import { randomBytes } from 'node:crypto';
import { getDb, collection, ensureIndexes } from '../_lib/db.ts';
import { COLLECTIONS, type UserDoc } from '../_lib/models.ts';
import { badRequest, forbidden, json, route } from '../_lib/http.ts';
import { env } from '../_lib/env.ts';
import { hashPassword } from '../_lib/auth.ts';
import { validate } from '../_lib/validation.ts';
import { writeAudit } from '../_lib/audit.ts';

/**
 * One-time bootstrap: creates all indexes and the first admin user.
 * Protected by the SEED_SECRET env var. Safe to call repeatedly — it will not
 * create a second admin and never resets an existing password.
 *
 *   POST /api/admin/seed
 *   x-seed-secret: <SEED_SECRET>
 *   { "email": "you@company.com", "name": "Your Name", "password"?: "optional" }
 */
export default route({
  POST: async (req, res) => {
    if (!env.seedSecret) throw badRequest('SEED_SECRET is not configured on the server');
    const provided = req.headers['x-seed-secret'];
    if (provided !== env.seedSecret) throw forbidden('Invalid seed secret');

    const body = validate<{ email: string; name: string; password?: string }>(
      {
        email: { type: 'email', required: true },
        name: { type: 'string', required: true, min: 2, max: 80 },
        password: { type: 'string', min: 10, max: 200 },
      },
      req.body,
    );

    const db = await getDb();
    await ensureIndexes(db);

    const users = await collection<UserDoc>(COLLECTIONS.users);
    const existingAdmin = await users.findOne({ role: 'admin' });
    if (existingAdmin) {
      json(res, 200, {
        ok: true,
        message: 'Indexes ensured. An admin user already exists — no changes made.',
        adminEmail: existingAdmin.email,
      });
      return;
    }

    const generatedPassword = body.password ?? randomBytes(9).toString('base64url');
    const now = new Date();
    const doc: UserDoc = {
      name: body.name,
      email: body.email.toLowerCase(),
      passwordHash: await hashPassword(generatedPassword),
      role: 'admin',
      status: 'active',
      avatarColor: '#0b475b',
      createdAt: now,
      updatedAt: now,
    };
    await users.insertOne(doc);
    await writeAudit({ actor: null, action: 'admin.seed', entity: 'user', entityId: doc.email, req });

    json(res, 201, {
      ok: true,
      message: 'Admin user created and indexes ensured.',
      adminEmail: doc.email,
      // Only returned once, only when we generated it.
      generatedPassword: body.password ? undefined : generatedPassword,
    });
  },
});
