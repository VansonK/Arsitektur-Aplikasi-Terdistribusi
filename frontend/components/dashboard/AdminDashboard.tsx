"use client";
import { useEffect, useState, useCallback } from 'react';
import { reportServiceApi, reportApi } from '@/lib/api';

type ReportStatus = 'PENDING' | 'PROSES' | 'SELESAI' | 'DITOLAK';

export default function AdminDashboard({ user }: { user: any }) {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ReportStatus | 'ALL'>('ALL');
  
  // State untuk proses editing status/note
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempStatus, setTempStatus] = useState<ReportStatus>('PENDING');
  const [tempNote, setTempNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // 1. Fetch Data
  const fetchAllReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await reportServiceApi.get('/reports/all');
      setReports(res.data);
    } catch (err) {
      console.error("Gagal mengambil data admin:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllReports(); }, [fetchAllReports]);

  // 2. Handler Update Status & Note
  const handleUpdateReport = async (reportId: number) => {
    setIsUpdating(true);
    try {
      // Menembak ke reporting-engine (Producer)
      await reportApi.put(`/report/update-progress`, {
        report_id: reportId,
        status: tempStatus,
        admin_note: tempNote
      });
      
      alert("Perubahan sedang diproses via Kafka...");
      setEditingId(null);
      
      // Beri sedikit delay sebelum refresh agar Consumer punya waktu update DB
      setTimeout(() => fetchAllReports(), 1000); 
    } catch (err) {
      alert("Gagal mengirim update ke engine.");
    } finally {
      setIsUpdating(false);
    }
  };

  // 3. Render Multimedia (Sama seperti Citizen, dengan Direct Link Drive)
  const renderMultimedia = (mediaData: any) => {
    try {
      if (!mediaData) return null;
      const urls = typeof mediaData === 'string' ? JSON.parse(mediaData) : mediaData;
      if (!Array.isArray(urls) || urls.length === 0) return null;

      const getDirectLink = (url: string) => {
        if (url.includes('drive.google.com')) {
          const fileId = url.split('/d/')[1]?.split('/')[0] || url.split('id=')[1]?.split('&')[0];
          return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : url;
        }
        return url;
      };

      return (
        <div className="flex flex-wrap gap-2 mt-2">
          {urls.map((url: string, i: number) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded border overflow-hidden hover:opacity-80 transition-opacity">
              <img src={getDirectLink(url)} alt="Bukti" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </a>
          ))}
        </div>
      );
    } catch (e) { return null; }
  };

  // 4. Statistik Ringkas
  const stats = {
    total: reports.length,
    pending: reports.filter((r: any) => r.status === 'pending').length,
    proses: reports.filter((r: any) => r.status === 'proses').length,
    selesai: reports.filter((r: any) => r.status === 'selesai').length,
  };

  const filteredReports = filterStatus === 'ALL' 
    ? reports 
    : reports.filter((r: any) => {
        // Pastikan status ada dan bandingkan dengan huruf besar
        const reportStatus = r.status ? r.status.toUpperCase() : 'PENDING';
        return reportStatus === filterStatus;
      });
      
  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto font-sans bg-gray-50 min-h-screen">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-blue-100 col-span-1">
          <h1 className="text-xl font-black text-blue-900">Admin Control</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Panel Verifikasi Laporan</p>
        </div>
        {[
          { label: 'Total Laporan', val: stats.total, color: 'text-gray-600', bg: 'bg-gray-100' },
          { label: 'Menunggu', val: stats.pending, color: 'text-yellow-600', bg: 'bg-yellow-100' },
          { label: 'Selesai', val: stats.selesai, color: 'text-green-600', bg: 'bg-green-100' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} p-6 rounded-3xl flex flex-col justify-center`}>
            <span className={`text-2xl font-black ${s.color}`}>{s.val}</span>
            <span className="text-[10px] font-black uppercase text-gray-500">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border w-fit">
        {['ALL', 'PENDING', 'PROSES', 'SELESAI'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st as any)}
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${filterStatus === st ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase">Informasi Laporan</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase">Pelapor</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase text-center">Status & Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredReports.map((r: any) => (
              <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6 align-top max-w-md">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-blue-500 uppercase">{r.department}</span>
                    <h3 className="font-bold text-gray-800">{r.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-3">{r.description}</p>
                    {renderMultimedia(r.multimedia_url)}
                  </div>
                </td>
                <td className="p-6 align-top">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-700">ID User: #{r.user_id}</span>
                    <span className={`text-[10px] font-bold ${r.anonymous ? 'text-purple-500' : 'text-gray-400'}`}>
                      {r.anonymous ? '🔒 Mode Anonim' : '🔓 Publik'}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-4">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                </td>
                <td className="p-6 align-top">
                  {editingId === r.id ? (
                    /* --- UI EDITING --- */
                    <div className="space-y-3 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                      <select 
                        value={tempStatus} 
                        onChange={(e) => setTempStatus(e.target.value as ReportStatus)}
                        className="w-full p-2 rounded-lg border-2 border-blue-200 text-xs font-bold outline-none"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PROSES">PROSES</option>
                        <option value="SELESAI">SELESAI</option>
                        <option value="DITOLAK">DITOLAK</option>
                      </select>
                      <textarea 
                        placeholder="Tambahkan catatan petugas..."
                        value={tempNote}
                        onChange={(e) => setTempNote(e.target.value)}
                        className="w-full p-2 rounded-lg border-2 border-blue-200 text-xs outline-none h-20"
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleUpdateReport(r.id)}
                          disabled={isUpdating}
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-[10px] font-black uppercase disabled:opacity-50"
                        >
                          {isUpdating ? '...' : 'Simpan'}
                        </button>
                        <button 
                          onClick={() => setEditingId(null)}
                          className="px-3 bg-white text-gray-400 py-2 rounded-lg text-[10px] font-black border"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* --- UI DISPLAY --- */
                    <div className="flex flex-col items-center gap-3">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black shadow-sm border ${
                        r.status === 'PENDING' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                        r.status === 'PROSES' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        'bg-green-50 text-green-600 border-green-200'
                      }`}>
                        {r.status}
                      </span>
                      
                      <div className="text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Catatan Admin:</p>
                        <p className="text-xs text-gray-600 italic max-w-[200px] break-words">
                          "{r.admin_note || 'Belum ada tanggapan.'}"
                        </p>
                      </div>

                      <button 
                        onClick={() => {
                          setEditingId(r.id);
                          setTempStatus(r.status);
                          setTempNote(r.admin_note || '');
                        }}
                        className="mt-2 text-blue-600 text-[10px] font-black uppercase hover:underline"
                      >
                        ✍️ Edit Status / Catatan
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredReports.length === 0 && (
          <div className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest">
            Tidak ada laporan ditemukan
          </div>
        )}
      </div>
    </div>
  );
}