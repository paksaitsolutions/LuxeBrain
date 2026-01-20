"use client";

import { useState, useEffect } from "react";

export default function DeprecatedApisPage() {
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [usage, setUsage] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [affectedTenants, setAffectedTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [tenantFilter, setTenantFilter] = useState("");
  const [endpointFilter, setEndpointFilter] = useState("");

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (tenantFilter) params.append("tenant_id", tenantFilter);
      if (endpointFilter) params.append("endpoint", endpointFilter);

      const [endpointsRes, usageRes, statsRes, tenantsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/deprecated-apis/list`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/deprecated-apis/usage?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/deprecated-apis/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/deprecated-apis/tenants-affected`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
      ]);

      setEndpoints(endpointsRes);
      setUsage(usageRes);
      setStats(statsRes);
      setAffectedTenants(tenantsRes);
    } catch (error) {
      console.error("Failed to fetch deprecated API data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [tenantFilter, endpointFilter]);

  const getDaysUntilSunset = (sunsetDate: string) => {
    const sunset = new Date(sunsetDate);
    const today = new Date();
    const diff = sunset.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getSunsetColor = (days: number) => {
    if (days < 30) return "text-red-700 bg-red-100";
    if (days < 90) return "text-orange-700 bg-orange-100";
    return "text-yellow-700 bg-yellow-100";
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
        <h1 className="text-3xl font-bold">Deprecated API Endpoints</h1>
        <p className="text-gray-600 mt-2">
          Track usage of deprecated endpoints for migration planning
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="text-sm text-orange-600 font-medium">Total Usage</div>
          <div className="text-3xl font-bold text-orange-900 mt-2">
            {stats?.total_usage?.toLocaleString() || 0}
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-sm text-red-600 font-medium">Usage Today</div>
          <div className="text-3xl font-bold text-red-900 mt-2">
            {stats?.usage_today?.toLocaleString() || 0}
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="text-sm text-purple-600 font-medium">Affected Tenants</div>
          <div className="text-3xl font-bold text-purple-900 mt-2">
            {affectedTenants.length}
          </div>
        </div>
      </div>

      {/* Deprecated Endpoints List */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Deprecated Endpoints</h2>
        <div className="space-y-4">
          {endpoints.map((ep, idx) => {
            const daysLeft = getDaysUntilSunset(ep.sunset_date);
            const usageCount = stats?.by_endpoint?.find((e: any) => e.endpoint === ep.endpoint)?.count || 0;
            
            return (
              <div key={idx} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-mono font-bold text-lg">{ep.endpoint}</div>
                    <div className="text-sm text-gray-600 mt-1">{ep.message}</div>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="text-sm">
                        <span className="font-medium">Replacement:</span>{" "}
                        <span className="font-mono text-blue-600">{ep.replacement}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Usage Count:</span>{" "}
                        <span className="font-bold text-orange-600">{usageCount}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded text-sm font-bold ${getSunsetColor(daysLeft)}`}>
                      {daysLeft} days left
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Sunset: {ep.sunset_date}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Usage Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Endpoint</label>
            <select
              value={endpointFilter}
              onChange={(e) => setEndpointFilter(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">All Endpoints</option>
              {endpoints.map((ep, idx) => (
                <option key={idx} value={ep.endpoint}>{ep.endpoint}</option>
              ))}
            </select>
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

      {/* Affected Tenants */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Tenants Requiring Migration</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Tenant ID</th>
                <th className="text-left py-3 px-4">Deprecated Endpoint</th>
                <th className="text-left py-3 px-4">Usage Count</th>
                <th className="text-left py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {affectedTenants.map((tenant, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono">{tenant.tenant_id}</td>
                  <td className="py-3 px-4 font-mono text-sm">{tenant.endpoint}</td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                      {tenant.usage_count}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                      Notify Tenant
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Usage */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Recent Deprecated API Usage</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Time</th>
                <th className="text-left py-3 px-4">Endpoint</th>
                <th className="text-left py-3 px-4">Method</th>
                <th className="text-left py-3 px-4">Tenant</th>
                <th className="text-left py-3 px-4">Replacement</th>
                <th className="text-left py-3 px-4">Sunset Date</th>
              </tr>
            </thead>
            <tbody>
              {usage.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono text-sm">{log.endpoint}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                      {log.method}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-sm">{log.tenant_id || "-"}</td>
                  <td className="py-3 px-4 font-mono text-sm text-blue-600">{log.replacement}</td>
                  <td className="py-3 px-4 text-sm text-red-600">{log.sunset_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
