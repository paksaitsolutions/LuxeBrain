'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [anomalyCount, setAnomalyCount] = useState(0);

  useEffect(() => {
    loadAnomalyCount();
    const interval = setInterval(loadAnomalyCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const loadAnomalyCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return; // Skip if not logged in
      
      const res = await fetch('http://localhost:8000/api/admin/anomalies/count', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setAnomalyCount(data.count || 0);
      }
    } catch (error) {
      console.error('Failed to load anomaly count:', error);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-900 text-white p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>
        <nav className="space-y-1">
          <Link href="/dashboard" className="block px-4 py-2 rounded hover:bg-gray-800 font-medium">📊 Dashboard</Link>
          
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-400 uppercase">Business</div>
          <Link href="/tenants" className="block px-4 py-2 rounded hover:bg-gray-800">👥 Tenants</Link>
          <Link href="/revenue" className="block px-4 py-2 rounded hover:bg-gray-800">💰 Revenue Analytics</Link>
          <Link href="/usage-analytics" className="block px-4 py-2 rounded hover:bg-gray-800">📊 Usage Analytics</Link>
          <Link href="/billing-management" className="block px-4 py-2 rounded hover:bg-gray-800">💳 Billing Management</Link>
          <Link href="/plans" className="block px-4 py-2 rounded hover:bg-gray-800">📦 Pricing Plans</Link>
          <Link href="/coupons" className="block px-4 py-2 rounded hover:bg-gray-800">🎟️ Coupons</Link>
          <Link href="/analytics" className="block px-4 py-2 rounded hover:bg-gray-800">📈 API Analytics</Link>
          
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-400 uppercase">ML & AI</div>
          <Link href="/models" className="block px-4 py-2 rounded hover:bg-gray-800">🤖 ML Models</Link>
          <Link href="/batch-operations" className="block px-4 py-2 rounded hover:bg-gray-800">⚡ Batch Operations</Link>
          <Link href="/anomalies" className="block px-4 py-2 rounded hover:bg-gray-800 flex items-center justify-between">
            <span>🚨 Anomalies</span>
            {anomalyCount > 0 && (
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {anomalyCount}
              </span>
            )}
          </Link>
          
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-400 uppercase">System</div>
          <Link href="/monitoring" className="block px-4 py-2 rounded hover:bg-gray-800">📡 Monitoring</Link>
          <Link href="/database" className="block px-4 py-2 rounded hover:bg-gray-800">🗄️ Database Pool</Link>
          <Link href="/maintenance" className="block px-4 py-2 rounded hover:bg-gray-800">🔧 Maintenance</Link>
          <Link href="/settings" className="block px-4 py-2 rounded hover:bg-gray-800">⚙️ Settings</Link>
          
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-400 uppercase">Security</div>
          <Link href="/bot-detection" className="block px-4 py-2 rounded hover:bg-gray-800">🤖 Bot Detection</Link>
          <Link href="/rate-limit" className="block px-4 py-2 rounded hover:bg-gray-800">⏱️ Rate Limits</Link>
          <Link href="/security-logs" className="block px-4 py-2 rounded hover:bg-gray-800">🔒 Security Logs</Link>
          
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-400 uppercase">Logs & Debug</div>
          <Link href="/system-logs" className="block px-4 py-2 rounded hover:bg-gray-800">📝 System Logs</Link>
          <Link href="/api-logs" className="block px-4 py-2 rounded hover:bg-gray-800">🔌 API Logs</Link>
          <Link href="/slow-queries" className="block px-4 py-2 rounded hover:bg-gray-800">🐌 Slow Queries</Link>
          <Link href="/deprecated-apis" className="block px-4 py-2 rounded hover:bg-gray-800">⚠️ Deprecated APIs</Link>
          
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-400 uppercase">Configuration</div>
          <Link href="/feature-flags" className="block px-4 py-2 rounded hover:bg-gray-800">🎛️ Feature Flags</Link>
          <Link href="/roles" className="block px-4 py-2 rounded hover:bg-gray-800">🔐 Roles & Permissions</Link>
          <Link href="/email-templates" className="block px-4 py-2 rounded hover:bg-gray-800">📧 Email Templates</Link>
          <Link href="/webhooks" className="block px-4 py-2 rounded hover:bg-gray-800">🔗 Webhooks</Link>
          <Link href="/isolation-requests" className="block px-4 py-2 rounded hover:bg-gray-800">🔐 Isolation Requests</Link>
          <Link href="/api-keys" className="block px-4 py-2 rounded hover:bg-gray-800">🔑 API Keys</Link>
          <Link href="/admin-users" className="block px-4 py-2 rounded hover:bg-gray-800">👤 Admin Users</Link>
          <Link href="/backup-restore" className="block px-4 py-2 rounded hover:bg-gray-800">💾 Backup & Restore</Link>
          
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-400 uppercase">Other</div>
          <Link href="/support-tickets" className="block px-4 py-2 rounded hover:bg-gray-800">🎫 Support Tickets</Link>
          <Link href="/notifications-center" className="block px-4 py-2 rounded hover:bg-gray-800">🔔 Notifications</Link>
          <Link href="/undo-demo" className="block px-4 py-2 rounded hover:bg-gray-800">↩️ Undo Demo</Link>
        </nav>
        <button 
          onClick={handleLogout}
          className="mt-8 w-full px-4 py-2 bg-red-600 rounded hover:bg-red-700"
        >
          🚪 Logout
        </button>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
