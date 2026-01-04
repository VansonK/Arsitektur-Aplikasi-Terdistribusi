"use client";
import { useEffect, useState, useCallback } from 'react';
import { reportServiceApi, reportApi } from '@/lib/api';

export default function CitizenDashboard({ user }: { user: any }) {
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [upvotedIds, setUpvotedIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    title: '', description: '', department: 'Kebersihan', anonymous: false, is_public: true
  });

  const getStatusStyles = (status: string) => {
    const s = status?.toUpperCase() || 'PENDING';
    switch (s) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'DIPROSES':
      case 'PROSES':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'SELESAI':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // --- 1. FUNGSI UNTUK MENAMPILKAN MULTIMEDIA ---
  // --- PERBAIKAN FUNGSI MULTIMEDIA ---
  const renderMultimedia = (mediaData: any) => {
    try {
      if (!mediaData) return null;
      const urls = typeof mediaData === 'string' ? JSON.parse(mediaData) : mediaData;
      if (!Array.isArray(urls) || urls.length === 0) return null;

      // Fungsi Helper untuk mengubah link Drive menjadi Direct Link
      const getDirectLink = (url: string) => {
        // Jika link mengandung 'drive.google.com', ubah formatnya
        if (url.includes('drive.google.com')) {
          const fileId = url.split('/d/')[1]?.split('/')[0] || url.split('id=')[1]?.split('&')[0];
          if (fileId) {
            return `https://lh3.googleusercontent.com/u/0/d/${fileId}`;
          }
        }
        return url;
      };

      return (
        <div className="flex flex-wrap gap-3 mt-4">
          {urls.map((url: string, index: number) => {
            const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || url.includes('drive.google.com');
            const directUrl = getDirectLink(url);

            return (
              <div key={index} className="group relative">
                <a 
                  href={url} target="_blank" rel="noopener noreferrer"
                  className="block w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-100 shadow-sm hover:border-blue-400 hover:ring-2 ring-blue-100 transition-all bg-gray-50"
                >
                  {isImage ? (
                    <img 
                      src={directUrl} 
                      alt={`Lampiran ${index + 1}`} 
                      className="w-full h-full object-cover"
                      // Penting: Mencegah error 403 dari Google Drive
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        // Jika gagal load direct link, tampilkan placeholder
                        (e.target as HTMLImageElement).src = "https://placehold.co/400x400/e2e8f0/64748b?text=File";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[10px] font-bold text-gray-400">
                      <span className="text-xl">📄</span>
                      FILE {index + 1}
                    </div>
                  )}
                </a>
                {/* Badge Zoom */}
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  🔍
                </div>
              </div>
            );
          })}
        </div>
      );
    } catch (e) { return null; }
  };

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoint = activeTab === 'all' ? '/reports/all' : '/reports/recent';
      const res = await reportServiceApi.get(endpoint);
      setReports(res.data);
    } catch (err) {
      console.error("Gagal mengambil laporan:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleUpvote = async (reportId: number) => {
    if (upvotedIds.includes(reportId)) return;
    try {
      await reportServiceApi.post(`/reports/${reportId}/vote`);
      const newVotes = [...upvotedIds, reportId];
      setUpvotedIds(newVotes);
      localStorage.setItem(`votes_${user.id}`, JSON.stringify(newVotes));
      fetchReports();
    } catch (err) { alert("Gagal memberikan dukungan."); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const bodyFormData = new FormData();
      bodyFormData.append('user_id', String(user.id));
      bodyFormData.append('title', formData.title);
      bodyFormData.append('description', formData.description);
      bodyFormData.append('department', formData.department);
      bodyFormData.append('anonymous', String(formData.anonymous));
      if (selectedFiles) {
        for (let i = 0; i < selectedFiles.length; i++) {
          bodyFormData.append('files', selectedFiles[i]);
        }
      }
      await reportApi.post('/report', bodyFormData);
      alert("Laporan berhasil dikirim!");
      setFormData({ title: '', description: '', department: 'Kebersihan', anonymous: false, is_public: true });
      setSelectedFiles(null);
      setShowForm(false);
      setTimeout(() => { setActiveTab('mine'); fetchReports(); }, 1500);
    } catch (err) { alert("Gagal mengirim laporan."); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto font-sans">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border">
        <div>
          <h1 className="text-2xl font-black text-blue-900">Dashboard Warga</h1>
          <p className="text-gray-500 text-sm">Laporkan masalah di sekitar Anda.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg ${showForm ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          {showForm ? '✖ Tutup' : '➕ Buat Laporan'}
        </button>
      </div>

      {/* Form (Bagian upload file sudah diperbaiki tampilannya) */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border-2 border-blue-100 shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <input 
                required className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-blue-500 outline-none" 
                value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Apa yang ingin Anda laporkan?"
              />
              <textarea 
                required rows={4} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-blue-500 outline-none" 
                value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Detail kejadian..."
              />
            </div>
            <div className="space-y-4">
              <select className="w-full border-2 border-gray-100 p-3 rounded-xl bg-gray-50" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})}>
                <option value="Kebersihan">Kebersihan</option>
                <option value="Kesehatan">Kesehatan</option>
                <option value="Infrastruktur">Infrastruktur</option>
              </select>
              <div className="relative border-2 border-dashed border-blue-300 bg-blue-50 rounded-2xl p-6 text-center cursor-pointer hover:bg-blue-100 transition-all">
                <input type="file" multiple accept="image/*,video/*" onChange={(e) => setSelectedFiles(e.target.files)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <p className="text-sm font-bold text-blue-800">{selectedFiles ? `${selectedFiles.length} File dipilih` : "📁 Klik untuk Unggah Foto/Video"}</p>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                <input type="checkbox" id="anon" className="w-5 h-5" checked={formData.anonymous} onChange={(e) => setFormData({...formData, anonymous: e.target.checked})} />
                <label htmlFor="anon" className="text-sm font-semibold text-gray-600">Laporkan sebagai Anonim</label>
              </div>
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black disabled:bg-blue-300 transition-all">
            {isSubmitting ? "Sedang Mengirim..." : "Kirim Laporan"}
          </button>
        </form>
      )}

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-2xl w-fit">
        <button onClick={() => setActiveTab('all')} className={`px-8 py-2.5 rounded-xl font-bold text-sm ${activeTab === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>🌍 Jelajah Publik</button>
        <button onClick={() => setActiveTab('mine')} className={`px-8 py-2.5 rounded-xl font-bold text-sm ${activeTab === 'mine' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>📑 Laporan Saya</button>
      </div>

      {/* List Laporan */}
      <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-6 text-xs font-black text-gray-400 uppercase">Detail Kejadian & Lampiran</th>
              <th className="p-6 text-center text-xs font-black text-gray-400 uppercase">Dukungan</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {reports.length > 0 ? reports.map((r: any) => (
              <tr key={r.id} className="hover:bg-blue-50/20 transition-all">
                <td className="p-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">{r.department}</span>

                      {/* --- TAMBAHAN: BADGE STATUS PROGRES --- */}
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase border flex items-center gap-1 ${getStatusStyles(r.status)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                        {r.status || 'PENDING'}
                      </span>

                      {/* --- 2. LOGIKA NAMA PELAPOR & ANONIM --- */}
                      <span className="text-[10px] font-bold text-gray-400 italic">
                        Oleh: {r.user_id === "ANONYMOUS" || r.anonymous ? "🤫 Warga Anonim" : `👤 User #${r.user_id}`}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-gray-800">{r.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{r.description}</p>
                    
                    {/* --- 3. MENAMPILKAN MULTIMEDIA --- */}
                    {renderMultimedia(r.multimedia_url)}

                    {activeTab === 'mine' && (
                      <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-xl text-xs">
                        <p className="font-black text-yellow-700 uppercase">Respon Admin:</p>
                        <p className="text-yellow-800">{r.admin_note || "Laporan diterima. Menunggu verifikasi."}</p>
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-6 w-32">
                  <div className="flex flex-col items-center gap-1">
                    <button 
                      onClick={() => handleUpvote(r.id)}
                      className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all ${upvotedIds.includes(r.id) ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400 hover:bg-blue-100'}`}
                    >
                      <span className="text-lg">▲</span>
                      <span className="text-xs font-black">{r.vote_count || 0}</span>
                    </button>
                    <span className="text-[9px] font-black text-gray-400 uppercase">Setuju</span>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={2} className="p-20 text-center text-gray-400">Belum ada laporan.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}