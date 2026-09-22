import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/lib/auth';
import { ProtectedRoute } from '@/app/ProtectedRoute';

import { MarketingLayout } from '@/marketing/MarketingLayout';
import { HomePage } from '@/marketing/pages/HomePage';
import { ProductLandingPage } from '@/marketing/pages/ProductLandingPage';
import { RequestDemoPage } from '@/marketing/pages/RequestDemoPage';
import { ContactPage } from '@/marketing/pages/ContactPage';
import { LoginPage } from '@/pages/auth/LoginPage';

import { Dashboard } from '@/pages/dashboard/Dashboard';
import { RrrList } from '@/pages/rrr/RrrList';
import { RrrForm } from '@/pages/rrr/RrrForm';
import { RrrDetail } from '@/pages/rrr/RrrDetail';
import { JobsPage } from '@/pages/jobs/JobsPage';
import { DispatchCenter } from '@/pages/dispatch/DispatchCenter';
import { TripList } from '@/pages/trips/TripList';
import { TripSheet } from '@/pages/trips/TripSheet';
import { VehicleList } from '@/pages/fleet/VehicleList';
import { VehicleDetail } from '@/pages/fleet/VehicleDetail';
import { DriverList } from '@/pages/fleet/DriverList';
import { DriverDetail } from '@/pages/fleet/DriverDetail';
import { LiveTracking } from '@/pages/tracking/LiveTracking';
import { ExpensesPage } from '@/pages/finance/ExpensesPage';
import { FuelPage } from '@/pages/finance/FuelPage';
import { MaintenancePage } from '@/pages/maintenance/MaintenancePage';
import { WorkshopsPage } from '@/pages/maintenance/WorkshopsPage';
import { PartsPage } from '@/pages/maintenance/PartsPage';
import { TyresPage } from '@/pages/maintenance/TyresPage';
import { BillingPage } from '@/pages/finance/BillingPage';
import { InvoicesPage } from '@/pages/finance/InvoicesPage';
import { VehiclePnlPage } from '@/pages/finance/VehiclePnlPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { AnalyticsPage } from '@/pages/analytics/AnalyticsPage';
import { AlertsPage } from '@/pages/alerts/AlertsPage';
import { UsersPage } from '@/pages/admin/UsersPage';
import { SettingsPage } from '@/pages/admin/SettingsPage';
import { AuditTrailPage } from '@/pages/admin/AuditTrailPage';
import { ComingSoon } from '@/pages/ComingSoon';

import { CrmDashboardPage } from '@/pages/crm/CrmDashboardPage';
import { LeadsPage } from '@/pages/crm/LeadsPage';
import { LeadDetailPage } from '@/pages/crm/LeadDetailPage';
import { PipelinePage } from '@/pages/crm/PipelinePage';
import { FollowupsPage } from '@/pages/crm/FollowupsPage';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* ---------- Public marketing site ---------- */}
            <Route element={<MarketingLayout />}>
              <Route index element={<HomePage />} />
              <Route path="solutions/:slug" element={<ProductLandingPage />} />
              <Route path="request-demo" element={<RequestDemoPage />} />
              <Route path="contact" element={<ContactPage />} />
            </Route>

            <Route path="login" element={<LoginPage />} />

            {/* ---------- Authenticated application ---------- */}
            <Route path="app" element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route index element={<Dashboard />} />

                {/* CRM */}
                <Route path="crm" element={<ProtectedRoute permission="leads:view" />}>
                  <Route index element={<CrmDashboardPage />} />
                  <Route path="leads" element={<LeadsPage />} />
                  <Route path="leads/:id" element={<LeadDetailPage />} />
                  <Route path="pipeline" element={<PipelinePage />} />
                  <Route path="followups" element={<FollowupsPage />} />
                </Route>

                <Route path="rrr" element={<ProtectedRoute permission="rrr:view" />}>
                  <Route index element={<RrrList />} />
                  <Route path=":id" element={<RrrDetail />} />
                  <Route element={<ProtectedRoute permission="rrr:create" />}>
                    <Route path="new" element={<RrrForm />} />
                  </Route>
                </Route>

                <Route path="jobs" element={<JobsPage />} />
                <Route path="dispatch" element={<DispatchCenter />} />

                <Route path="trips" element={<TripList />} />
                <Route path="trips/:id" element={<TripSheet />} />

                <Route path="fleet/vehicles" element={<VehicleList />} />
                <Route path="fleet/vehicles/:id" element={<VehicleDetail />} />
                <Route path="fleet/drivers" element={<DriverList />} />
                <Route path="fleet/drivers/:id" element={<DriverDetail />} />
                <Route path="fleet/tracking" element={<LiveTracking />} />

                <Route path="maintenance/workshops" element={<WorkshopsPage />} />
                <Route path="maintenance" element={<MaintenancePage />} />
                <Route path="maintenance/parts" element={<PartsPage />} />
                <Route path="maintenance/tyres" element={<TyresPage />} />

                <Route path="finance/expenses" element={<ExpensesPage />} />
                <Route path="finance/fuel" element={<FuelPage />} />
                <Route path="finance/billing" element={<BillingPage />} />
                <Route path="finance/invoices" element={<InvoicesPage />} />
                <Route path="finance/vehicle-pnl" element={<VehiclePnlPage />} />

                <Route path="reports" element={<ReportsPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="alerts" element={<AlertsPage />} />

                <Route element={<ProtectedRoute permission="users:manage" />}>
                  <Route path="admin/users" element={<UsersPage />} />
                </Route>
                <Route path="admin/settings" element={<SettingsPage />} />
                <Route element={<ProtectedRoute permission="audit:view" />}>
                  <Route path="admin/audit" element={<AuditTrailPage />} />
                </Route>

                <Route path="*" element={<ComingSoon title="Page Not Found" />} />
              </Route>
            </Route>

            {/* Legacy deep links that used to live at the root now sit under /app */}
            <Route path="dashboard" element={<Navigate to="/app" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
