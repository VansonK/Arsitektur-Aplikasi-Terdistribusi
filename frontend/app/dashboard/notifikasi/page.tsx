"use client";

import { useNotificationStore } from '@/store/useNotificationStore';
import { Bell, Calendar, Trash2 } from 'lucide-react';

export default function NotifikasiPage() {
  const { notifications, clearNotifications } = useNotificationStore();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Pusat Notifikasi</h2>
        {notifications.length > 0 && (
          <button 
            onClick={clearNotifications}
            className="flex items-center space-x-2 text-sm text-red-600 hover:underline"
          >
            <Trash2 size={16} />
            <span>Hapus Semua</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-dashed border-gray-300">
            <Bell className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">Belum ada notifikasi baru untuk Anda.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-500 flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-gray-800 font-medium">{notif.message}</p>
                <div className="flex items-center text-xs text-gray-400 space-x-2">
                  <Calendar size={12} />
                  <span>{new Date(notif.created_at).toLocaleString('id-ID')}</span>
                </div>
              </div>
              <div className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded">
                Baru
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}