/**
 * Frontend mirror of api/_lib/models.ts ROLE_PERMISSIONS, for the read-only
 * "Roles & Permissions" matrix on the Users & Roles page. There is no API
 * endpoint for this (the project is at Vercel's 12-function limit and this
 * data changes rarely) — if the backend table changes, update this too.
 * The server is always the actual source of enforcement; this is a display.
 */

export const ROLES = ['admin', 'sales_manager', 'sales_rep', 'marketing', 'viewer'] as const;
export type RoleName = (typeof ROLES)[number];

export const PERMISSIONS = [
  'leads:view', 'leads:create', 'leads:edit', 'leads:assign', 'leads:delete',
  'followups:view', 'followups:manage',
  'analytics:view', 'content:manage', 'campaigns:manage',
  'chatbot:manage', 'integrations:manage', 'users:manage', 'audit:view',
] as const;
export type PermissionName = (typeof PERMISSIONS)[number];

export const ROLE_LABELS: Record<RoleName, string> = {
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  sales_rep: 'Sales Rep',
  marketing: 'Marketing',
  viewer: 'Viewer',
};

const ROLE_PERMISSIONS: Record<RoleName, '*' | PermissionName[]> = {
  admin: '*',
  sales_manager: [
    'leads:view', 'leads:create', 'leads:edit', 'leads:assign', 'leads:delete',
    'followups:view', 'followups:manage', 'analytics:view', 'content:manage',
    'campaigns:manage', 'audit:view',
  ],
  sales_rep: [
    'leads:view', 'leads:create', 'leads:edit',
    'followups:view', 'followups:manage', 'analytics:view',
  ],
  marketing: ['leads:view', 'analytics:view', 'content:manage', 'campaigns:manage', 'chatbot:manage'],
  viewer: ['leads:view', 'followups:view', 'analytics:view'],
};

export function roleHasPermission(role: string, permission: PermissionName): boolean {
  const p = ROLE_PERMISSIONS[role as RoleName];
  if (!p) return false;
  return p === '*' || p.includes(permission);
}

export function permissionCountForRole(role: string): number {
  const p = ROLE_PERMISSIONS[role as RoleName];
  if (!p) return 0;
  return p === '*' ? PERMISSIONS.length : p.length;
}
