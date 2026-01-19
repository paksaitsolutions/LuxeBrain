/**
 * Auth State Sync Across Tabs
 * Copyright © 2024 Paksa IT Solutions
 */

import { useEffect } from 'react';
import { useAuth } from './AuthContext';

export const AuthSync: React.FC = () => {
  const { refreshAuth } = useAuth();

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_event') {
        const event = e.newValue;
        if (event === 'login' || event === 'logout') {
          refreshAuth();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshAuth]);

  return null;
};

export const broadcastAuthEvent = (event: 'login' | 'logout') => {
  localStorage.setItem('auth_event', event);
  localStorage.removeItem('auth_event');
};
