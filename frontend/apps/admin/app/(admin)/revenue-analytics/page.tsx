'use client';

import { useEffect, useState } from 'react';

export default function RevenueAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterPlan, setFilterPlan] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (filterPlan) params.append('plan', filterPlan);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/billing/revenue/analytics?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!analytics) return <div className="p-6">No data available</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Revenue Analytics</h1>
        <div className="flex gap-3">
          <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} className="px-3 py-2 border rounded">
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <button onClick={loadAnalytics} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Apply Filters
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Monthly Recurring Revenue</div>
          <div className="text-3xl font-bold mt-2">${analytics.mrr.toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Annual Recurring Revenue</div>
          <div className="text-3xl font-bold mt-2">${analytics.arr.toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Churn Rate (30d)</div>
          <div className="text-3xl font-bold mt-2">{analytics.churn_rate}%</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Active Tenants</div>
          <div className="text-3xl font-bold mt-2">{analytics.active_tenants}</div>
        </div>
      </div>

      {/* Revenue by Plan */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Revenue by Plan</h2>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(analytics.revenue_by_plan).map(([plan, data]: [string, any]) => (
            <div key={plan} className="border rounded-lg p-4">
              <div className="text-sm text-gray-600 capitalize">{plan}</div>
              <div className="text-2xl font-bold mt-2">${data.revenue}</div>
              <div className="text-sm text-gray-500 mt-1">{data.count} tenants</div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Revenue Trend */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Monthly Revenue Trend (Last 12 Months)</h2>
        <div className="h-64 flex items-end gap-2">
          {analytics.monthly_revenue.map((month: any, idx: number) => {
            const maxRevenue = Math.max(...analytics.monthly_revenue.map((m: any) => m.revenue));
            const height = (month.revenue / maxRevenue) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-blue-500 rounded-t" style={{ height: `${height}%` }}></div>
                <div className="text-xs mt-2 text-gray-600 transform -rotate-45 origin-top-left">{month.month}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Plan Distribution</h2>
        <div className="space-y-3">
          {Object.entries(analytics.revenue_by_plan).map(([plan, data]: [string, any]) => {
            const percentage = (data.count / analytics.active_tenants) * 100;
            return (
              <div key={plan}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize">{plan}</span>
                  <span>{data.count} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
