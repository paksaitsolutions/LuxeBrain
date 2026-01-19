"use client";

/**
 * Slow Query Monitoring Page
 * Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
 */

import { useState, useEffect } from "react";
import { apiClient } from "@repo/api/client";

export default function SlowQueriesPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [slowestEndpoints, setSlowestEndpoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [tenantFilter, setTenantFilter] = useState("");
  const [endpointFilter, setEndpointFilter] = useState("");

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (tenantFilter) params.append("tenant_id", tenantFilter);
      if (endpointFilter) params.append("endpoint", endpointFilter);

      const [logsRes, statsRes, endpointsRes] = await Promise.all([
        apiClient(`/api/admin/slow-queries/recent?${params.toString()}`),
        apiClient("/api/admin/slow-queries/stats"),
        apiClient("/api/admin/slow-queries/slowest-endpoints"),
      ]);

      setLogs(logsRes);
      setStats(statsRes);
      setSlowestEndpoints(endpointsRes);
    } catch (error) {
      console.error("Failed to fetch slow queries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [tenantFilter, endpointFilter]);

  const getDurationColor = (duration: number) => {
    if (duration < 2) return "text-yellow-700 bg-yellow-100";
    if (duration < 5) return "text-orange-700 bg-orange-100";
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
        <h1 className="text-3xl font-bold">Slow Query Detection</h1>
        <p className="text-gray-600 mt-2">
          Monitor queries taking longer than 1 second for performance optimization
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-sm text-red-600 font-medium">Total Slow Queries</div>
          <div className="text-3xl font-bold text-red-900 mt-2">
            {stats?.total_slow_queries?.toLocaleString() || 0}
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="text-sm text-orange-600 font-medium">Today</div>
          <div className="text-3xl font-bold text-orange-900 mt-2">
            {stats?.slow_queries_today?.toLocaleString() || 0}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="text-sm text-yellow-600 font-medium">Avg Duration</div>
          <div className="text-3xl font-bold text-yellow-900 mt-2">
            {stats?.avg_duration || 0}s
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="text-sm text-purple-600 font-medium">Max Duration</div>
          <div className="text-3xl font-bold text-purple-900 mt-2">
            {stats?.max_duration || 0}s
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {stats?.slow_queries_today > 10 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="text-red-600 text-2xl">⚠️</div>
            <div>
              <div className="font-bold text-red-900">Performance Alert</div>
              <div className="text-sm text-red-700">
                {stats.slow_queries_today} slow queries detected today. Consider optimizing these endpoints.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Slowest Endpoints */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Slowest Endpoints (Needs Optimization)</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Endpoint</th>
                <th className="text-left py-3 px-4">Slow Count</th>
                <th className="text-left py-3 px-4">Avg Duration</th>
                <th className="text-left py-3 px-4">Max Duration</th>
              </tr>
            </thead>
            <tbody>
              {slowestEndpoints.map((ep, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm">{ep.endpoint}</td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      {ep.count}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-orange-700">{ep.avg_duration}s</td>
                  <td className="py-3 px-4 font-bold text-red-700">{ep.max_duration}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Slow Queries */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Recent Slow Queries</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Time</th>
                <th className="text-left py-3 px-4">Method</th>
                <th className="text-left py-3 px-4">Endpoint</th>
                <th className="text-left py-3 px-4">Duration</th>
                <th className="text-left py-3 px-4">Tenant</th>
                <th className="text-left py-3 px-4">Query Params</th>
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
                    <span className={`px-3 py-1 rounded text-sm font-bold ${getDurationColor(log.duration)}`}>
                      {log.duration.toFixed(3)}s
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-sm">{log.tenant_id || "-"}</td>
                  <td className="py-3 px-4 text-xs text-gray-600 truncate max-w-xs">
                    {log.query_params || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
