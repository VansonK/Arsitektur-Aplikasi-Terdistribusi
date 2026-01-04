import { useEffect, useState } from 'react';
import { reportServiceApi } from '@/lib/api';

export default function AdminDashboard({ user }: any) {
  const [reports, setReports] = useState([]);

  const fetchReports = () => {
    reportServiceApi.get('/reports/recent').then(res => setReports(res.data));
  };

  useEffect(() => { fetchReports(); }, []);

  const handleUpdate = async (id: number) => {
    const note = prompt("Masukkan catatan perbaikan:");
    if (note) {
      try {
        // Panggil endpoint update status
        await reportServiceApi.put(`/reports/${id}/status?status=selesai&note=${note}`);
        alert("Laporan ditandai selesai!");
        fetchReports(); // Refresh data
      } catch (err) { alert("Gagal update status"); }
    }
  };

  return (
    <div className="p-4 bg-yellow-50 min-h-screen">
      <h1 className="text-xl font-bold mb-2">Panel Admin: {user.department}</h1>
      <table className="w-full bg-white border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">Judul</th>
            <th className="p-2 border">Pelapor</th>
            <th className="p-2 border">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r: any) => (
            <tr key={r.id}>
              <td className="p-2 border">{r.title}</td>
              <td className="p-2 border text-xs">
                {r.user_id === 'ANONYMOUS' ? <span className="text-red-500">Anonim</span> : `Warga ID: ${r.user_id}`}
              </td>
              <td className="p-2 border">
                {r.status === 'pending' && (
                  <button onClick={() => handleUpdate(r.id)} className="bg-green-600 text-white px-2 py-1 rounded text-xs">
                    Selesaikan
                  </button>
                )}
                {r.status === 'selesai' && <span className="text-green-600">Selesai</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}