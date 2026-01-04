import { useEffect, useState } from 'react';
import { reportServiceApi } from '@/lib/api';
import { BarChart3, Users, FileText, AlertTriangle } from 'lucide-react';

export default function ExecutiveDashboard({ user }: any) {
  const [stats, setStats] = useState({ pending: 0, diproses: 0, selesai: 0 });
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => { 
      try {
        const [statsRes, reportsRes] = await Promise.all([
          reportServiceApi.get('/reports/stats'),
          reportServiceApi.get('/reports/recent') // Executive akan menerima semua data
        ]);
        setStats(statsRes.data);
        setAllReports(reportsRes.data);
      } catch (err) {
        console.error("Gagal mengambil data executive:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      {/* Header Eksekutif */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">MONITORING KOTA</h1>
          <p className="text-gray-500">Laporan Real-time Seluruh Departemen</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border shadow-sm">
          <p className="text-xs text-gray-400 uppercase font-bold">Login sebagai</p>
          <p className="text-sm font-medium text-blue-600">{user.email} (Pimpinan)</p>
        </div>
      </div>

      {/* Ringkasan Statistik (Data Asli dari DB) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatBox label="Total Laporan" value={stats.pending + stats.diproses + stats.selesai} icon={<FileText />} color="text-gray-700" />
        <StatBox label="Pending" value={stats.pending} icon={<AlertTriangle />} color="text-yellow-600" />
        <StatBox label="Diproses" value={stats.diproses} icon={<BarChart3 />} color="text-blue-600" />
        <StatBox label="Selesai" value={stats.selesai} icon={<Users />} color="text-green-600" />
      </div>

      {/* Master Table - Semua Laporan dari Semua Dept */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b bg-white flex justify-between items-center">
          <h3 className="font-bold text-gray-800 text-lg">Log Laporan Seluruh Wilayah</h3>
          <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold uppercase">Live</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-6 py-4">Departemen</th>
                <th className="px-6 py-4">Judul Laporan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Pelapor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allReports.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-700">{r.department}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{r.title}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      r.status === 'selesai' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {r.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {r.anonymous ? 'User Anonim' : `ID: ${r.user_id}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-gray-50 text-center">
          <p className="text-xs text-gray-400 italic">Visualisasi grafik mendalam tersedia di modul Apache Superset (Tahap Akhir).</p>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
      <div className={`p-3 rounded-xl bg-gray-50 ${color}`}>{icon}</div>
      <div>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-gray-800">{value}</p>
      </div>
    </div>
  );
}