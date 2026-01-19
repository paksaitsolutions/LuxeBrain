/**
 * API Error Handler
 * Copyright © 2024 Paksa IT Solutions
 */

import { getCsrfToken } from './csrf';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });
    
    if (response.ok) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  // Add CSRF token for mutations
  const headers = new Headers(options.headers);
  const csrfToken = getCsrfToken();
  if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase() || '')) {
    headers.set('X-CSRF-Token', csrfToken);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  // Handle 401 Unauthorized
  if (response.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      
      const refreshed = await refreshToken();
      isRefreshing = false;
      
      if (refreshed) {
        onTokenRefreshed('refreshed');
        // Retry original request
        return fetch(url, {
          ...options,
          headers,
          credentials: 'include'
        });
      } else {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    } else {
      // Wait for refresh to complete
      return new Promise((resolve) => {
        subscribeTokenRefresh(() => {
          resolve(fetch(url, {
            ...options,
            headers,
            credentials: 'include'
          }));
        });
      });
    }
  }

  // Handle 402 Payment Required
  if (response.status === 402) {
    const data = await response.json();
    alert(`⚠️ ${data.detail}\n\nPlease upgrade your plan to continue.`);
    if (data.upgrade_url) {
      window.location.href = data.upgrade_url;
    }
    throw new Error('Plan limit exceeded');
  }

  return response;
}

export function handleApiError(response: Response) {
  if (response.status === 402) {
    response.json().then(data => {
      alert(`⚠️ ${data.detail}\n\nPlease upgrade your plan to continue.`);
      if (data.upgrade_url) {
        window.location.href = data.upgrade_url;
      }
    });
    return true;
  }
  return false;
}

export async function fetchWithLimitCheck(url: string, options?: RequestInit) {
  const response = await fetchWithAuth(url, options);
  
  if (handleApiError(response)) {
    throw new Error('Plan limit exceeded');
  }
  
  return response;
}
