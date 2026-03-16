import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationItem {
  id: number;
  message: string;
  type: NotificationType;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  notify: (message: string, type?: NotificationType) => void;
  remove: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      notify: (message, type = 'info') => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setNotifications((current) => [...current, { id, message, type }]);
        setTimeout(() => {
          setNotifications((current) => current.filter((item) => item.id !== id));
        }, 4000);
      },
      remove: (id) => {
        setNotifications((current) => current.filter((item) => item.id !== id));
      },
    }),
    [notifications],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used inside NotificationProvider');
  }

  return context;
}
