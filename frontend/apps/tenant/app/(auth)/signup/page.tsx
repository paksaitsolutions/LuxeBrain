'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@luxebrain/ui';
import { toast } from '@luxebrain/ui/toast';
import { useAutoSave, getAutoSavedData, clearAutoSave } from '@luxebrain/ui';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const router = useRouter();

  useEffect(() => {
    const saved = getAutoSavedData<{ email: string; storeName: string }>('signup');
    if (saved) {
      setEmail(saved.email || '');
      setStoreName(saved.storeName || '');
      toast.info('Draft restored');
    }
  }, []);

  useAutoSave({
    key: 'signup',
    data: { email, storeName },
    enabled: !!(email || storeName),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (honeypot) {
      console.log('Bot detected via honeypot');
      return;
    }
    
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, store_name: storeName, honeypot }),
    });

    if (res.ok) {
      clearAutoSave('signup');
      toast.success('Account created successfully!');
      router.push('/overview');
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.detail || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6">Sign Up for LuxeBrain AI</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Store Name</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="My Fashion Store"
              className="w-full px-3 py-2 border rounded"
              required
            />
            <p className="text-gray-500 text-xs mt-1">This will be your tenant identifier</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border rounded"
              required
            />
            <p className="text-gray-500 text-xs mt-1">We'll send a verification email to this address</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border rounded"
              required
            />
            <p className="text-gray-500 text-xs mt-1">Minimum 8 characters with uppercase, lowercase, and numbers</p>
          </div>
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <Button type="submit" className="w-full">Sign Up</Button>
        </form>
      </div>
    </div>
  );
}
