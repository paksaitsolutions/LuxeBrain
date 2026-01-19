'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@luxebrain/ui';

interface PoolStats {
  pool_size?: number;
  checked_in?: number;
  checked_out?: number;
  overflow?: number;
  total_connections?: number;
  max_overflow?: number;
  utilization_percent?: number;
  status?: string;
  pool_type?: string;
  note?: string;
}

export default function DatabasePoolPage() {
  const [stats, setStats] = useState<PoolStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetchWithAuth('/api/admin/db/pool-stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch pool stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Database Connection Pool</h1>
        <div className="animate-pulse bg-gray-200 h-64 rounded"></div>
      </div>
    );
  }

  const getStatusColor = (status?: string) => {
    if (status === 'critical') return 'bg-red-100 border-red-500 text-red-800';
    if (status === 'warning') return 'bg-yellow-100 border-yellow-500 text-yellow-800';
    return 'bg-green-100 border-green-500 text-green-800';
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Database Connection Pool</h1>

      {stats?.pool_type === 'StaticPool' ? (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-blue-800">{stats.note}</p>
        </div>
      ) : (
        <>
          <div className={`border-l-4 p-6 rounded-lg mb-6 ${getStatusColor(stats?.status)}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Pool Status: {stats?.status?.toUpperCase()}</h2>
                <p className="text-sm mt-1">Utilization: {stats?.utilization_percent}%</p>
              </div>
              <div className="text-3xl font-bold">{stats?.checked_out}/{stats?.total_connections}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Pool Size</p>
              <p className="text-2xl font-bold">{stats?.pool_size}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Checked Out</p>
              <p className="text-2xl font-bold">{stats?.checked_out}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Checked In</p>
              <p className="text-2xl font-bold">{stats?.checked_in}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Overflow</p>
              <p className="text-2xl font-bold">{stats?.overflow}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Max Overflow</p>
              <p className="text-2xl font-bold">{stats?.max_overflow}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Connections</p>
              <p className="text-2xl font-bold">{stats?.total_connections}</p>
            </div>
          </div>

          {stats?.status === 'critical' && (
            <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <h3 className="font-semibold text-red-800">⚠️ Pool Exhaustion Alert</h3>
              <p className="text-red-700 text-sm mt-1">
                Connection pool is critically exhausted. Consider increasing pool size or investigating connection leaks.
              </p>
            </div>
          )}

          {stats?.status === 'warning' && (
            <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <h3 className="font-semibold text-yellow-800">⚠️ High Pool Usage</h3>
              <p className="text-yellow-700 text-sm mt-1">
                Connection pool usage is high. Monitor for potential issues.
              </p>
            </div>
          )}
        </>
      )}

      <div className="mt-6 text-sm text-gray-500">
        Auto-refreshes every 5 seconds
      </div>
    </div>
  );
}
