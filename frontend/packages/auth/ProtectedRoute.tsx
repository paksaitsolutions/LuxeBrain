/**
 * Protected Route Wrapper
 * Copyright © 2024 Paksa IT Solutions
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'super_admin' | 'tenant';
  fallbackUrl?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  fallbackUrl = '/login' 
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          credentials: 'include'
        });

        if (!response.ok) {
          localStorage.setItem('intendedUrl', pathname);
          router.push(`${fallbackUrl}?redirect=${encodeURIComponent(pathname)}`);
          return;
        }

        const data = await response.json();

        if (requiredRole && data.role !== requiredRole) {
          router.push('/unauthorized');
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        localStorage.setItem('intendedUrl', pathname);
        router.push(`${fallbackUrl}?redirect=${encodeURIComponent(pathname)}`);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname, requiredRole, fallbackUrl]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
}
