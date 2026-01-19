/**
 * AutoSave Hook
 * Copyright © 2024 Paksa IT Solutions
 */

import { useEffect, useRef } from 'react';

interface AutoSaveOptions {
  key: string;
  data: any;
  interval?: number;
  enabled?: boolean;
}

export function useAutoSave({ key, data, interval = 30000, enabled = true }: AutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const save = () => {
      try {
        localStorage.setItem(`autosave_${key}`, JSON.stringify({
          data,
          timestamp: Date.now(),
        }));
      } catch (error) {
        console.error('AutoSave failed:', error);
      }
    };

    timeoutRef.current = setInterval(save, interval);

    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
    };
  }, [key, data, interval, enabled]);
}

export function getAutoSavedData<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const saved = localStorage.getItem(`autosave_${key}`);
    if (!saved) return null;

    const { data, timestamp } = JSON.parse(saved);
    const age = Date.now() - timestamp;

    // Expire after 24 hours
    if (age > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(`autosave_${key}`);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to restore autosave:', error);
    return null;
  }
}

export function clearAutoSave(key: string) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`autosave_${key}`);
}
