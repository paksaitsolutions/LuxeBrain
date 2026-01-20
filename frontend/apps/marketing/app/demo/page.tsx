'use client';

import { useState } from 'react';
import { Button } from '@luxebrain/ui';

export default function DemoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    storeUrl: '',
    revenue: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/demo/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setSubmitted(true);
      } else {
        alert('Failed to submit demo request. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to submit demo request. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white p-12 rounded-lg shadow-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">✓</span>
            </div>
            <h1 className="text-3xl font-bold mb-4">Request Received!</h1>
            <p className="text-gray-600 mb-8">Our team will contact you within 24 hours to schedule your personalized demo.</p>
            <a href="/">
              <Button>Back to Home</Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Request a Demo</h1>
          <p className="text-gray-600">See how LuxeBrain AI can grow your revenue. Get a personalized walkthrough.</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="you@store.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Store URL *</label>
              <input
                type="url"
                value={formData.storeUrl}
                onChange={(e) => setFormData({ ...formData, storeUrl: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://yourstore.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Monthly Revenue *</label>
              <select
                value={formData.revenue}
                onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select range</option>
                <option value="0-50k">$0 - $50K</option>
                <option value="50k-100k">$50K - $100K</option>
                <option value="100k-250k">$100K - $250K</option>
                <option value="250k-500k">$250K - $500K</option>
                <option value="500k+">$500K+</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">What are your goals?</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Tell us about your store and what you'd like to achieve..."
              />
            </div>

            <Button type="submit" className="w-full py-3 text-lg">Request Demo</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
