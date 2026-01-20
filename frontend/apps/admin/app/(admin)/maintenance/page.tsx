'use client';

import { useEffect, useState } from 'react';
import { toast } from '@luxebrain/ui/toast';
import { Spinner } from '@luxebrain/ui';

export default function MaintenancePage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/maintenance/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStats(await res.json());
    } catch (error) {
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async (type: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/maintenance/cache/clear?cache_type=${type}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success(`${type} cache cleared`);
    } catch (error) {
      toast.error('Failed to clear cache');
    }
  };

  const optimizeDb = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/maintenance/db/optimize`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Database optimization started');
    } catch (error) {
      toast.error('Failed to optimize database');
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Spinner size="lg" /></div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Maintenance & Backup</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Cache Management</h2>
          <div className="space-y-3">
            <button onClick={() => clearCache('redis')} className="w-full px-4 py-2 border rounded hover:bg-gray-50 text-left">Clear Redis Cache</button>
            <button onClick={() => clearCache('ml_model')} className="w-full px-4 py-2 border rounded hover:bg-gray-50 text-left">Clear ML Model Cache</button>
            <button onClick={() => clearCache('api_response')} className="w-full px-4 py-2 border rounded hover:bg-gray-50 text-left">Clear API Response Cache</button>
            <button onClick={() => clearCache('all')} className="w-full px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50 text-left">Clear All Caches</button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Database Maintenance</h2>
          <div className="space-y-3">
            <button onClick={optimizeDb} className="w-full px-4 py-2 border rounded hover:bg-gray-50 text-left">Optimize Tables</button>
            <button onClick={optimizeDb} className="w-full px-4 py-2 border rounded hover:bg-gray-50 text-left">Rebuild Indexes</button>
            <button onClick={optimizeDb} className="w-full px-4 py-2 border rounded hover:bg-gray-50 text-left">Clean Old Logs (&gt;90 days)</button>
            <button onClick={optimizeDb} className="w-full px-4 py-2 border rounded hover:bg-gray-50 text-left">Vacuum Database</button>
          </div>
        </div>

        {stats && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">System Health</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Disk Usage</span>
                <span className="font-medium">{stats.disk_usage_percent}% ({stats.disk_used_gb}GB / {stats.disk_total_gb}GB)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: `${stats.disk_usage_percent}%`}}></div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span>Memory Usage</span>
                <span className="font-medium">{stats.memory_usage_percent}% ({stats.memory_used_gb}GB / {stats.memory_total_gb}GB)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{width: `${stats.memory_usage_percent}%`}}></div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span>CPU Usage</span>
                <span className="font-medium">{stats.cpu_usage_percent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full" style={{width: `${stats.cpu_usage_percent}%`}}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
