'use client';

import { useEffect, useState } from 'react';

export default function RevenueAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [byPlan, setByPlan] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [statsRes, planRes, trendsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/revenue/stats`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/revenue/by-plan`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/revenue/trends?days=30`, { headers })
      ]);

      setStats(await statsRes.json());
      setByPlan(await planRes.json());
      setTrends((await trendsRes.json()).trends);
    } catch (error) {
      console.error('Failed to load revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Revenue Analytics</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Monthly Recurring Revenue</div>
          <div className="text-3xl font-bold mt-2">${stats?.mrr || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Revenue</div>
          <div className="text-3xl font-bold mt-2">${stats?.total_revenue || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">This Month</div>
          <div className="text-3xl font-bold mt-2">${stats?.monthly_revenue || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Churn Rate</div>
          <div className="text-3xl font-bold mt-2">{stats?.churn_rate || 0}%</div>
        </div>
      </div>

      {/* Revenue by Plan */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Revenue by Plan</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {byPlan && Object.entries(byPlan.by_plan).map(([plan, revenue]: any) => (
            <div key={plan} className="border rounded p-4">
              <div className="text-sm text-gray-600 capitalize">{plan}</div>
              <div className="text-2xl font-bold">${revenue}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Trends */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Revenue Trends (30 Days)</h2>
        <div className="space-y-2">
          {trends.map((trend, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-24 text-sm text-gray-600">{trend.date}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-8">
                <div 
                  className="bg-green-600 h-8 rounded-full flex items-center justify-end px-3 text-white text-sm font-medium"
                  style={{ width: `${Math.min((trend.revenue / 1000) * 100, 100)}%` }}
                >
                  ${trend.revenue}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
