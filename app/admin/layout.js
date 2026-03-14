'use client';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminLayout({ children }) {
  return <DashboardLayout role="Admin" requiredRole="Admin">{children}</DashboardLayout>;
}
