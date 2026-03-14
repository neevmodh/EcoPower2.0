'use client';
import DashboardLayout from '@/components/DashboardLayout';

export default function EnterpriseLayout({ children }) {
  return <DashboardLayout role="Enterprise" requiredRole="Enterprise">{children}</DashboardLayout>;
}
