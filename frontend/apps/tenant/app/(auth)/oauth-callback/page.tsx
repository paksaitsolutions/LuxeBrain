'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@luxebrain/ui/toast';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const provider = searchParams.get('state') || 'google';

    if (code) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/oauth/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, provider }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.access_token) {
            document.cookie = `token=${data.access_token}; path=/`;
            toast.success('Login successful!');
            router.push('/overview');
          } else {
            toast.error('OAuth login failed');
            router.push('/login');
          }
        })
        .catch(() => {
          toast.error('OAuth login failed');
          router.push('/login');
        });
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing login...</p>
      </div>
    </div>
  );
}
