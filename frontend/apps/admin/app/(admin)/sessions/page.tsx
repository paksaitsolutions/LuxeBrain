'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@luxebrain/ui';
import { toast } from 'react-hot-toast';

interface Session {
  id: number;
  user_id: number;
  email: string;
  full_name: string;
  role: string;
  ip_address: string;
  user_agent: string;
  device_info: string;
  location: string;
  last_activity: string;
  expires_at: string;
  created_at: string;
}

interface SessionConfig {
  session_timeout: number;
  max_sessions_per_user: number;
  idle_timeout: number;
  remember_me_duration: number;
}

interface SessionStats {
  total_active: number;
  active_last_hour: number;
  by_role: Record<string, number>;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [config, setConfig] = useState<SessionConfig | null>(null);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterUserId, setFilterUserId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadSessions(), loadConfig(), loadStats()]);
    setLoading(false);
  };

  const loadSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = filterUserId 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/sessions?user_id=${filterUserId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/sessions`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast.error('Failed to load sessions');
    }
  };

  const loadConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/sessions/config`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setConfig(data);
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/sessions/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const forceLogout = async (sessionId: number, userEmail: string) => {
    if (!confirm(`Force logout session for ${userEmail}? They will need to login again.`)) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      toast.success(`Session terminated for ${userEmail}`);
      loadData();
    } catch (error) {
      console.error('Failed to force logout:', error);
      toast.error('Failed to force logout');
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getDeviceIcon = (userAgent: string) => {
    if (!userAgent) return '🖥️';
    if (userAgent.includes('Mobile')) return '📱';
    if (userAgent.includes('Tablet')) return '📱';
    return '🖥️';
  };

  const getBrowser = (userAgent: string) => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) return (
    <div className="flex justify-center items-center p-12">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Session Management</h1>
        <p className="text-gray-600 mt-1">Monitor and manage active user sessions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Active</div>
          <div className="text-2xl font-bold text-green-600">{stats?.total_active || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Active Last Hour</div>
          <div className="text-2xl font-bold text-blue-600">{stats?.active_last_hour || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Session Timeout</div>
          <div className="text-2xl font-bold text-orange-600">{config ? formatDuration(config.session_timeout) : '-'}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Idle Timeout</div>
          <div className="text-2xl font-bold text-purple-600">{config ? formatDuration(config.idle_timeout) : '-'}</div>
        </div>
      </div>

      {/* Sessions by Role */}
      {stats && stats.by_role && Object.keys(stats.by_role).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Sessions by Role</h3>
          <div className="flex gap-4">
            {Object.entries(stats.by_role).map(([role, count]) => (
              <div key={role} className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                  role === 'admin' ? 'bg-blue-100 text-blue-800' :
                  role === 'support' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {role}: {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Sessions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold">Active Sessions</h2>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            🔄 Refresh
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No active sessions
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium">{session.full_name || session.email}</div>
                      <div className="text-xs text-gray-500">{session.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        session.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                        session.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                        session.role === 'support' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getDeviceIcon(session.user_agent)}</span>
                        <div>
                          <div className="text-sm font-medium">{session.device_info || getBrowser(session.user_agent)}</div>
                          <div className="text-xs text-gray-500 max-w-xs truncate">{session.user_agent}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono">
                      {session.ip_address || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {session.location || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>{getTimeAgo(session.last_activity)}</div>
                      <div className="text-xs text-gray-500">{new Date(session.last_activity).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>{getTimeAgo(session.expires_at)}</div>
                      <div className="text-xs text-gray-500">{new Date(session.expires_at).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => forceLogout(session.id, session.email)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        Terminate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configuration Panel */}
      {config && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">Session Configuration</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout</label>
              <div className="text-2xl font-bold text-blue-600">{formatDuration(config.session_timeout)}</div>
              <p className="text-xs text-gray-500 mt-1">Maximum session duration</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Idle Timeout</label>
              <div className="text-2xl font-bold text-orange-600">{formatDuration(config.idle_timeout)}</div>
              <p className="text-xs text-gray-500 mt-1">Inactivity timeout</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Sessions per User</label>
              <div className="text-2xl font-bold text-purple-600">{config.max_sessions_per_user}</div>
              <p className="text-xs text-gray-500 mt-1">Concurrent session limit</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Remember Me Duration</label>
              <div className="text-2xl font-bold text-green-600">{Math.floor(config.remember_me_duration / 86400)} days</div>
              <p className="text-xs text-gray-500 mt-1">Extended session duration</p>
            </div>
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">🔒 Session Security Features</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>IP Tracking:</strong> All sessions track originating IP addresses</li>
          <li>• <strong>Device Info:</strong> Browser and device information is recorded</li>
          <li>• <strong>Auto-Expiry:</strong> Sessions automatically expire after configured timeout</li>
          <li>• <strong>Idle Detection:</strong> Inactive sessions are terminated</li>
          <li>• <strong>Force Logout:</strong> Admins can immediately terminate any session</li>
          <li>• <strong>Audit Trail:</strong> All session actions are logged for security audits</li>
        </ul>
      </div>
    </div>
  );
}
