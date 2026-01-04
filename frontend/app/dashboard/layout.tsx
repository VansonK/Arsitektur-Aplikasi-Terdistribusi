"use client";

import { useEffect, useState } from 'react'; // Tambah useState
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { LayoutDashboard, FileText, Bell, LogOut, User, Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { token, user, logout } = useAuthStore();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false); // State untuk handle hydration

  // Memastikan komponen sudah termuat di browser
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Jalankan proteksi hanya jika komponen sudah mounted
    if (isMounted && !token) {
      router.push('/');
    }
  }, [token, router, isMounted]);

  // Jika belum mounted atau token belum terbaca, jangan tampilkan apa-apa (hindari flicker)
  if (!isMounted || !token) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        {/* ... Sidebar Content ... */}
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600">Lapor Warga</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {/* Menu links ... */}
          <Link href="/dashboard" className="flex items-center space-x-3 p-3 bg-blue-50 text-blue-600 rounded-lg">
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </Link>
          {/* ... */}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={() => { logout(); router.push('/'); }}
            className="flex items-center space-x-3 p-3 w-full text-red-600 hover:bg-red-50 rounded-lg"
          >
            <LogOut size={20} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div className="text-sm text-gray-500">Selamat datang kembali,</div>
          <div className="flex items-center space-x-4">
            {/* DEBUG: Jika email masih kosong, tampilkan placeholder agar kita tahu user terisi */}
            <span className="font-semibold text-gray-800">
              {user?.email || "User Aktif"} 
            </span>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
              <User size={16} />
            </div>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}