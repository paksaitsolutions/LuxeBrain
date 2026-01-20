'use client';

import { useEffect, useState } from 'react';
import { Spinner } from '@luxebrain/ui';
import { toast } from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalRevenue: 0,
    activeAnomalies: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center p-12">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm mb-2">Total Tenants</div>
          <div className="text-3xl font-bold">{stats.totalTenants}</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm mb-2">Active Tenants</div>
          <div className="text-3xl font-bold text-green-600">{stats.activeTenants}</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm mb-2">Monthly Revenue</div>
          <div className="text-3xl font-bold">${stats.totalRevenue}</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm mb-2">Active Anomalies</div>
          <div className="text-3xl font-bold text-red-600">{stats.activeAnomalies}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a href="/tenants" className="block p-3 bg-blue-50 hover:bg-blue-100 rounded">
              → Manage Tenants
            </a>
            <a href="/models" className="block p-3 bg-blue-50 hover:bg-blue-100 rounded">
              → Model Versions
            </a>
            <a href="/anomalies" className="block p-3 bg-blue-50 hover:bg-blue-100 rounded">
              → View Anomalies
            </a>
            <a href="/revenue" className="block p-3 bg-blue-50 hover:bg-blue-100 rounded">
              → Revenue Analytics
            </a>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>API Server</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Healthy</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Database</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Healthy</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Redis Cache</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Healthy</span>
            </div>
            <div className="flex justify-between items-center">
              <span>ML Models</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Healthy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
