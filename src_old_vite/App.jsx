import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ProtectedRoute, AdminRoute } from './components/AuthRoutes';
import { ToastProvider } from './components/ui/ToastProvider';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { PageSkeleton } from './components/ui/Skeleton';

import LoginPage from './pages/LoginPage';
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';

const DashboardPage = React.lazy(() => import('./pages/customer/DashboardPage'));
const EnergyPage = React.lazy(() => import('./pages/customer/EnergyPage'));
const ServicesPage = React.lazy(() => import('./pages/customer/ServicesPage'));
const BillingPage = React.lazy(() => import('./pages/customer/BillingPage'));
const DiscomPage = React.lazy(() => import('./pages/customer/DiscomPage'));
const DevicesPage = React.lazy(() => import('./pages/customer/DevicesPage'));
const AnalyticsPage = React.lazy(() => import('./pages/customer/AnalyticsPage'));
const ForecastPage = React.lazy(() => import('./pages/customer/ForecastPage'));
const CarbonPage = React.lazy(() => import('./pages/customer/CarbonPage'));
const SupportPage = React.lazy(() => import('./pages/customer/SupportPage'));
const AIAdvisorPage = React.lazy(() => import('./pages/customer/AIAdvisorPage'));
const AIBillAnalyzerPage = React.lazy(() => import('./pages/customer/AIBillAnalyzerPage'));
const AIAnomalyPage = React.lazy(() => import('./pages/customer/AIAnomalyPage'));
const ProfilePage = React.lazy(() => import('./pages/customer/ProfilePage'));

const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers'));
const AdminAnalytics = React.lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminTickets = React.lazy(() => import('./pages/admin/AdminTickets'));
const AdminBilling = React.lazy(() => import('./pages/admin/AdminBilling'));
const AdminDataManager = React.lazy(() => import('./pages/admin/AdminDataManager'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));

// Root element to redirect logged-in users to their correct dashboard
const RootRedirect = () => {
  const { currentUser, isLoading } = useApp();
  if (isLoading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Customer Portal — Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<CustomerLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/energy" element={<EnergyPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/discom" element={<DiscomPage />} />
              <Route path="/devices" element={<DevicesPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/forecast" element={<ForecastPage />} />
              <Route path="/carbon" element={<CarbonPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/advisor" element={<AIAdvisorPage />} />
              <Route path="/bill-analyzer" element={<AIBillAnalyzerPage />} />
              <Route path="/anomaly" element={<AIAnomalyPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Admin Console — Admin Only Routes */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/tickets" element={<AdminTickets />} />
              <Route path="/admin/billing" element={<AdminBilling />} />
              <Route path="/admin/data" element={<AdminDataManager />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastProvider />
      </BrowserRouter>
    </AppProvider>
  );
}
