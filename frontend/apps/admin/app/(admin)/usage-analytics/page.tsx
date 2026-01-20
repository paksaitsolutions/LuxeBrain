'use client';

import { useEffect, useState } from 'react';

export default function UsageAnalyticsPage() {
  const [usage, setUsage] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      loadTrends(selectedTenant);
    }
  }, [selectedTenant]);

  const loadUsage = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/usage/by-tenant`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUsage(data.usage || []);
    } catch (error) {
      console.error('Failed to load usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrends = async (tenantId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/usage/trends?tenant_id=${tenantId}&days=7`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTrends(data.trends || []);
    } catch (error) {
      console.error('Failed to load trends:', error);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Usage Analytics</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold">Usage by Tenant</h2>
        </div>
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">API Calls Today</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ML Inferences</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Storage (MB)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {usage.map((u) => (
              <tr key={u.tenant_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{u.tenant_id}</td>
                <td className="px-6 py-4 text-sm">{u.api_calls_today}</td>
                <td className="px-6 py-4 text-sm">{u.ml_inferences_today}</td>
                <td className="px-6 py-4 text-sm">{u.storage_mb.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm">
                  <button 
                    onClick={() => setSelectedTenant(u.tenant_id)}
                    className="text-blue-600 hover:underline"
                  >
                    View Trends
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTenant && trends.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Usage Trends - {selectedTenant}</h2>
          <div className="space-y-2">
            {trends.map((trend, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-600">{trend.date}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-8">
                  <div 
                    className="bg-blue-600 h-8 rounded-full flex items-center justify-end px-3 text-white text-sm font-medium"
                    style={{ width: `${Math.min((trend.requests / 1000) * 100, 100)}%` }}
                  >
                    {trend.requests}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
