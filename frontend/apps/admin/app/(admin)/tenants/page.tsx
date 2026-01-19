'use client';

import { useEffect, useState } from 'react';

interface Tenant {
  tenant_id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  subscription_status: string;
  usage: {
    api_calls_today: number;
    ml_inferences_today: number;
    storage_mb: number;
  };
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/billing/tenants', {
      headers: { 'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}` }
    })
      .then(res => res.json())
      .then(data => setTenants(data.tenants || []))
      .finally(() => setLoading(false));
  }, []);

  const updatePlan = async (tenantId: string, plan: string) => {
    await fetch(`/api/admin/billing/tenant/${tenantId}/plan?plan=${plan}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}` }
    });
    window.location.reload();
  };

  const updateStatus = async (tenantId: string, status: string) => {
    await fetch(`/api/admin/billing/tenant/${tenantId}/status?status=${status}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}` }
    });
    window.location.reload();
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tenant Management</h1>
        <div className="text-sm text-gray-600">Total: {tenants.length}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tenants.map((tenant) => (
              <tr key={tenant.tenant_id}>
                <td className="px-6 py-4 whitespace-nowrap">{tenant.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{tenant.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select 
                    value={tenant.plan}
                    onChange={(e) => updatePlan(tenant.tenant_id, e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={tenant.status}
                    onChange={(e) => updateStatus(tenant.tenant_id, e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="canceled">Canceled</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div>API: {tenant.usage.api_calls_today}</div>
                  <div>ML: {tenant.usage.ml_inferences_today}</div>
                  <div>Storage: {tenant.usage.storage_mb.toFixed(1)} MB</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <a href={`/tenants/${tenant.tenant_id}`} className="text-blue-600 hover:underline">View</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
