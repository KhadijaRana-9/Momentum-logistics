import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, type Permission } from '@/lib/auth';
import { EmptyState } from '@/components/ui/EmptyState';

/** Gate for the authenticated app. Optionally requires a specific permission. */
export function ProtectedRoute({ permission }: { permission?: Permission }) {
  const { user, loading, can } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (permission && !can(permission)) {
    return (
      <div className="p-10">
        <EmptyState
          title="You don't have access to this area"
          description="Ask an administrator to grant the required permission."
        />
      </div>
    );
  }

  return <Outlet />;
}
