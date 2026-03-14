'use client';
import DashboardLayout from '@/components/DashboardLayout';

export default function ConsumerLayout({ children }) {
  return <DashboardLayout role="Consumer" requiredRole="Consumer">{children}</DashboardLayout>;
}
