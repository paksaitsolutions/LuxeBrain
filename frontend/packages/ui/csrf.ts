/**
 * CSRF Token Utility
 * Copyright © 2024 Paksa IT Solutions
 */

export const getCsrfToken = (): string | null => {
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : null;
};

export const fetchWithCsrf = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const csrfToken = getCsrfToken();
  
  const headers = new Headers(options.headers);
  if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase() || '')) {
    headers.set('X-CSRF-Token', csrfToken);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });
};
