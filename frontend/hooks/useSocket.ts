import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';

export const useSocket = () => {
  const { token, user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (!token || !user) return;

    // Koneksi ke Notification Service (Port 8002)
    const socket = new WebSocket(`ws://103.197.188.83:8002/ws/${user.id}`);

    socket.onopen = () => {
      console.log('Terhubung ke pusat notifikasi');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Tambahkan ke store saat ada pesan masuk
      addNotification({
        id: Date.now().toString(),
        message: data.message,
        type: data.type || 'info',
        created_at: new Date().toISOString(),
      });
      
      // Opsional: Bunyi notifikasi atau Browser Alert
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Update Laporan", { body: data.message });
      }
    };

    socket.onclose = () => {
      console.log('Koneksi notifikasi terputus');
    };

    return () => {
      socket.close();
    };
  }, [token, user, addNotification]);
};