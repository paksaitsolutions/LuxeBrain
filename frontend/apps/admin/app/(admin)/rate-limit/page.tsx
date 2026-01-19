"use client";

/**
 * Rate Limit Monitoring Page
 * Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
 */

import { useState, useEffect } from "react";
import { apiClient } from "@repo/api/client";

export default function RateLimitPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentBlocks, setRecentBlocks] = useState<any[]>([]);
  const [topIps, setTopIps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, blocksRes, ipsRes] = await Promise.all([
        apiClient("/api/admin/rate-limit/stats"),
        apiClient("/api/admin/rate-limit/recent-blocks?limit=20"),
        apiClient("/api/admin/rate-limit/top-ips?limit=10"),
      ]);

      setStats(statsRes);
      setRecentBlocks(blocksRes);
      setTopIps(ipsRes);
    } catch (error) {
      console.error("Failed to fetch rate limit data:", error);
    } finally {
      setLoading(false);
    }
  };

  const unblockIp = async (ip: string) => {
    try {
      await apiClient(`/api/admin/rate-limit/unblock/${ip}`, {
        method: "POST",
      });
      fetchData();
    } catch (error) {
      console.error("Failed to unblock IP:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

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
        <h1 className="text-3xl font-bold">Rate Limit Monitoring</h1>
        <p className="text-gray-600 mt-2">
          Monitor and manage IP-based rate limiting (100 req/min, 15-min block)
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="text-sm text-blue-600 font-medium">IPs Tracked</div>
          <div className="text-3xl font-bold text-blue-900 mt-2">
            {stats?.total_ips_tracked || 0}
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-sm text-red-600 font-medium">
            Currently Blocked
          </div>
          <div className="text-3xl font-bold text-red-900 mt-2">
            {stats?.blocked_ips || 0}
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="text-sm text-orange-600 font-medium">
            Total Blocks (All Time)
          </div>
          <div className="text-3xl font-bold text-orange-900 mt-2">
            {stats?.total_blocks_all_time || 0}
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="text-sm text-purple-600 font-medium">
            Blocks Today
          </div>
          <div className="text-3xl font-bold text-purple-900 mt-2">
            {stats?.blocks_today || 0}
          </div>
        </div>
      </div>

      {/* Currently Blocked IPs */}
      {stats?.blocked_ip_list && stats.blocked_ip_list.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Currently Blocked IPs</h2>
          <div className="space-y-2">
            {stats.blocked_ip_list.map((block: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded"
              >
                <div>
                  <div className="font-mono font-bold text-red-900">
                    {block.ip}
                  </div>
                  <div className="text-sm text-red-600">
                    Blocked until: {new Date(block.blocked_until).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => unblockIp(block.ip)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top IPs by Block Count */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Top IPs by Block Count</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Rank</th>
                <th className="text-left py-3 px-4">IP Address</th>
                <th className="text-left py-3 px-4">Block Count</th>
              </tr>
            </thead>
            <tbody>
              {topIps.map((ip, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">#{idx + 1}</td>
                  <td className="py-3 px-4 font-mono">{ip.ip_address}</td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      {ip.block_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Blocks */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Recent Rate Limit Blocks</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Time</th>
                <th className="text-left py-3 px-4">IP Address</th>
                <th className="text-left py-3 px-4">Request Count</th>
                <th className="text-left py-3 px-4">User Agent</th>
              </tr>
            </thead>
            <tbody>
              {recentBlocks.map((block) => (
                <tr key={block.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">
                    {new Date(block.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono">{block.ip_address}</td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                      {block.request_count}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 truncate max-w-xs">
                    {block.user_agent || "N/A"}
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
