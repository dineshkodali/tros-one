import React, { createContext, useContext, useState, useCallback } from 'react';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface NotificationContextType {
  notifications: Notification[];
  sonarQueue: Notification[];
  addNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  triggerSonar: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sonarQueue, setSonarQueue] = useState<Notification[]>([]);

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    const newNotif = { id, message, type };
    
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const triggerSonar = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random();
    const sonar = { id, message, type };
    setSonarQueue(prev => [...prev, sonar]);

    // Remove sonar after 2 seconds (Faster fade out)
    setTimeout(() => {
      setSonarQueue(prev => prev.filter(n => n.id !== id));
    }, 2000); 
    
    // Also add to history
    addNotification(message, type);
  }, [addNotification]);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, sonarQueue, addNotification, triggerSonar, clearNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};