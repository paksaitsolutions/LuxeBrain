"use client";

import { useState, useEffect } from "react";

export default function ApiLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [tenantFilter, setTenantFilter] = useState("");
  const [endpointFilter, setEndpointFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (tenantFilter) params.append("tenant_id", tenantFilter);
      if (endpointFilter) params.append("endpoint", endpointFilter);
      if (statusFilter) params.append("status_code", statusFilter);
      if (methodFilter) params.append("method", methodFilter);

      const [logsRes, statsRes, endpointsRes, tenantsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/api-logs/recent?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/api-logs/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/api-logs/endpoints`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/api-logs/tenants`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
      ]);

      setLogs(logsRes);
      setStats(statsRes);
      setEndpoints(endpointsRes);
      setTenants(tenantsRes);
    } catch (error) {
      console.error("Failed to fetch API logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [tenantFilter, endpointFilter, statusFilter, methodFilter]);

  const getStatusColor = (status: number) => {
    if (status < 300) return "text-green-700 bg-green-100";
    if (status < 400) return "text-blue-700 bg-blue-100";
    if (status < 500) return "text-orange-700 bg-orange-100";
    return "text-red-700 bg-red-100";
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API Request Logs</h1>
        <p className="text-gray-600 mt-2">
          Monitor and debug API requests across all tenants
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="text-sm text-blue-600 font-medium">Total Requests</div>
          <div className="text-3xl font-bold text-blue-900 mt-2">
            {stats?.total_requests?.toLocaleString() || 0}
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="text-sm text-green-600 font-medium">Today</div>
          <div className="text-3xl font-bold text-green-900 mt-2">
            {stats?.requests_today?.toLocaleString() || 0}
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="text-sm text-purple-600 font-medium">Avg Response</div>
          <div className="text-3xl font-bold text-purple-900 mt-2">
            {stats?.avg_response_time || 0}s
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-sm text-red-600 font-medium">Total Errors</div>
          <div className="text-3xl font-bold text-red-900 mt-2">
            {stats?.total_errors?.toLocaleString() || 0}
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="text-sm text-orange-600 font-medium">Errors Today</div>
          <div className="text-3xl font-bold text-orange-900 mt-2">
            {stats?.errors_today?.toLocaleString() || 0}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Method</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">All Methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status Code</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">All Status</option>
              <option value="200">200 OK</option>
              <option value="201">201 Created</option>
              <option value="400">400 Bad Request</option>
              <option value="401">401 Unauthorized</option>
              <option value="403">403 Forbidden</option>
              <option value="404">404 Not Found</option>
              <option value="429">429 Rate Limited</option>
              <option value="500">500 Server Error</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Endpoint</label>
            <input
              type="text"
              value={endpointFilter}
              onChange={(e) => setEndpointFilter(e.target.value)}
              placeholder="e.g. /api/v1/recommendations"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tenant ID</label>
            <input
              type="text"
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              placeholder="e.g. tenant_123"
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Top Endpoints */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Top Endpoints</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Endpoint</th>
                <th className="text-left py-3 px-4">Requests</th>
                <th className="text-left py-3 px-4">Avg Response Time</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((ep, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm">{ep.endpoint}</td>
                  <td className="py-3 px-4">{ep.count.toLocaleString()}</td>
                  <td className="py-3 px-4">{ep.avg_response_time}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Tenants */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Top Tenants by Usage</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Tenant ID</th>
                <th className="text-left py-3 px-4">Requests</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono">{tenant.tenant_id}</td>
                  <td className="py-3 px-4">{tenant.request_count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Logs */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Recent API Requests</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Time</th>
                <th className="text-left py-3 px-4">Method</th>
                <th className="text-left py-3 px-4">Endpoint</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Response Time</th>
                <th className="text-left py-3 px-4">Tenant</th>
                <th className="text-left py-3 px-4">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                      {log.method}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-sm">{log.endpoint}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(log.status_code)}`}>
                      {log.status_code}
                    </span>
                  </td>
                  <td className="py-3 px-4">{log.response_time.toFixed(3)}s</td>
                  <td className="py-3 px-4 font-mono text-sm">{log.tenant_id || "-"}</td>
                  <td className="py-3 px-4 font-mono text-sm">{log.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
