'use client';

import { useEffect, useState } from 'react';

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filters, setFilters] = useState({ level: '', module: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [filters]);

  const loadLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.level) params.append('level', filters.level);
      if (filters.module) params.append('module', filters.module);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/system-logs?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/system-logs/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStats(await res.json());
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">System Logs</h1>

      {stats && (
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Logs</div>
            <div className="text-3xl font-bold mt-2">{stats.total}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Errors</div>
            <div className="text-3xl font-bold mt-2 text-red-600">{stats.errors}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Warnings</div>
            <div className="text-3xl font-bold mt-2 text-yellow-600">{stats.warnings}</div>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow flex gap-4">
        <select 
          value={filters.level}
          onChange={(e) => setFilters({...filters, level: e.target.value})}
          className="px-3 py-2 border rounded"
        >
          <option value="">All Levels</option>
          <option value="INFO">INFO</option>
          <option value="WARNING">WARNING</option>
          <option value="ERROR">ERROR</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>
        <input 
          type="text"
          placeholder="Filter by module..."
          value={filters.module}
          onChange={(e) => setFilters({...filters, module: e.target.value})}
          className="flex-1 px-3 py-2 border rounded"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200">
          {logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start gap-4">
                <span className={`px-3 py-1 rounded text-xs font-medium ${
                  log.level === 'ERROR' || log.level === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                  log.level === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {log.level}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{log.message}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {log.module} • {log.function} • {new Date(log.created_at).toLocaleString()}
                  </div>
                  {log.exception && (
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">{log.exception}</pre>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
