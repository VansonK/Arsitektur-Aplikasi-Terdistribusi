"use client";

import { useAuthStore } from '@/store/useAuthStore'; // Sesuaikan path store Anda
import ExecutiveDashboard from '@/components/dashboard/ExecutiveDashboard';
import CitizenDashboard from '@/components/dashboard/CitizenDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  if (user?.role === 'admin') return <AdminDashboard user={user} />;
  if (user?.role === 'executive') return <ExecutiveDashboard user={user} />;
  
  return <CitizenDashboard user={user} />;
}