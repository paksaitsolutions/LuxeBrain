'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Spinner } from '@luxebrain/ui';
import { toast } from 'react-hot-toast';

export default function ApiKeyAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/api-keys/${params.id}/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;
  if (!analytics) return <div className="p-12 text-center">No data found</div>;

  const maxCount = Math.max(...analytics.timeline.map((t: any) => t.count), 1);

  return (
    <div>
      <button onClick={() => router.back()} className="mb-4 text-blue-600 hover:underline">
        ← Back to API Keys
      </button>

      <h1 className="text-3xl font-bold mb-6">API Key Analytics</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Key Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-medium">{analytics.key.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tenant ID</p>
            <p className="font-medium">{analytics.key.tenant_id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Created</p>
            <p className="font-medium">{new Date(analytics.key.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Last Used</p>
            <p className="font-medium">
              {analytics.key.last_used_at ? new Date(analytics.key.last_used_at).toLocaleDateString() : 'Never'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm text-gray-600 mb-2">Total Requests</h3>
          <p className="text-3xl font-bold text-blue-600">{analytics.stats.total_requests.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm text-gray-600 mb-2">Avg Response Time</h3>
          <p className="text-3xl font-bold text-green-600">{analytics.stats.avg_response_time.toFixed(2)}ms</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Usage Timeline (Last 30 Days)</h2>
        <div className="space-y-2">
          {analytics.timeline.map((item: any) => (
            <div key={item.date} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-24">{item.date}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div
                  className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                >
                  <span className="text-xs text-white font-medium">{item.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Status Codes</h2>
          <div className="space-y-2">
            {analytics.status_codes.map((item: any) => (
              <div key={item.code} className="flex justify-between items-center">
                <span className={`px-3 py-1 rounded text-sm ${
                  item.code < 300 ? 'bg-green-100 text-green-800' :
                  item.code < 400 ? 'bg-blue-100 text-blue-800' :
                  item.code < 500 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {item.code}
                </span>
                <span className="font-medium">{item.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Top Endpoints</h2>
          <div className="space-y-2">
            {analytics.top_endpoints.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-gray-700 truncate flex-1">{item.endpoint}</span>
                <span className="font-medium ml-2">{item.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
