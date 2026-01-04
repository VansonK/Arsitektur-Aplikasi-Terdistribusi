import { create } from 'zustand';

interface Notification {
  id: string;
  message: string;
  type: string;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notif: Notification) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (notif) => set((state) => ({ 
    notifications: [notif, ...state.notifications] 
  })),
  clearNotifications: () => set({ notifications: [] }),
}));