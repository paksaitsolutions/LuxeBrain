'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@luxebrain/ui';
import { toast } from 'react-hot-toast';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  const [filterUserId, setFilterUserId] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [filterUserId, filterAction, filterResource, filterDateFrom, filterDateTo]);

  const loadLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filterUserId) params.append('user_id', filterUserId);
      if (filterAction) params.append('action_type', filterAction);
      if (filterResource) params.append('resource_type', filterResource);
      if (filterDateFrom) params.append('date_from', filterDateFrom);
      if (filterDateTo) params.append('date_to', filterDateTo);
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/audit-logs?${params}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to load logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/audit-logs/stats`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filterUserId) params.append('user_id', filterUserId);
      if (filterAction) params.append('action_type', filterAction);
      if (filterResource) params.append('resource_type', filterResource);
      if (filterDateFrom) params.append('date_from', filterDateFrom);
      if (filterDateTo) params.append('date_to', filterDateTo);
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/audit-logs/export?${params}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Audit logs exported successfully');
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Failed to export audit logs');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setFilterUserId('');
    setFilterAction('');
    setFilterResource('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const getActionColor = (action: string) => {
    if (action.includes('login')) return 'bg-green-100 text-green-800';
    if (action.includes('delete') || action.includes('reject')) return 'bg-red-100 text-red-800';
    if (action.includes('create') || action.includes('add')) return 'bg-blue-100 text-blue-800';
    if (action.includes('update') || action.includes('edit')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) return (
    <div className="flex justify-center items-center p-12">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-gray-600 mt-1">Comprehensive system activity tracking</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={exporting}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Logs</div>
            <div className="text-3xl font-bold text-blue-600">{stats.total_logs.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Last 24 Hours</div>
            <div className="text-3xl font-bold text-green-600">{stats.last_24h.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Retention</div>
            <div className="text-3xl font-bold text-purple-600">90 days</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Showing</div>
            <div className="text-3xl font-bold text-orange-600">{logs.length}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-6 gap-4">
          <input
            type="number"
            placeholder="User ID"
            value={filterUserId}
            onChange={(e) => setFilterUserId(e.target.value)}
            className="px-3 py-2 border rounded"
          />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="">All Actions</option>
            <option value="login">Login</option>
            <option value="tenant_created">Tenant Created</option>
            <option value="tenant_updated">Tenant Updated</option>
            <option value="ticket_reply">Ticket Reply</option>
            <option value="ticket_assigned">Ticket Assigned</option>
          </select>
          <select
            value={filterResource}
            onChange={(e) => setFilterResource(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="">All Resources</option>
            <option value="tenant">Tenant</option>
            <option value="ticket">Ticket</option>
            <option value="user">User</option>
            <option value="plan">Plan</option>
          </select>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="px-3 py-2 border rounded"
          />
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="px-3 py-2 border rounded"
          />
          <button
            onClick={clearFilters}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No audit logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{log.user_email || 'System'}</div>
                    <div className="text-xs text-gray-500">{log.user_role}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {log.resource_type && (
                      <div>
                        <div className="font-medium">{log.resource_type}</div>
                        {log.resource_id && <div className="text-xs text-gray-500">#{log.resource_id}</div>}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {log.details || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log.ip_address || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{new Date(log.created_at).toLocaleDateString()}</div>
                    <div className="text-xs">{new Date(log.created_at).toLocaleTimeString()}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Audit Log Retention Policy</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• All admin and tenant actions are automatically logged</li>
          <li>• Logs are retained for 90 days minimum for compliance</li>
          <li>• Logs older than 90 days are automatically purged</li>
          <li>• Export logs to CSV for long-term archival</li>
        </ul>
      </div>
    </div>
  );
}
