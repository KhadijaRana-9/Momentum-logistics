import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogoMark } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/apiClient';
import { useHead } from '@/lib/useHead';

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useHead({ title: 'Sign in | Momentum Logistics', noindex: true, path: '/login' });

  const from = (location.state as { from?: string } | null)?.from ?? '/app';

  if (!loading && user) return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await login(String(fd.get('email')), String(fd.get('password')));
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <LogoMark size={32} />
          <span className="font-display text-[16px] font-bold tracking-tight text-brand-950">Momentum Logistics</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h1 className="font-display text-lg font-semibold text-brand-950">Sign in to the CRM</h1>
          <p className="mt-1 text-[13px] text-slate-500">Staff and admin access only.</p>

          <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] font-medium text-rose-700">{error}</p>}
            <Field label="Email" required>
              <Input name="email" type="email" autoComplete="email" required autoFocus />
            </Field>
            <Field label="Password" required>
              <Input name="password" type="password" autoComplete="current-password" required />
            </Field>
            <Button type="submit" size="lg" loading={submitting} className="w-full">Sign in</Button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          Need access? Ask your administrator to create an account.
        </p>
      </div>
    </div>
  );
}
