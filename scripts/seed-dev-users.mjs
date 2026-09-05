#!/usr/bin/env node
/**
 * Development/staging seed script — Momentum Logistics test accounts.
 *
 * Creates one test user per role that actually exists in the current RBAC
 * system (api/_lib/models.ts: ROLE_PERMISSIONS). It does NOT invent roles —
 * see the "Skipped roles" note below for why Partner and Customer are not
 * seeded here.
 *
 * Reuses the app's own tools rather than a second auth/DB stack:
 *   - bcryptjs, at the same cost factor as api/_lib/auth.ts (12 rounds)
 *   - the mongodb driver, against the same MONGODB_URI / MONGODB_DB the API
 *     functions use (api/_lib/env.ts)
 *
 * Usage:
 *   NODE_ENV=development \
 *   SEED_SUPER_ADMIN_PASSWORD=... \
 *   SEED_ADMIN_PASSWORD=... \
 *   node scripts/seed-dev-users.mjs
 *
 *   npm run seed:dev-users        # same thing, via package.json
 *
 * Idempotent: re-running never duplicates or resets an existing account.
 * A user is only ever touched here if it already carries seedAccount:true
 * (set by this same script) — a real user who happened to reuse one of
 * these emails would never be modified.
 */

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12; // must match api/_lib/auth.ts

// ---------------------------------------------------------------------------
// Production guard — required, not optional, and not bypassable.
// ---------------------------------------------------------------------------
const nodeEnv = process.env.NODE_ENV ?? 'development';
const allowStaging = process.env.ALLOW_SEED_STAGING === 'true';

if (nodeEnv === 'production') {
  console.error(
    '[seed] Refusing to run: NODE_ENV=production. This script is for ' +
      'development/staging only and will never run against production, ' +
      'no override flag can change that. Create production users through ' +
      'the normal admin workflow instead.',
  );
  process.exit(1);
}

if (nodeEnv !== 'development' && !allowStaging) {
  console.error(
    `[seed] Refusing to run: NODE_ENV="${nodeEnv}" is neither "development" ` +
      'nor explicitly allowed for staging. Set NODE_ENV=development, or set ' +
      'ALLOW_SEED_STAGING=true if you intend to seed a staging database.',
  );
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error('[seed] MONGODB_URI is not set. Point it at your dev/staging database and retry.');
  process.exit(1);
}

// A lightweight sanity check: a URI that plainly names a production cluster
// stops the script even if NODE_ENV was set incorrectly by mistake.
if (/\bprod(uction)?\b/i.test(process.env.MONGODB_URI)) {
  console.error('[seed] MONGODB_URI looks like it points at a production database (matches /prod/i). Refusing to run.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Seed plan — one account per role that exists in ROLE_PERMISSIONS today.
//
// Skipped roles (see final report for the full rationale):
//   - "Partner": no partner role, permission, route, or data model exists
//     anywhere in this codebase. Seeding one would create a fake RBAC
//     boundary that protects nothing real.
//   - "Customer / end user": same — no customer role or customer-scoped
//     data model exists. The task spec explicitly says to skip this case
///    when the role isn't already supported, so it is skipped.
//
// Super Admin vs Admin/Staff both map to real, already-distinct existing
// roles (see api/_lib/models.ts ROLE_PERMISSIONS) rather than inventing a
// new "super_admin" role or bolting a permission override onto "admin":
//   - role "admin"          -> ROLE_PERMISSIONS.admin === '*' (every permission)
//   - role "sales_manager"  -> broad operational access, but missing
//                              users:manage / integrations:manage / chatbot:manage
// ---------------------------------------------------------------------------
const SEED_USERS = [
  {
    label: 'Super Admin',
    name: 'Seed Super Admin',
    email: 'superadmin@momentumlogistics.test',
    role: 'admin',
    passwordEnv: 'SEED_SUPER_ADMIN_PASSWORD',
  },
  {
    label: 'Admin / Staff',
    name: 'Seed Admin Staff',
    email: 'admin@momentumlogistics.test',
    role: 'sales_manager',
    passwordEnv: 'SEED_ADMIN_PASSWORD',
  },
];

function requirePassword(envVar) {
  const value = process.env[envVar];
  if (!value || value.length < 10) {
    console.error(`[seed] ${envVar} is not set (or is under 10 characters). Set it in your .env.local and retry.`);
    return null;
  }
  return value;
}

async function main() {
  const client = await MongoClient.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  const db = client.db(process.env.MONGODB_DB?.trim() || 'momentum');
  const users = db.collection('users');
  await users.createIndex({ email: 1 }, { unique: true }).catch(() => {});

  const results = [];

  for (const spec of SEED_USERS) {
    const password = requirePassword(spec.passwordEnv);
    if (!password) {
      results.push({ ...spec, outcome: 'skipped_missing_password' });
      continue;
    }

    const existing = await users.findOne({ email: spec.email });

    if (existing) {
      if (!existing.seedAccount) {
        console.warn(
          `[seed] "${spec.email}" already exists and is NOT marked as a seed account — leaving it completely untouched.`,
        );
        results.push({ ...spec, outcome: 'skipped_not_seed_owned' });
        continue;
      }
      // Already our account. Never touch passwordHash on an existing record —
      // only keep role/status in sync in case the seed spec above changed.
      await users.updateOne(
        { _id: existing._id },
        { $set: { role: spec.role, status: 'active', name: spec.name, updatedAt: new Date() } },
      );
      results.push({ ...spec, outcome: 'already_existed', id: String(existing._id) });
      continue;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const now = new Date();
    const doc = {
      name: spec.name,
      email: spec.email,
      passwordHash,
      role: spec.role,
      status: 'active',
      seedAccount: true,
      createdAt: now,
      updatedAt: now,
    };
    const result = await users.insertOne(doc);
    results.push({ ...spec, outcome: 'created', id: String(result.insertedId) });
  }

  await client.close();
  return results;
}

main()
  .then((results) => {
    console.log('\n[seed] Done. Never logging passwords — see .env.local for the values you set.\n');
    for (const r of results) {
      console.log(`  ${r.label.padEnd(14)} ${r.email.padEnd(35)} role=${(r.role ?? '-').padEnd(14)} -> ${r.outcome}`);
    }
    console.log('\n[seed] Skipped roles: Partner, Customer/End-user — neither exists in the current RBAC system. See the seed report for why.\n');
    const failed = results.some((r) => r.outcome === 'skipped_missing_password');
    process.exit(failed ? 1 : 0);
  })
  .catch((err) => {
    console.error('[seed] Failed:', err.message);
    process.exit(1);
  });
