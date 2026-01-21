'use client';

import { useEffect, useState } from 'react';
import { Spinner } from '@luxebrain/ui';
import { toast } from 'react-hot-toast';

export default function PlanAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/plans/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load plan analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center p-12">
      <Spinner size="lg" />
    </div>
  );

  if (!analytics) return <div className="p-6">No data available</div>;

  const planColors = {
    free: 'bg-gray-500',
    starter: 'bg-blue-500',
    growth: 'bg-green-500',
    enterprise: 'bg-purple-500'
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Plan Analytics</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm mb-2">Total Active Subscribers</div>
          <div className="text-3xl font-bold">{analytics.total_active}</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm mb-2">Most Popular Plan</div>
          <div className="text-3xl font-bold capitalize">{analytics.most_popular_plan || 'N/A'}</div>
          <div className="text-sm text-gray-600 mt-1">{analytics.most_popular_count} subscribers</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm mb-2">Conversion Rate</div>
          <div className="text-3xl font-bold text-green-600">{analytics.conversion_rate}%</div>
          <div className="text-sm text-gray-600 mt-1">Trial to Paid</div>
        </div>
      </div>

      {/* Subscribers by Plan */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Subscribers by Plan</h2>
        <div className="space-y-4">
          {Object.entries(analytics.subscribers_by_plan).map(([plan, count]: [string, any]) => {
            const percentage = (count / analytics.total_active) * 100;
            return (
              <div key={plan}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium capitalize">{plan}</span>
                  <span className="text-gray-600">{count} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${planColors[plan] || 'bg-gray-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Changes */}
      {Object.keys(analytics.recent_changes).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Plan Changes (Last 30 Days)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(analytics.recent_changes).map(([plan, count]: [string, any]) => (
              <div key={plan} className="text-center p-4 border rounded">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{plan}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
