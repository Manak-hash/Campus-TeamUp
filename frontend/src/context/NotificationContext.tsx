import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationsService } from '../services/notifications.service';
import { useAuth } from '../hooks/useAuth';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  decrementUnreadCount: (by?: number) => void;
  clearUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const count = await notificationsService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Silently fail — navbar badge is non-critical
    }
  }, [user]);

  const decrementUnreadCount = useCallback((by = 1) => {
    setUnreadCount(prev => Math.max(0, prev - by));
  }, []);

  const clearUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Fetch on login or mount
  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  // Poll every 60 seconds while logged in
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(refreshUnreadCount, 60_000);
    return () => clearInterval(interval);
  }, [user, refreshUnreadCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount, decrementUnreadCount, clearUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
