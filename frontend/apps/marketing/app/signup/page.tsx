'use client';

import { useState, useEffect } from 'react';
import { Button } from '@luxebrain/ui';
import { toast } from '@luxebrain/ui/toast';
import { useAutoSave, getAutoSavedData, clearAutoSave } from '@luxebrain/ui';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [plan, setPlan] = useState('starter');
  const [honeypot, setHoneypot] = useState(''); // Honeypot field

  useEffect(() => {
    const saved = getAutoSavedData<{ email: string; storeName: string; plan: string }>('marketing-signup');
    if (saved) {
      setEmail(saved.email || '');
      setStoreName(saved.storeName || '');
      setPlan(saved.plan || 'starter');
      toast.info('Draft restored');
    }
  }, []);

  useAutoSave({
    key: 'marketing-signup',
    data: { email, storeName, plan },
    enabled: !!(email || storeName),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check honeypot
    if (honeypot) {
      console.log('Bot detected via honeypot');
      return; // Silently reject
    }
    
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, store_name: storeName, plan, honeypot }),
      });

      if (res.ok) {
        clearAutoSave('marketing-signup');
        const tenantAppUrl = process.env.NEXT_PUBLIC_TENANT_APP_URL || 'http://localhost:3000';
        window.location.href = `${tenantAppUrl}/overview`;
      } else {
        const error = await res.json();
        toast.error(error.message || 'Signup failed');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Start Your Free Trial</h1>
          <p className="text-gray-600">No credit card required. 14 days free.</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Store Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="My Fashion Store"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="you@store.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Select Plan</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="starter">Starter - $99/mo</option>
                <option value="growth">Growth - $299/mo</option>
                <option value="pro">Pro - $799/mo</option>
              </select>
            </div>

            <div className="text-sm text-gray-600">
              <label className="flex items-start">
                <input type="checkbox" className="mt-1 mr-2" required />
                <span>I agree to the Terms of Service and Privacy Policy</span>
              </label>
            </div>

            {/* Honeypot field - hidden from users */}
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

            <Button type="submit" className="w-full py-3 text-lg">Start Free Trial</Button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account? <a href="/login" className="text-blue-600 hover:underline">Log in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
