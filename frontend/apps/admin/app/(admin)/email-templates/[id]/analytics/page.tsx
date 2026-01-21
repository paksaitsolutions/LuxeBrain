'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Spinner } from '@luxebrain/ui';
import { toast } from 'react-hot-toast';

export default function EmailAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id;
  
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [templateId]);

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/email-templates/${templateId}/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center p-12">
      <Spinner size="lg" />
    </div>
  );

  if (!analytics) return (
    <div className="p-6">
      <p>Analytics not found</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-blue-600 hover:underline">
          ← Back
        </button>
        <div>
          <h1 className="text-3xl font-bold">Email Analytics</h1>
          <p className="text-gray-600 mt-1">{analytics.template_name}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Sent</div>
          <div className="text-3xl font-bold text-blue-600">{analytics.total_sent.toLocaleString()}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Open Rate</div>
          <div className="text-3xl font-bold text-green-600">{analytics.open_rate}%</div>
          <div className="text-sm text-gray-500 mt-1">{analytics.total_opened.toLocaleString()} opens</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Click Rate</div>
          <div className="text-3xl font-bold text-purple-600">{analytics.click_rate}%</div>
          <div className="text-sm text-gray-500 mt-1">{analytics.total_clicked.toLocaleString()} clicks</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Bounce Rate</div>
          <div className="text-3xl font-bold text-red-600">{analytics.bounce_rate}%</div>
          <div className="text-sm text-gray-500 mt-1">{analytics.total_bounced.toLocaleString()} bounces</div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Performance Metrics</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Open Rate</span>
                <span className="text-sm text-gray-600">{analytics.open_rate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-600 h-3 rounded-full" 
                  style={{ width: `${analytics.open_rate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Click Rate</span>
                <span className="text-sm text-gray-600">{analytics.click_rate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-purple-600 h-3 rounded-full" 
                  style={{ width: `${analytics.click_rate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Bounce Rate</span>
                <span className="text-sm text-gray-600">{analytics.bounce_rate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-red-600 h-3 rounded-full" 
                  style={{ width: `${analytics.bounce_rate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">About Email Tracking</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Opens are tracked using invisible tracking pixels</li>
          <li>• Clicks are tracked through redirect links</li>
          <li>• Bounces are reported by email servers</li>
          <li>• Note: Some email clients block tracking pixels</li>
        </ul>
      </div>
    </div>
  );
}
