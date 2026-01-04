"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { reportApi } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { ArrowLeft, Send, Upload, X, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function LaporBaruPage() {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const { user } = useAuthStore();
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('user_id', String(user?.id || 'anonymous')); // Menggunakan ID dari Auth Store
    formData.append('title', title);
    formData.append('department', department);
    formData.append('description', description);
    formData.append('anonymous', String(anonymous));
    
    // Append semua file
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      // Mengirim ke Reporting Engine (Port 8001)
      await reportApi.post('/report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setIsSuccess(true);
      setTimeout(() => router.push('/dashboard'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Gagal mengirim laporan. Coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-green-100 p-6 rounded-full text-green-600 mb-6">
          <CheckCircle2 size={64} />
        </div>
        <h2 className="text-3xl font-bold text-gray-800">Laporan Terkirim!</h2>
        <p className="text-gray-500 mt-2">Laporan Anda sedang diproses dan akan segera diteruskan ke dinas terkait.</p>
        <Link href="/dashboard" className="mt-8 text-blue-600 font-medium hover:underline">
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center space-x-4">
        <Link href="/dashboard" className="p-2 hover:bg-gray-200 rounded-full transition">
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-2xl font-bold text-gray-800">Buat Laporan Baru</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-6">
        {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Judul Laporan</label>
            <input
              type="text" required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Contoh: Jalan Berlubang di Jl. Sudirman"
              value={title} onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Tujuan Departemen</label>
            <select 
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={department} onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">Pilih Departemen...</option>
              <option value="Kebersihan">Dinas Kebersihan</option>
              <option value="Perhubungan">Dinas Perhubungan</option>
              <option value="Infrastruktur">Dinas Pekerjaan Umum</option>
              <option value="Kesehatan">Dinas Kesehatan</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Deskripsi Kejadian</label>
          <textarea
            required rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ceritakan detail kejadian, lokasi persis, dan waktu..."
            value={description} onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Upload Section */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Lampiran Foto/Video</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition cursor-pointer relative">
            <input 
              type="file" multiple accept="image/*,video/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
            <Upload className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-gray-500 text-sm">Klik atau seret file ke sini untuk mengunggah</p>
          </div>
          
          {/* File Preview */}
          {files.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <span className="text-xs text-blue-700 truncate max-w-[180px]">{file.name}</span>
                  <button type="button" onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 py-2">
          <input 
            type="checkbox" id="anon" 
            className="w-4 h-4 text-blue-600"
            checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)}
          />
          <label htmlFor="anon" className="text-sm text-gray-600">Laporkan sebagai anonim</label>
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {loading ? (
            <span>Mengirim Laporan...</span>
          ) : (
            <>
              <Send size={20} />
              <span>Kirim Laporan Sekarang</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}