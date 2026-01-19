'use client';

import { useState } from 'react';
import { Button } from '@luxebrain/ui';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [plan, setPlan] = useState('starter');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const res = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, store_name: storeName, plan }),
    });

    if (res.ok) {
      window.location.href = 'http://localhost:3000/overview';
    }
  };

  return (
    <div className=\"min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4\">\n      <div className=\"max-w-md w-full\">\n        <div className=\"text-center mb-8\">\n          <h1 className=\"text-4xl font-bold mb-2\">Start Your Free Trial</h1>\n          <p className=\"text-gray-600\">No credit card required. 14 days free.</p>\n        </div>\n\n        <div className=\"bg-white p-8 rounded-lg shadow-lg\">\n          <form onSubmit={handleSubmit} className=\"space-y-6\">\n            <div>\n              <label className=\"block text-sm font-medium mb-2\">Store Name</label>\n              <input\n                type=\"text\"\n                value={storeName}\n                onChange={(e) => setStoreName(e.target.value)}\n                className=\"w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500\"\n                placeholder=\"My Fashion Store\"\n                required\n              />\n            </div>\n\n            <div>\n              <label className=\"block text-sm font-medium mb-2\">Email</label>\n              <input\n                type=\"email\"\n                value={email}\n                onChange={(e) => setEmail(e.target.value)}\n                className=\"w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500\"\n                placeholder=\"you@store.com\"\n                required\n              />\n            </div>\n\n            <div>\n              <label className=\"block text-sm font-medium mb-2\">Password</label>\n              <input\n                type=\"password\"\n                value={password}\n                onChange={(e) => setPassword(e.target.value)}\n                className=\"w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500\"\n                placeholder=\"••••••••\"\n                required\n              />\n            </div>\n\n            <div>\n              <label className=\"block text-sm font-medium mb-2\">Select Plan</label>\n              <select\n                value={plan}\n                onChange={(e) => setPlan(e.target.value)}\n                className=\"w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500\"\n              >\n                <option value=\"starter\">Starter - $99/mo</option>\n                <option value=\"growth\">Growth - $299/mo</option>\n                <option value=\"pro\">Pro - $799/mo</option>\n              </select>\n            </div>\n\n            <div className=\"text-sm text-gray-600\">\n              <label className=\"flex items-start\">\n                <input type=\"checkbox\" className=\"mt-1 mr-2\" required />\n                <span>I agree to the Terms of Service and Privacy Policy</span>\n              </label>\n            </div>\n\n            <Button type=\"submit\" className=\"w-full py-3 text-lg\">Start Free Trial</Button>\n          </form>\n\n          <p className=\"text-center text-sm text-gray-600 mt-6\">\n            Already have an account? <a href=\"/login\" className=\"text-blue-600 hover:underline\">Log in</a>\n          </p>\n        </div>\n      </div>\n    </div>\n  );\n}
