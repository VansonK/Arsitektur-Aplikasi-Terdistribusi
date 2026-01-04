"use client";
import { useEffect, useState, useCallback } from 'react';
import { reportServiceApi, reportApi } from '@/lib/api';
import axios from 'axios';

// --- 1. INTERFACES ---
interface Report {
  id: number;
  title: string;
  description: string;
  department: string;
  status: string;
  user_id: number;
  anonymous: boolean;
  multimedia_url?: string; // Pastikan ini ada
  admin_note?: string;
  vote_count?: number;
}

interface Notification {
  id: number;
  report_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function CitizenDashboard({ user }: { user: any }) {
  const [reports, setReports] = useState<Report[]>([]); 
  const [inbox, setInbox] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'inbox'>('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [upvotedIds, setUpvotedIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    title: '', description: '', department: 'Kebersihan', anonymous: false, is_public: true
  });

  const NOTIF_BASE_URL = "http://103.197.188.83:8002"; 

  // --- 2. MULTIMEDIA RENDERER (DIADOPSI DARI ADMIN) ---
  const renderMultimedia = (mediaData: any) => {
    try {
      if (!mediaData) return null;
      // Parsing jika data berupa string JSON
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
        <div className="flex flex-wrap gap-2 mt-3">
          {urls.map((url: string, i: number) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer" 
               className="w-20 h-20 rounded-xl border-2 border-gray-100 overflow-hidden hover:border-blue-400 transition-all shadow-sm">
              <img 
                src={getDirectLink(url)} 
                alt="Bukti Laporan" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100?text=File'; }}
              />
            </a>
          ))}
        </div>
      );
    } catch (e) { return null; }
  };

  // --- 3. DATA FETCHING ---
  const fetchReports = useCallback(async () => {
    if (!user?.id) return;
    try {
      const endpoint = activeTab === 'mine' ? `/reports/user/${user.id}` : '/reports/all';
      const res = await reportServiceApi.get(endpoint);
      setReports(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Gagal mengambil laporan:", err); }
  }, [user?.id, activeTab]);

  const fetchInbox = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`${NOTIF_BASE_URL}/notifications/${user.id}`);
      const apiNotifs = Array.isArray(res.data) ? res.data : [];
      
      // HARDCODE: Entry Dummy yang selalu ada
      const dummyNotif: Notification = {
        id: 9999,
        report_id: 0,
        message: "📢 Progres Laporan 'Sampah' telah diperbaharui",
        is_read: false,
        created_at: new Date().toISOString()
      };

      setInbox([dummyNotif, ...apiNotifs]);
    } catch (err) { console.error("Gagal mengambil inbox:", err); }
  }, [user?.id]);

  useEffect(() => {
    fetchReports();
    fetchInbox();
    const interval = setInterval(() => { fetchReports(); fetchInbox(); }, 15000); 
    return () => clearInterval(interval);
  }, [user?.id, activeTab, fetchReports, fetchInbox]);

  // --- 4. ACTIONS ---
  const handleUpvote = async (reportId: number) => {
    if (upvotedIds.includes(reportId)) return;
    
    // Optimistic Update: Tambah angka di UI dulu baru panggil API
    setReports(prev => prev.map(r => 
      r.id === reportId ? { ...r, vote_count: (r.vote_count || 0) + 1 } : r
    ));
    setUpvotedIds(prev => [...prev, reportId]);

    try {
      await reportServiceApi.post(`/reports/${reportId}/vote`);
    } catch (err) { 
      // Rollback jika gagal
      setReports(prev => prev.map(r => 
        r.id === reportId ? { ...r, vote_count: (r.vote_count || 0) - 1 } : r
      ));
      setUpvotedIds(prev => prev.filter(id => id !== reportId));
      alert("Gagal memberikan dukungan."); 
    }
  };

  const markAsRead = async (notifId: number) => {
    if (notifId === 9999) { // Logika khusus untuk dummy agar bisa hilang dari counter
        setInbox(prev => prev.map(n => n.id === 9999 ? {...n, is_read: true} : n));
        return;
    }
    try {
      await axios.put(`${NOTIF_BASE_URL}/notifications/${notifId}/read`);
      fetchInbox();
    } catch (err) { console.error("Gagal update status baca"); }
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
      setFormData({ title: '', description: '', department: 'Kebersihan', anonymous: false, is_public: true });
      setSelectedFiles(null);
      setShowForm(false);
      fetchReports();
      alert("Laporan berhasil dikirim!");
    } catch (err) { alert("Gagal mengirim laporan."); } 
    finally { setIsSubmitting(false); }
  };

  const getStatusStyles = (status: string) => {
    const s = status?.toUpperCase() || 'PENDING';
    switch (s) {
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'PROSES':
      case 'DIPROSES': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'SELESAI': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto font-sans">
      {/* Header & Form (Tetap sama) */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border">
        <div>
          <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">Dashboard Warga</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Sistem Monitoring Kota • Auto-Sync Aktif</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg ${showForm ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
          {showForm ? '✖ Tutup' : '➕ Buat Laporan'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border-2 border-blue-100 shadow-xl space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <input required className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-blue-500 font-semibold" 
                value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Judul laporan..." />
              <textarea required rows={4} className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-blue-500 font-semibold" 
                value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Detail kejadian..." />
            </div>
            <div className="space-y-4">
              <select className="w-full border-2 border-gray-100 p-3 rounded-xl bg-gray-50 font-bold text-blue-900" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})}>
                <option value="Kebersihan">Kebersihan</option>
                <option value="Kesehatan">Kesehatan</option>
                <option value="Infrastruktur">Infrastruktur</option>
              </select>
              <div className="relative border-2 border-dashed border-blue-300 bg-blue-50 rounded-2xl p-6 text-center">
                <input type="file" multiple accept="image/*,video/*" onChange={(e) => setSelectedFiles(e.target.files)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <p className="text-sm font-bold text-blue-800">{selectedFiles ? `✅ ${selectedFiles.length} File terpilih` : "📁 Upload Foto/Video"}</p>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                <input type="checkbox" id="anon" className="w-5 h-5 cursor-pointer" checked={formData.anonymous} onChange={(e) => setFormData({...formData, anonymous: e.target.checked})} />
                <label htmlFor="anon" className="text-sm font-semibold text-gray-600 cursor-pointer">Kirim sebagai Anonim</label>
              </div>
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black disabled:bg-blue-300 shadow-lg uppercase">
            {isSubmitting ? "🚀 Sedang Mengirim..." : "Kirim Laporan Sekarang"}
          </button>
        </form>
      )}

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-2xl w-fit">
        <button onClick={() => setActiveTab('all')} className={`px-8 py-2.5 rounded-xl font-bold text-xs transition-all ${activeTab === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>PUBLIK</button>
        <button onClick={() => setActiveTab('mine')} className={`px-8 py-2.5 rounded-xl font-bold text-xs transition-all ${activeTab === 'mine' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>MILIK SAYA</button>
        <button onClick={() => setActiveTab('inbox')} className={`px-8 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${activeTab === 'inbox' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>
          INBOX {inbox.filter(n => !n.is_read).length > 0 && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>}
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden min-h-[400px]">
        {activeTab === 'inbox' ? (
          <div className="divide-y">
            {inbox.map((n) => (
              <div key={n.id} className={`p-6 flex justify-between items-center transition-colors ${n.is_read ? 'bg-white' : 'bg-blue-50/40'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded uppercase">{n.id === 9999 ? 'Sistem' : `Info #${n.report_id}`}</span>
                    <span className="text-[10px] text-gray-400 font-bold">{new Date(n.created_at).toLocaleString('id-ID')}</span>
                  </div>
                  <h4 className={`text-sm ${n.is_read ? 'text-gray-600' : 'text-gray-900 font-bold'}`}>{n.message}</h4>
                </div>
                {!n.is_read && (
                  <button onClick={() => markAsRead(n.id)} className="text-[10px] font-black text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-xl border border-blue-200 uppercase">
                    Baca
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="p-6">Informasi Laporan</th>
                <th className="p-6 text-center w-32">Dukungan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="p-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">{r.department}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase border flex items-center gap-1 ${getStatusStyles(r.status)}`}>
                          {r.status || 'PENDING'}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 italic">
                          {r.anonymous ? "🤫 Anonim" : `👤 User ID: ${r.user_id}`}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-gray-800 tracking-tight">{r.title}</h3>
                      <p className="text-gray-500 text-sm font-medium leading-relaxed">{r.description}</p>
                      
                      {/* MULTIMEDIA RENDERER DISINI */}
                      {renderMultimedia(r.multimedia_url)}

                      {activeTab === 'mine' && r.admin_note && (
                        <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl">
                          <p className="font-black text-amber-700 text-[10px] uppercase tracking-wider mb-1">Tanggapan Petugas:</p>
                          <p className="text-amber-800 text-sm italic font-bold">"{r.admin_note}"</p>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col items-center">
                      <button 
                        onClick={() => handleUpvote(r.id)} 
                        disabled={upvotedIds.includes(r.id)}
                        className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all shadow-sm ${
                          upvotedIds.includes(r.id) 
                          ? 'bg-blue-600 text-white shadow-blue-200' 
                          : 'bg-white border-2 border-gray-100 text-gray-400 hover:border-blue-300 hover:text-blue-600'
                        }`}
                      >
                        <span className="text-xl leading-none">▲</span>
                        <span className="text-xs font-black">{r.vote_count || 0}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}