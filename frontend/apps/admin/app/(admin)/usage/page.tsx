'use client';

import { useEffect, useState } from 'react';
import { toast } from '@luxebrain/ui/toast';
import { Spinner } from '@luxebrain/ui';

export default function UsagePage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/usage/overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStats(await res.json());
    } catch (error) {
      toast.error('Failed to load usage stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Usage Monitoring</h1>
      
      {stats && (
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total API Calls</div>
            <div className="text-3xl font-bold mt-2">{stats.total_api_calls.toLocaleString()}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">ML Inferences</div>
            <div className="text-3xl font-bold mt-2">{stats.total_ml_inferences.toLocaleString()}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Storage Used</div>
            <div className="text-3xl font-bold mt-2">{stats.total_storage_gb} GB</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Active Tenants</div>
            <div className="text-3xl font-bold mt-2 text-green-600">{stats.active_tenants}</div>
          </div>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">View detailed usage analytics in the Usage Analytics page</p>
      </div>
    </div>
  );
}
