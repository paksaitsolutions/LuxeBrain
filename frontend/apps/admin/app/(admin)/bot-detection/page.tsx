'use client';

import { useState, useEffect } from 'react';
import { toast } from '@luxebrain/ui/toast';

export default function BotDetectionPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentDetections, setRecentDetections] = useState<any[]>([]);
  const [blockedIps, setBlockedIps] = useState<any>(null);
  const [honeypotStats, setHoneypotStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, detectionsRes, blockedRes, honeypotRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/bot-detection/stats`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/bot-detection/recent?limit=20`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/bot-detection/blocked-ips`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/bot-detection/honeypot-stats`),
      ]);

      setStats(await statsRes.json());
      setRecentDetections(await detectionsRes.json());
      setBlockedIps(await blockedRes.json());
      setHoneypotStats(await honeypotRes.json());
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch bot detection data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const unblockIp = async (ip: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/bot-detection/unblock/${ip}`, {
        method: 'DELETE',
      });
      toast.success(`Unblocked ${ip}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to unblock IP');
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Bot Detection</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Detections</p>
          <p className="text-3xl font-bold">{stats?.total_detections || 0}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Today</p>
          <p className="text-3xl font-bold text-blue-600">{stats?.today_detections || 0}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Blocked IPs</p>
          <p className="text-3xl font-bold text-red-600">{blockedIps?.count || 0}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Tracked IPs</p>
          <p className="text-3xl font-bold text-yellow-600">{stats?.memory_stats?.tracked_ips || 0}</p>
        </div>
      </div>

      {/* Detection Reasons */}
      {stats?.by_reason && Object.keys(stats.by_reason).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Detection Reasons</h2>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(stats.by_reason).map(([reason, count]: [string, any]) => (
              <div key={reason} className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600 capitalize">{reason.replace('_', ' ')}</p>
                <p className="text-2xl font-bold">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Honeypot Detections */}
      {honeypotStats && honeypotStats.total > 0 && (
        <div className="bg-yellow-50 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🍯 Honeypot Detections</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-4 rounded">
              <p className="text-sm text-gray-600">Total Caught</p>
              <p className="text-2xl font-bold text-yellow-600">{honeypotStats.total}</p>
            </div>
            <div className="bg-white p-4 rounded">
              <p className="text-sm text-gray-600">Today</p>
              <p className="text-2xl font-bold text-yellow-600">{honeypotStats.today}</p>
            </div>
          </div>
          {honeypotStats.recent && honeypotStats.recent.length > 0 && (
            <div className="bg-white rounded p-4">
              <h3 className="font-medium mb-2">Recent Honeypot Catches</h3>
              <div className="space-y-2">
                {honeypotStats.recent.slice(0, 5).map((h: any) => (
                  <div key={h.id} className="text-sm border-b pb-2">
                    <p><span className="font-medium">IP:</span> {h.ip_address}</p>
                    <p><span className="font-medium">Email:</span> {h.email}</p>
                    <p className="text-xs text-gray-500">{new Date(h.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Blocked IPs */}
      {blockedIps && blockedIps.count > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Currently Blocked IPs</h2>
          <div className="space-y-2">
            {Object.entries(blockedIps.blocked_ips).map(([ip, expires]: [string, any]) => (
              <div key={ip} className="flex items-center justify-between p-3 bg-red-50 rounded">
                <div>
                  <p className="font-mono font-medium">{ip}</p>
                  <p className="text-sm text-gray-600">Expires: {new Date(expires).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => unblockIp(ip)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Detections */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Detections</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">IP Address</th>
                <th className="text-left p-3">User Agent</th>
                <th className="text-left p-3">Endpoint</th>
                <th className="text-left p-3">Reason</th>
                <th className="text-left p-3">Requests</th>
                <th className="text-left p-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentDetections.map((detection) => (
                <tr key={detection.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono text-sm">{detection.ip_address}</td>
                  <td className="p-3 text-sm max-w-xs truncate">{detection.user_agent}</td>
                  <td className="p-3 text-sm">{detection.endpoint}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs rounded ${
                      detection.reason === 'bot_pattern' ? 'bg-red-100 text-red-800' :
                      detection.reason === 'flooding' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {detection.reason}
                    </span>
                  </td>
                  <td className="p-3 text-sm">{detection.request_count}</td>
                  <td className="p-3 text-sm">{new Date(detection.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
