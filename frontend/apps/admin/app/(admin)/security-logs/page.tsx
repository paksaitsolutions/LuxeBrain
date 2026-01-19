"use client";

/**
 * Security Audit Log Viewer
 * Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
 */

import { useState, useEffect } from "react";
import { apiClient } from "@repo/api/client";

export default function SecurityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [tenantIdFilter, setTenantIdFilter] = useState("");
  const [daysFilter, setDaysFilter] = useState(7);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (eventTypeFilter) params.append("event_type", eventTypeFilter);
      if (userIdFilter) params.append("user_id", userIdFilter);
      if (tenantIdFilter) params.append("tenant_id", tenantIdFilter);
      params.append("days", daysFilter.toString());

      const [logsRes, statsRes, typesRes] = await Promise.all([
        apiClient(`/api/admin/security-logs/recent?${params.toString()}`),
        apiClient("/api/admin/security-logs/stats"),
        apiClient("/api/admin/security-logs/event-types"),
      ]);

      setLogs(logsRes);
      setStats(statsRes);
      setEventTypes(typesRes);
    } catch (error) {
      console.error("Failed to fetch security logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [eventTypeFilter, userIdFilter, tenantIdFilter, daysFilter]);

  const exportToCSV = () => {
    const headers = ["Timestamp", "Event Type", "User ID", "Tenant ID", "IP Address", "Details"];
    const rows = logs.map(log => [
      new Date(log.timestamp).toISOString(),
      log.event_type,
      log.user_id || "",
      log.tenant_id || "",
      log.ip_address || "",
      JSON.stringify(log.details || {})
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-logs-${new Date().toISOString()}.csv`;
    a.click();
  };

  const getEventColor = (eventType: string) => {
    if (eventType.includes("failed") || eventType.includes("locked")) return "text-red-700 bg-red-100";
    if (eventType.includes("login") || eventType.includes("signup")) return "text-green-700 bg-green-100";
    if (eventType.includes("password")) return "text-orange-700 bg-orange-100";
    return "text-blue-700 bg-blue-100";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Audit Log</h1>
          <p className="text-gray-600 mt-2">
            Monitor security events for compliance and forensics
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Export to CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="text-sm text-blue-600 font-medium">Total Events</div>
          <div className="text-3xl font-bold text-blue-900 mt-2">
            {stats?.total_events?.toLocaleString() || 0}
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="text-sm text-green-600 font-medium">Events Today</div>
          <div className="text-3xl font-bold text-green-900 mt-2">
            {stats?.events_today?.toLocaleString() || 0}
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="text-sm text-purple-600 font-medium">Event Types</div>
          <div className="text-3xl font-bold text-purple-900 mt-2">
            {stats?.by_type?.length || 0}
          </div>
        </div>
      </div>

      {/* Event Type Distribution */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Event Distribution</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats?.by_type?.map((type: any, idx: number) => (
            <div key={idx} className="border rounded-lg p-4">
              <div className={`px-3 py-1 rounded text-sm font-medium mb-2 ${getEventColor(type.event_type)}`}>
                {type.event_type}
              </div>
              <div className="text-2xl font-bold">{type.count.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Event Type</label>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">All Events</option>
              {eventTypes.map((type, idx) => (
                <option key={idx} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">User ID</label>
            <input
              type="text"
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              placeholder="e.g. 123"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tenant ID</label>
            <input
              type="text"
              value={tenantIdFilter}
              onChange={(e) => setTenantIdFilter(e.target.value)}
              placeholder="e.g. tenant_123"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Time Range</label>
            <select
              value={daysFilter}
              onChange={(e) => setDaysFilter(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
            >
              <option value={1}>Last 24 Hours</option>
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Security Events Log */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Recent Security Events</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Timestamp</th>
                <th className="text-left py-3 px-4">Event Type</th>
                <th className="text-left py-3 px-4">User ID</th>
                <th className="text-left py-3 px-4">Tenant ID</th>
                <th className="text-left py-3 px-4">IP Address</th>
                <th className="text-left py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded text-xs font-medium ${getEventColor(log.event_type)}`}>
                      {log.event_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-sm">{log.user_id || "-"}</td>
                  <td className="py-3 px-4 font-mono text-sm">{log.tenant_id || "-"}</td>
                  <td className="py-3 px-4 font-mono text-sm">{log.ip_address || "-"}</td>
                  <td className="py-3 px-4 text-xs text-gray-600">
                    {log.details ? JSON.stringify(log.details) : "-"}
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
