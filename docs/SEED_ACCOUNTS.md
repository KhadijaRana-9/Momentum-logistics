# Development/staging test accounts

`scripts/seed-dev-users.mjs` creates a small set of test accounts against
whichever `MONGODB_URI` is currently set — **never production**. The script
hard-refuses to run when `NODE_ENV=production`, with no override, and also
refuses by default unless `NODE_ENV=development` (or `ALLOW_SEED_STAGING=true`
is set for a deliberate staging run).

Run it with:

```bash
npm run seed:dev-users
```

It reads its passwords from environment variables — set real values in your
own `.env.local` (already git-ignored), never in this file or in source:

| Env var | Account |
|---|---|
| `SEED_SUPER_ADMIN_PASSWORD` | Super Admin |
| `SEED_ADMIN_PASSWORD` | Admin / Staff |
| `SEED_PARTNER_PASSWORD` | *(reserved — not used; see below)* |
| `SEED_CUSTOMER_PASSWORD` | *(reserved — not used; see below)* |

## Accounts created

| Account | Email | Role used | Why this role |
|---|---|---|---|
| Super Admin | `superadmin@momentumlogistics.test` | `admin` | The existing `admin` role already carries every permission (`ROLE_PERMISSIONS.admin === '*'`) — this **is** the system's super-admin tier, so the seed reuses it rather than inventing a `super_admin` role. |
| Admin / Staff | `admin@momentumlogistics.test` | `sales_manager` | The closest existing role to "operational admin without full system access": leads, follow-ups, content, campaigns, and audit-log viewing, but **not** `users:manage`, `integrations:manage`, or `chatbot:manage`. |

Both accounts are idempotent: re-running the script never resets an existing
password or duplicates a user. Each is stamped `seedAccount: true` in MongoDB
so the script only ever updates records it created itself.

## Partner and Customer — intentionally not seeded

The task these accounts were requested for asked for a Partner and a
Customer/end-user test account. Neither was created, because **neither role
exists in this application**:

- There is no `partner` role in `ROLE_PERMISSIONS`, no partner-scoped API
  route, and no partner data model.
- There is no customer/end-user role, portal, or customer-scoped data model
  either.

Seeding accounts for roles that don't exist would create a fake permission
boundary that doesn't actually protect anything — the request that specified
these accounts explicitly says not to invent a customer role if one isn't
already supported, and the same reasoning applies to Partner here. When a
real Partner or Customer role is designed and wired into `ROLE_PERMISSIONS`
and the API, add the corresponding entry to `SEED_USERS` in
`scripts/seed-dev-users.mjs` — the two placeholder environment variables are
already reserved for that.

## What each account can/can't do (verified)

- Super Admin: full CRM + admin access, including creating other staff users
  (`POST /api/users`, requires `users:manage`) and viewing the audit trail.
- Admin/Staff: full lead/pipeline/follow-up/content access, but **cannot**
  create staff users or manage integrations — the API returns `403
  forbidden` for those, and the corresponding admin screens
  (`/app/admin/users`, `/app/admin/audit`) are hidden behind the same
  permissions in the frontend router.
- Anyone not logged in gets `401 unauthorized` from every protected API
  route and is redirected to `/login` for every protected page.
