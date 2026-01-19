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
    
    // TODO: Send to backend API
    console.log('Demo request:', formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className=\"min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4\">\n        <div className=\"max-w-md w-full text-center\">\n          <div className=\"bg-white p-12 rounded-lg shadow-lg\">\n            <div className=\"w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6\">\n              <span className=\"text-3xl\">✓</span>\n            </div>\n            <h1 className=\"text-3xl font-bold mb-4\">Request Received!</h1>\n            <p className=\"text-gray-600 mb-8\">Our team will contact you within 24 hours to schedule your personalized demo.</p>\n            <a href=\"/\">\n              <Button>Back to Home</Button>\n            </a>\n          </div>\n        </div>\n      </div>\n    );
  }

  return (
    <div className=\"min-h-screen bg-gray-50 py-12 px-4\">\n      <div className=\"max-w-2xl mx-auto\">\n        <div className=\"text-center mb-8\">\n          <h1 className=\"text-4xl font-bold mb-2\">Request a Demo</h1>\n          <p className=\"text-gray-600\">See how LuxeBrain AI can grow your revenue. Get a personalized walkthrough.</p>\n        </div>\n\n        <div className=\"bg-white p-8 rounded-lg shadow-lg\">\n          <form onSubmit={handleSubmit} className=\"space-y-6\">\n            <div className=\"grid grid-cols-2 gap-6\">\n              <div>\n                <label className=\"block text-sm font-medium mb-2\">Full Name *</label>\n                <input\n                  type=\"text\"\n                  value={formData.name}\n                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}\n                  className=\"w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500\"\n                  placeholder=\"John Doe\"\n                  required\n                />\n              </div>\n\n              <div>\n                <label className=\"block text-sm font-medium mb-2\">Email *</label>\n                <input\n                  type=\"email\"\n                  value={formData.email}\n                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}\n                  className=\"w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500\"\n                  placeholder=\"you@store.com\"\n                  required\n                />\n              </div>\n            </div>\n\n            <div>\n              <label className=\"block text-sm font-medium mb-2\">Store URL *</label>\n              <input\n                type=\"url\"\n                value={formData.storeUrl}\n                onChange={(e) => setFormData({ ...formData, storeUrl: e.target.value })}\n                className=\"w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500\"\n                placeholder=\"https://yourstore.com\"\n                required\n              />\n            </div>\n\n            <div>\n              <label className=\"block text-sm font-medium mb-2\">Monthly Revenue *</label>\n              <select\n                value={formData.revenue}\n                onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}\n                className=\"w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500\"\n                required\n              >\n                <option value=\"\">Select range</option>\n                <option value=\"0-50k\">$0 - $50K</option>\n                <option value=\"50k-100k\">$50K - $100K</option>\n                <option value=\"100k-250k\">$100K - $250K</option>\n                <option value=\"250k-500k\">$250K - $500K</option>\n                <option value=\"500k+\">$500K+</option>\n              </select>\n            </div>\n\n            <div>\n              <label className=\"block text-sm font-medium mb-2\">What are your goals?</label>\n              <textarea\n                value={formData.message}\n                onChange={(e) => setFormData({ ...formData, message: e.target.value })}\n                className=\"w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500\"\n                rows={4}\n                placeholder=\"Tell us about your store and what you'd like to achieve...\"\n              />\n            </div>\n\n            <Button type=\"submit\" className=\"w-full py-3 text-lg\">Request Demo</Button>\n          </form>\n        </div>\n      </div>\n    </div>\n  );\n}
