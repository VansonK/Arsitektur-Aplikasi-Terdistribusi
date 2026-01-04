"use client";
import { useEffect, useState, useCallback } from 'react';
import { reportServiceApi } from '@/lib/api';
import { BarChart3, Users, FileText, AlertTriangle, RefreshCw } from 'lucide-react';

export default function ExecutiveDashboard({ user }: { user: any }) {
  const [stats, setStats] = useState({ total: 0, pending: 0, proses: 0, selesai: 0 });
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchExecutiveData = useCallback(async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const [statsRes, reportsRes] = await Promise.all([
        reportServiceApi.get('/reports/stats'),
        reportServiceApi.get('/reports/all')
      ]);
      
      const s = statsRes.data;
      // Kalkulasi total di frontend agar akurat
      const total = (s.pending || 0) + (s.diproses || s.proses || 0) + (s.selesai || 0);
      
      setStats({
        total: total,
        pending: s.pending || 0,
        proses: s.diproses || s.proses || 1,
        selesai: s.selesai || 0
      });
      setAllReports(reportsRes.data || []);
    } catch (err) {
      console.error("Gagal sinkronisasi data pimpinan:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  // POLLING: Update data setiap 30 detik
  useEffect(() => {
    fetchExecutiveData();
    const interval = setInterval(fetchExecutiveData, 5000); 
    return () => clearInterval(interval);
  }, [fetchExecutiveData]);

  if (loading) return <LoadingScreen />;

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">MONITORING KOTA</h1>
          <p className="text-gray-500 font-medium">Panel Kendali Real-time (Auto-refresh 30s)</p>
        </div>
        <div className={`transition-all ${isRefreshing ? 'animate-spin' : 'opacity-0'}`}>
          <RefreshCw size={20} className="text-blue-600" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatBox label="Total Laporan" value={stats.total} icon={<FileText />} color="text-blue-700" bgColor="bg-blue-100" />
        <StatBox label="Menunggu" value={stats.pending} icon={<AlertTriangle />} color="text-amber-600" bgColor="bg-amber-100" />
        <StatBox label="Diproses" value={stats.proses} icon={<BarChart3 />} color="text-indigo-600" bgColor="bg-indigo-100" />
        <StatBox label="Selesai" value={stats.selesai} icon={<Users />} color="text-emerald-600" bgColor="bg-emerald-100" />
      </div>

      {/* Tabel Log */}
      <div className="bg-white rounded-[2rem] shadow-xl border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
            <tr>
              <th className="px-8 py-5">Departemen</th>
              <th className="px-8 py-5">Judul</th>
              <th className="px-8 py-5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allReports.map((r: any) => (
              <tr key={r.id} className="hover:bg-blue-50/30">
                <td className="px-8 py-6 font-bold text-gray-800 uppercase text-xs">{r.department}</td>
                <td className="px-8 py-6 text-gray-600 text-sm">{r.title}</td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black bg-gray-100 uppercase italic">
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatBox({ label, value, icon, color, bgColor }: any) {
  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">{label}</p>
        <p className={`text-4xl font-black ${color}`}>{value.toLocaleString('id-ID')}</p>
      </div>
      <div className={`p-4 rounded-2xl ${bgColor} ${color}`}>{icon}</div>
    </div>
  );
}

function LoadingScreen() {
  return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
}