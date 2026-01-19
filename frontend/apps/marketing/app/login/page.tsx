'use client';

import { useState } from 'react';
import { Button } from '@luxebrain/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `http://localhost:3000/login?email=${encodeURIComponent(email)}`;
  };

  return (
    <div className=\"min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4\">\n      <div className=\"max-w-md w-full\">\n        <div className=\"text-center mb-8\">\n          <h1 className=\"text-4xl font-bold mb-2\">Welcome Back</h1>\n          <p className=\"text-gray-600\">Log in to your LuxeBrain AI dashboard</p>\n        </div>\n\n        <div className=\"bg-white p-8 rounded-lg shadow-lg\">\n          <form onSubmit={handleSubmit} className=\"space-y-6\">\n            <div>\n              <label className=\"block text-sm font-medium mb-2\">Email</label>\n              <input\n                type=\"email\"\n                value={email}\n                onChange={(e) => setEmail(e.target.value)}\n                className=\"w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500\"\n                placeholder=\"you@store.com\"\n                required\n              />\n            </div>\n\n            <div>\n              <label className=\"block text-sm font-medium mb-2\">Password</label>\n              <input\n                type=\"password\"\n                value={password}\n                onChange={(e) => setPassword(e.target.value)}\n                className=\"w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500\"\n                placeholder=\"••••••••\"\n                required\n              />\n            </div>\n\n            <div className=\"flex items-center justify-between text-sm\">\n              <label className=\"flex items-center\">\n                <input type=\"checkbox\" className=\"mr-2\" />\n                <span>Remember me</span>\n              </label>\n              <a href=\"#\" className=\"text-blue-600 hover:underline\">Forgot password?</a>\n            </div>\n\n            <Button type=\"submit\" className=\"w-full py-3 text-lg\">Log In</Button>\n          </form>\n\n          <p className=\"text-center text-sm text-gray-600 mt-6\">\n            Don't have an account? <a href=\"/signup\" className=\"text-blue-600 hover:underline\">Start free trial</a>\n          </p>\n        </div>\n      </div>\n    </div>\n  );\n}
