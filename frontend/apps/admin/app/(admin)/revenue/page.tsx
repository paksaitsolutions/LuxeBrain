'use client';

import { useEffect, useState } from 'react';

export default function RevenuePage() {
  const [revenue, setRevenue] = useState({ mrr: 0, by_plan: { basic: 0, premium: 0, enterprise: 0 } });
  const [overage, setOverage] = useState({ tenants: [], total_overage_revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/billing/revenue', {
        headers: { 'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}` }
      }).then(res => res.json()),
      fetch('/api/metering/admin/overage-summary', {
        headers: { 'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}` }
      }).then(res => res.json())
    ])
      .then(([revenueData, overageData]) => {
        setRevenue(revenueData);
        setOverage(overageData);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  const arr = revenue.mrr * 12;
  const totalTenants = revenue.by_plan.basic + revenue.by_plan.premium + revenue.by_plan.enterprise;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Revenue Analytics</h1>
      
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">MRR</h3>
          <p className="text-3xl font-bold mt-2">${revenue.mrr.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">ARR</h3>
          <p className="text-3xl font-bold mt-2">${arr.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">Overage Revenue</h3>
          <p className="text-3xl font-bold mt-2 text-green-600">${overage.total_overage_revenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">Total Tenants</h3>
          <p className="text-3xl font-bold mt-2">{totalTenants}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Revenue by Plan</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span>Basic (Free)</span>
            <span className="font-semibold">{revenue.by_plan.basic} tenants</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Premium ($99/mo)</span>
            <span className="font-semibold">{revenue.by_plan.premium} tenants - ${revenue.by_plan.premium * 99}/mo</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Enterprise ($299/mo)</span>
            <span className="font-semibold">{revenue.by_plan.enterprise} tenants - ${revenue.by_plan.enterprise * 299}/mo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
