'use client';

import { useState } from 'react';
import { Button } from '@luxebrain/ui';
import { toast } from '@luxebrain/ui/toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/api/v1/auth/password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    if (res.ok) {
      toast.success('Reset link sent! Check your email.');
      setSubmitted(true);
    } else {
      toast.error('Failed to send reset link');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-96">
          <h1 className="text-2xl font-bold mb-4">Check Your Email</h1>
          <p className="text-gray-600 mb-4">
            If an account exists with {email}, you will receive a password reset link.
          </p>
          <a href="/login" className="text-blue-600 hover:underline">Back to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6">Reset Password</h1>
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
          <Button type="submit" className="w-full">Send Reset Link</Button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          <a href="/login" className="text-blue-600 hover:underline">Back to Login</a>
        </p>
      </div>
    </div>
  );
}
