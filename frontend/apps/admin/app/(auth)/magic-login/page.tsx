'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@luxebrain/ui';
import { toast } from '@luxebrain/ui/toast';

export default function MagicLoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setVerifying(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/magic-link-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.access_token) {
            document.cookie = `token=${data.access_token}; path=/`;
            toast.success('Login successful!');
            router.push('/tenants');
          } else {
            setError('Invalid or expired magic link');
            toast.error('Invalid or expired magic link');
            setVerifying(false);
          }
        })
        .catch(() => {
          setError('Invalid or expired magic link');
          toast.error('Invalid or expired magic link');
          setVerifying(false);
        });
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    setLoading(false);
    if (res.ok) {
      setSent(true);
      toast.success('Magic link sent! Check your email.');
    } else {
      setError('Failed to send magic link');
      toast.error('Failed to send magic link');
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying magic link...</p>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-96 text-center">
          <h1 className="text-2xl font-bold mb-4">Check Your Email</h1>
          <p className="text-gray-600 mb-6">
            We've sent a magic link to <strong>{email}</strong>. Click the link to log in.
          </p>
          <p className="text-sm text-gray-500">Link expires in 15 minutes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6">Magic Link Login</h1>
        <p className="text-gray-600 mb-6">Enter your email to receive a login link</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Magic Link'}
          </Button>
          <div className="text-center">
            <a href="/login" className="text-sm text-blue-600 hover:underline">Back to Login</a>
          </div>
        </form>
      </div>
    </div>
  );
}
