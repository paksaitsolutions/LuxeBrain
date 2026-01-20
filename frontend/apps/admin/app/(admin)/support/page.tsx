'use client';

import { useEffect, useState } from 'react';
import { toast } from '@luxebrain/ui/toast';
import { Spinner } from '@luxebrain/ui';

export default function SupportPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/support/overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStats(await res.json());
    } catch (error) {
      toast.error('Failed to load support stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Support & Escalation</h1>
      
      {stats && (
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Open Tickets</div>
            <div className="text-3xl font-bold mt-2">{stats.open_tickets}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Pending Escalations</div>
            <div className="text-3xl font-bold mt-2 text-orange-600">{stats.pending_escalations}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Avg Response Time</div>
            <div className="text-3xl font-bold mt-2">{stats.avg_response_time}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Satisfaction Rate</div>
            <div className="text-3xl font-bold mt-2 text-green-600">{stats.satisfaction_rate}%</div>
          </div>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">View detailed support tickets in the Support Tickets page</p>
      </div>
    </div>
  );
}
