import { useMemo, useState } from 'react';
import { Check, Minus, Plus, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Toolbar } from '@/components/ui/Toolbar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { users, roles, permissionMatrix } from '@/data/users';
import type { User } from '@/data/types';
import { timeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function UsersPage() {
  const [tab, setTab] = useState('users');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => users.filter((u) => `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(search.toLowerCase())), [search]);

  const columns: Column<User>[] = [
    { key: 'name', header: 'User', render: (u) => (
      <div className="flex items-center gap-2.5">
        <Avatar name={u.name} color={u.avatarColor} size="sm" />
        <div>
          <p className="font-medium text-brand-950">{u.name}</p>
          <p className="text-xs text-slate-400">{u.email}</p>
        </div>
      </div>
    ) },
    { key: 'role', header: 'Role', render: (u) => <span className="text-slate-700">{u.role}</span> },
    { key: 'department', header: 'Department', render: (u) => <span className="text-slate-600">{u.department}</span> },
    { key: 'branch', header: 'Branch', render: (u) => <span className="text-slate-600">{u.branch}</span> },
    { key: 'lastActive', header: 'Last Active', render: (u) => <span className="text-xs text-slate-500">{u.lastActive === '—' ? '—' : timeAgo(u.lastActive)}</span> },
    { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Users & Roles"
        description="Manage platform users, roles, and permission scopes."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Users & Roles' }]}
        actions={<Button variant="primary" size="sm" icon={Plus}>Invite User</Button>}
      />

      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        tabs={[{ id: 'users', label: 'Users', count: users.length }, { id: 'roles', label: 'Roles & Permissions', count: roles.length }]}
      />

      {tab === 'users' && (
        <>
          <Toolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, role..." className="sm:max-w-xs" />
          </Toolbar>
          <Card>
            <DataTable columns={columns} data={filtered} keyField={(u) => u.id} pageSize={10} />
          </Card>
        </>
      )}

      {tab === 'roles' && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((r) => (
              <Card key={r.name} className="p-4">
                <p className="text-[13.5px] font-semibold text-brand-950">{r.name}</p>
                <p className="mt-1 text-xs text-slate-500">{r.permissions}</p>
                <p className="mt-3 text-xs font-medium text-brand-700">{r.users} user{r.users !== 1 ? 's' : ''}</p>
              </Card>
            ))}
          </div>

          <Card>
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="font-display text-[15px] font-semibold text-brand-950">Permission Matrix</h3>
              <p className="mt-0.5 text-xs text-slate-500">Module access level by role</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                    {permissionMatrix.modules.map((m) => (
                      <th key={m} className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissionMatrix.roles.map((r) => (
                    <tr key={r.role} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 text-[13px] font-medium text-brand-950">{r.role}</td>
                      {permissionMatrix.modules.map((m) => (
                        <td key={m} className="px-3 py-3 text-center">
                          <AccessIcon level={r.access[m]} />
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
    </div>
  );
}

function AccessIcon({ level }: { level: 'full' | 'edit' | 'view' | 'none' }) {
  if (level === 'full') return <span className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check size={12} strokeWidth={3} /></span>;
  if (level === 'edit') return <span className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-sky-600"><Check size={12} strokeWidth={3} /></span>;
  if (level === 'view') return <span className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500"><Minus size={12} strokeWidth={3} /></span>;
  return <span className={cn('mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-rose-50 text-rose-400')}><X size={12} strokeWidth={3} /></span>;
}
