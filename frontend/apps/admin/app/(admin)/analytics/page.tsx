"use client";

/**
 * API Usage Analytics Dashboard
 * Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
 */

import { useState, useEffect } from "react";
import { apiClient } from "@repo/api/client";

export default function AnalyticsPage() {
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [statusDist, setStatusDist] = useState<any[]>([]);
  const [endpointPerf, setEndpointPerf] = useState<any[]>([]);
  const [tenantAnalytics, setTenantAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(24);

  const fetchData = async () => {
    try {
      const [hourlyRes, statusRes, endpointRes, tenantRes] = await Promise.all([
        apiClient(`/api/admin/analytics/hourly?hours=${timeRange}`),
        apiClient("/api/admin/analytics/status-distribution"),
        apiClient("/api/admin/analytics/endpoint-performance"),
        apiClient("/api/admin/analytics/tenant-analytics"),
      ]);

      setHourlyData(hourlyRes);
      setStatusDist(statusRes);
      setEndpointPerf(endpointRes);
      setTenantAnalytics(tenantRes);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const getStatusColor = (status: number) => {
    if (status < 300) return "bg-green-500";
    if (status < 400) return "bg-blue-500";
    if (status < 500) return "bg-orange-500";
    return "bg-red-500";
  };

  const totalRequests = hourlyData.reduce((sum, h) => sum + h.requests, 0);
  const avgResponseTime = hourlyData.length > 0
    ? (hourlyData.reduce((sum, h) => sum + h.avg_response_time, 0) / hourlyData.length).toFixed(3)
    : 0;

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Usage Analytics</h1>
          <p className="text-gray-600 mt-2">
            Monitor endpoint usage and performance metrics
          </p>
        </div>
        <div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="border rounded px-4 py-2"
          >
            <option value={24}>Last 24 Hours</option>
            <option value={48}>Last 48 Hours</option>
            <option value={168}>Last 7 Days</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="text-sm text-blue-600 font-medium">Total Requests</div>
          <div className="text-3xl font-bold text-blue-900 mt-2">
            {totalRequests.toLocaleString()}
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="text-sm text-green-600 font-medium">Avg Response Time</div>
          <div className="text-3xl font-bold text-green-900 mt-2">
            {avgResponseTime}s
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="text-sm text-purple-600 font-medium">Active Tenants</div>
          <div className="text-3xl font-bold text-purple-900 mt-2">
            {tenantAnalytics.length}
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="text-sm text-orange-600 font-medium">Unique Endpoints</div>
          <div className="text-3xl font-bold text-orange-900 mt-2">
            {endpointPerf.length}
          </div>
        </div>
      </div>

      {/* Hourly Requests Chart */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Requests Over Time</h2>
        <div className="h-64 flex items-end gap-1">
          {hourlyData.map((data, idx) => {
            const maxRequests = Math.max(...hourlyData.map(h => h.requests));
            const height = (data.requests / maxRequests) * 100;
            
            return (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-all"
                  style={{ height: `${height}%` }}
                  title={`${data.requests} requests at ${data.hour}`}
                />
                <div className="text-xs text-gray-500 mt-2 rotate-45 origin-left">
                  {new Date(data.hour).getHours()}h
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Code Distribution */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Status Code Distribution</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statusDist.map((status, idx) => (
            <div key={idx} className="border rounded-lg p-4">
              <div className={`w-12 h-12 rounded-full ${getStatusColor(status.status_code)} flex items-center justify-center text-white font-bold mb-2`}>
                {status.status_code}
              </div>
              <div className="text-2xl font-bold">{status.count.toLocaleString()}</div>
              <div className="text-sm text-gray-600">requests</div>
            </div>
          ))}
        </div>
      </div>

      {/* Endpoint Performance */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Top Endpoints by Usage</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Endpoint</th>
                <th className="text-left py-3 px-4">Requests</th>
                <th className="text-left py-3 px-4">Avg Time</th>
                <th className="text-left py-3 px-4">Min Time</th>
                <th className="text-left py-3 px-4">Max Time</th>
              </tr>
            </thead>
            <tbody>
              {endpointPerf.map((ep, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm">{ep.endpoint}</td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {ep.requests.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold">{ep.avg_response_time}s</td>
                  <td className="py-3 px-4 text-green-600">{ep.min_response_time}s</td>
                  <td className="py-3 px-4 text-red-600">{ep.max_response_time}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tenant Analytics */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Tenant Usage Analytics</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Tenant ID</th>
                <th className="text-left py-3 px-4">Total Requests</th>
                <th className="text-left py-3 px-4">Avg Response Time</th>
                <th className="text-left py-3 px-4">Unique Endpoints</th>
              </tr>
            </thead>
            <tbody>
              {tenantAnalytics.map((tenant, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono">{tenant.tenant_id}</td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      {tenant.requests.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4">{tenant.avg_response_time}s</td>
                  <td className="py-3 px-4">{tenant.unique_endpoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
