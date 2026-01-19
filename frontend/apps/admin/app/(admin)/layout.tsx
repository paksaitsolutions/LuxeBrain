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
      const res = await fetch('http://localhost:8000/api/admin/anomalies/count', {
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
      <aside className="w-64 bg-gray-900 text-white p-6">
        <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>
        <nav className="space-y-2">
          <Link href="/tenants" className="block px-4 py-2 rounded hover:bg-gray-800">Tenants</Link>
          <Link href="/revenue" className="block px-4 py-2 rounded hover:bg-gray-800">Revenue</Link>
          <Link href="/monitoring" className="block px-4 py-2 rounded hover:bg-gray-800">Monitoring</Link>
          <Link href="/features" className="block px-4 py-2 rounded hover:bg-gray-800">Features</Link>
          <Link href="/models" className="block px-4 py-2 rounded hover:bg-gray-800">ML Models</Link>
          <Link href="/isolation-requests" className="block px-4 py-2 rounded hover:bg-gray-800">Isolation Requests</Link>
          <Link href="/anomalies" className="block px-4 py-2 rounded hover:bg-gray-800 flex items-center justify-between">
            <span>Anomalies</span>
            {anomalyCount > 0 && (
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {anomalyCount}
              </span>
            )}
          </Link>
          <Link href="/database" className="block px-4 py-2 rounded hover:bg-gray-800">Database Pool</Link>
          <Link href="/batch-operations" className="block px-4 py-2 rounded hover:bg-gray-800">Batch Operations</Link>
          <Link href="/undo-demo" className="block px-4 py-2 rounded hover:bg-gray-800">Undo Demo</Link>
          <Link href="/bot-detection" className="block px-4 py-2 rounded hover:bg-gray-800">Bot Detection</Link>
          <Link href="/logs" className="block px-4 py-2 rounded hover:bg-gray-800">Logs</Link>
          <Link href="/usage" className="block px-4 py-2 rounded hover:bg-gray-800">Usage</Link>
          <Link href="/support" className="block px-4 py-2 rounded hover:bg-gray-800">Support</Link>
        </nav>
        <button 
          onClick={handleLogout}
          className="mt-8 w-full px-4 py-2 bg-red-600 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
