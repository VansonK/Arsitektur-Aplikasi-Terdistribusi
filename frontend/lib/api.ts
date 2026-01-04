import axios, { InternalAxiosRequestConfig } from 'axios';

const VPS_IP = '103.197.188.83';

/**
 * Konfigurasi Dasar berdasarkan port di docker-compose:
 */

// Port 8003: Login, Register, Profile
const api = axios.create({
  baseURL: `http://${VPS_IP}:8003`,
});

// Port 8001: Submit Laporan Baru (Producing ke Kafka)
export const reportApi = axios.create({
  baseURL: `http://${VPS_IP}:8001`,
});

// Port 8004: Dashboard, Statistik, List Laporan (Query dari Database)
// NOTE: Port 8004 akan kita buka di docker-compose di bawah
export const reportServiceApi = axios.create({
  baseURL: `http://${VPS_IP}:8004`,
});

// Port 8002: Notifikasi User
export const notifApi = axios.create({
  baseURL: `http://${VPS_IP}:8002`,
});

const addAuthToken = (config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage);
        if (state.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      } catch (error) {
        console.error("Gagal membaca token dari storage", error);
      }
    }
  }
  return config;
};

// Terapkan Interceptor ke SEMUA instance
[api, reportApi, reportServiceApi, notifApi].forEach(instance => {
  instance.interceptors.request.use(addAuthToken);
});

export default api;