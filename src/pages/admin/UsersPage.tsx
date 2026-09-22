import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Minus, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Toolbar } from '@/components/ui/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { timeAgo } from '@/lib/utils';
import { ApiError } from '@/lib/apiClient';
import { crmApi } from '@/pages/crm/crmApi';
import type { TeamMember } from '@/pages/crm/types';
import { NewUserModal } from './NewUserModal';
import { PERMISSIONS, ROLES, ROLE_LABELS, permissionCountForRole, roleHasPermission } from './rolePermissions';

export function UsersPage() {
  const [tab, setTab] = useState('users');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const load = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    crmApi
      .team(signal)
      .then((res) => {
        setUsers(res.items);
        setError(null);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err instanceof ApiError ? err.message : 'Failed to load users');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const filtered = useMemo(
    () => users.filter((u) => `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(search.toLowerCase())),
    [users, search],
  );

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const u of users) counts[u.role] = (counts[u.role] ?? 0) + 1;
    return counts;
  }, [users]);

  const columns: Column<TeamMember>[] = [
    { key: 'name', header: 'User', render: (u) => (
      <div className="flex items-center gap-2.5">
        <Avatar name={u.name} color={u.avatarColor ?? undefined} size="sm" />
        <div>
          <p className="font-medium text-brand-950">{u.name}</p>
          <p className="text-xs text-slate-400">{u.email}</p>
        </div>
      </div>
    ) },
    { key: 'role', header: 'Role', render: (u) => <span className="text-slate-700">{ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role}</span> },
    { key: 'lastActive', header: 'Last Active', render: (u) => <span className="text-xs text-slate-500">{u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'Never signed in'}</span> },
    { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Users & Roles"
        description="Manage platform users, roles, and permission scopes."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Users & Roles' }]}
        actions={<Button variant="primary" size="sm" icon={Plus} onClick={() => setShowNew(true)}>New User</Button>}
      />

      {error && <Card className="mb-4 p-4 text-sm text-rose-700">{error}</Card>}

      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        tabs={[{ id: 'users', label: 'Users', count: users.length }, { id: 'roles', label: 'Roles & Permissions', count: ROLES.length }]}
      />

      {tab === 'users' && (
        <>
          <Toolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, role..." className="sm:max-w-xs" />
          </Toolbar>
          <Card>
            {loading ? <div className="p-5"><TableSkeleton columns={4} /></div> : <DataTable columns={columns} data={filtered} keyField={(u) => u.id} pageSize={10} />}
          </Card>
        </>
      )}

      {tab === 'roles' && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ROLES.map((r) => (
              <Card key={r} className="p-4">
                <p className="text-[13.5px] font-semibold text-brand-950">{ROLE_LABELS[r]}</p>
                <p className="mt-1 text-xs text-slate-500">{permissionCountForRole(r)} of {PERMISSIONS.length} permissions</p>
                <p className="mt-3 text-xs font-medium text-brand-700">{roleCounts[r] ?? 0} user{(roleCounts[r] ?? 0) !== 1 ? 's' : ''}</p>
              </Card>
            ))}
          </div>

          <Card>
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="font-display text-[15px] font-semibold text-brand-950">Permission Matrix</h3>
              <p className="mt-0.5 text-xs text-slate-500">Enforced on the server for every request — this table mirrors it for reference.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Permission</th>
                    {ROLES.map((r) => (
                      <th key={r} className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">{ROLE_LABELS[r]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSIONS.map((perm) => (
                    <tr key={perm} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 text-[13px] font-medium text-brand-950">{perm}</td>
                      {ROLES.map((r) => (
                        <td key={r} className="px-3 py-3 text-center">
                          <AccessIcon granted={roleHasPermission(r, perm)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      <NewUserModal open={showNew} onClose={() => setShowNew(false)} onCreated={() => load()} />
    </div>
  );
}

function AccessIcon({ granted }: { granted: boolean }) {
  if (granted) return <span className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check size={12} strokeWidth={3} /></span>;
  return <span className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Minus size={12} strokeWidth={3} /></span>;
}
