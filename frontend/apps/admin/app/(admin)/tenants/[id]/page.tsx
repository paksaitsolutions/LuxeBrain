'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;
  
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedTenant, setImpersonatedTenant] = useState<any>(null);

  useEffect(() => {
    loadTenantDetail();
    checkImpersonation();
  }, [tenantId]);

  const checkImpersonation = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.impersonation) {
          setIsImpersonating(true);
          setImpersonatedTenant({
            tenant_id: payload.tenant_id,
            name: payload.sub
          });
        }
      } catch (e) {}
    }
  };

  const loadTenantDetail = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/tenants/${tenantId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTenant(data);
      setEditData({
        email: data.tenant.email,
        name: data.tenant.name,
        plan: data.tenant.plan,
        company_name: data.tenant.company_name || '',
        company_website: data.tenant.company_website || '',
        company_phone: data.tenant.company_phone || '',
        industry: data.tenant.industry || '',
        address_line1: data.tenant.address?.line1 || '',
        address_line2: data.tenant.address?.line2 || '',
        city: data.tenant.address?.city || '',
        state: data.tenant.address?.state || '',
        postal_code: data.tenant.address?.postal_code || '',
        country: data.tenant.address?.country || '',
        poc_name: data.tenant.poc?.name || '',
        poc_email: data.tenant.poc?.email || '',
        poc_phone: data.tenant.poc?.phone || '',
        poc_title: data.tenant.poc?.title || '',
        tax_id: data.tenant.tax_info?.tax_id || '',
        vat_number: data.tenant.tax_info?.vat_number || '',
        woocommerce_url: data.tenant.woocommerce?.url || '',
        woocommerce_key: data.tenant.woocommerce?.key || '',
        woocommerce_secret: data.tenant.woocommerce?.secret || ''
      });
    } catch (error) {
      console.error('Failed to load tenant:', error);
      alert('Failed to load tenant details');
    } finally {
      setLoading(false);
    }
  };

  const updateTenant = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/tenants/${tenantId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editData)
      });
      setShowEditModal(false);
      loadTenantDetail();
      alert('Tenant updated successfully!');
    } catch (error) {
      console.error('Failed to update tenant:', error);
      alert('Failed to update tenant');
    }
  };

  const suspendTenant = async () => {
    if (!confirm('Are you sure you want to suspend this tenant?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/tenants/${tenantId}/suspend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadTenantDetail();
      alert('Tenant suspended');
    } catch (error) {
      console.error('Failed to suspend tenant:', error);
    }
  };

  const impersonateTenant = async () => {
    if (!confirm('Impersonate this tenant? You will be logged in as them for 1 hour.')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/tenants/${tenantId}/impersonate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('original_token', token);
      window.location.href = 'http://localhost:3000';
    } catch (error) {
      console.error('Failed to impersonate tenant:', error);
      alert('Failed to impersonate tenant');
    }
  };

  const exitImpersonation = async () => {
    try {
      const originalToken = localStorage.getItem('original_token');
      if (originalToken) {
        const token = localStorage.getItem('token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/tenants/impersonate/exit`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        localStorage.setItem('token', originalToken);
        localStorage.removeItem('original_token');
        window.location.href = '/tenants';
      }
    } catch (error) {
      console.error('Failed to exit impersonation:', error);
    }
  };

  const deleteTenant = async () => {
    if (!confirm('Are you sure you want to DELETE this tenant? This action cannot be undone!')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/tenants/${tenantId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('Tenant deleted');
      router.push('/tenants');
    } catch (error) {
      console.error('Failed to delete tenant:', error);
      alert('Failed to delete tenant');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!tenant) return <div className="p-6">Tenant not found</div>;

  const { tenant: t, user, usage, billing_history, activities, tickets } = tenant;

  return (
    <div className="space-y-6">
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="bg-orange-500 text-white px-6 py-3 rounded-lg flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="font-bold">⚠️ IMPERSONATING:</span>
            <span>{impersonatedTenant?.name} ({impersonatedTenant?.tenant_id})</span>
          </div>
          <button
            onClick={exitImpersonation}
            className="px-4 py-2 bg-white text-orange-600 rounded hover:bg-gray-100 font-medium"
          >
            Exit Impersonation
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <button onClick={() => router.push('/tenants')} className="text-blue-600 hover:underline mb-2">
            ← Back to Tenants
          </button>
          <h1 className="text-3xl font-bold">{t.name}</h1>
          <p className="text-gray-600">{t.email}</p>
          <div className="flex gap-2 mt-2">
            <span className={`px-3 py-1 rounded-full text-sm ${
              t.status === 'active' ? 'bg-green-100 text-green-800' :
              t.status === 'suspended' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {t.status}
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {t.plan}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={impersonateTenant}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Login as Tenant
          </button>
          <button 
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit
          </button>
          <button 
            onClick={suspendTenant}
            className="px-4 py-2 border border-orange-600 text-orange-600 rounded hover:bg-orange-50"
          >
            Suspend
          </button>
          <button 
            onClick={deleteTenant}
            className="px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-6">
          {['overview', 'billing', 'usage', 'logs', 'integrations'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 border-b-2 font-medium capitalize ${
                activeTab === tab 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">API Calls (30d)</div>
            <div className="text-3xl font-bold mt-2">{usage.api_calls_30d.toLocaleString()}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Revenue</div>
            <div className="text-3xl font-bold mt-2">${usage.total_revenue.toFixed(2)}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Open Tickets</div>
            <div className="text-3xl font-bold mt-2">{usage.open_tickets}</div>
          </div>

          {/* Company Info */}
          <div className="col-span-2 bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-4">Company Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Company Name</div>
                <div className="font-medium">{t.company_name || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Industry</div>
                <div className="font-medium">{t.industry || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Website</div>
                <div className="font-medium">{t.company_website || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Phone</div>
                <div className="font-medium">{t.company_phone || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-4">Account Info</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Tenant ID</div>
                <div className="font-mono text-sm">{t.tenant_id}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Created</div>
                <div className="text-sm">{new Date(t.created_at).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Last Login</div>
                <div className="text-sm">{user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}</div>
              </div>
            </div>
          </div>

          {/* Address */}
          {t.address && (
            <div className="col-span-2 bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-4">Business Address</h3>
              <div className="text-gray-700">
                {t.address.line1 && <div>{t.address.line1}</div>}
                {t.address.line2 && <div>{t.address.line2}</div>}
                {(t.address.city || t.address.state || t.address.postal_code) && (
                  <div>{t.address.city}, {t.address.state} {t.address.postal_code}</div>
                )}
                {t.address.country && <div>{t.address.country}</div>}
              </div>
            </div>
          )}

          {/* Point of Contact */}
          {t.poc && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-4">Point of Contact</h3>
              <div className="space-y-2">
                {t.poc.name && <div className="font-medium">{t.poc.name}</div>}
                {t.poc.title && <div className="text-sm text-gray-600">{t.poc.title}</div>}
                {t.poc.email && <div className="text-sm">{t.poc.email}</div>}
                {t.poc.phone && <div className="text-sm">{t.poc.phone}</div>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subscription Management */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-4">Subscription Management</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600">Current Plan</div>
                <div className="text-xl font-bold">{t.plan}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <div className="text-xl font-bold capitalize">{t.status}</div>
              </div>
            </div>
            <div className="flex gap-3">
              {t.status === 'active' && (
                <button
                  onClick={async () => {
                    if (!confirm('Pause subscription?')) return;
                    try {
                      const token = localStorage.getItem('token');
                      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/billing/subscriptions/${tenantId}?action=pause`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      loadTenantDetail();
                      alert('Subscription paused');
                    } catch (error) {
                      alert('Failed to pause subscription');
                    }
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  Pause
                </button>
              )}
              {t.status === 'suspended' && (
                <button
                  onClick={async () => {
                    if (!confirm('Resume subscription?')) return;
                    try {
                      const token = localStorage.getItem('token');
                      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/billing/subscriptions/${tenantId}?action=resume`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      loadTenantDetail();
                      alert('Subscription resumed');
                    } catch (error) {
                      alert('Failed to resume subscription');
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Resume
                </button>
              )}
              <button
                onClick={async () => {
                  const newPlan = prompt('Enter new plan (free, starter, growth, enterprise):');
                  if (!newPlan) return;
                  try {
                    const token = localStorage.getItem('token');
                    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/billing/subscriptions/${tenantId}?action=change_plan&new_plan=${newPlan}`, {
                      method: 'PUT',
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                    loadTenantDetail();
                    alert('Plan changed');
                  } catch (error) {
                    alert('Failed to change plan');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Change Plan
              </button>
              {t.status !== 'canceled' && (
                <button
                  onClick={async () => {
                    if (!confirm('Cancel subscription? This cannot be undone.')) return;
                    try {
                      const token = localStorage.getItem('token');
                      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/billing/subscriptions/${tenantId}?action=cancel`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      loadTenantDetail();
                      alert('Subscription canceled');
                    } catch (error) {
                      alert('Failed to cancel subscription');
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="font-bold text-lg">Billing History</h3>
            </div>
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {billing_history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No billing history
                    </td>
                  </tr>
                ) : (
                  billing_history.map((bill: any) => (
                    <tr key={bill.id}>
                      <td className="px-6 py-4 text-sm">{new Date(bill.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-medium">${bill.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm">{bill.plan}</td>
                      <td className="px-6 py-4 text-sm">{bill.billing_period}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                          bill.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{bill.stripe_invoice_id || 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'usage' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-lg mb-4">Usage Statistics</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600">API Calls (30 days)</div>
              <div className="text-2xl font-bold mt-2">{usage.api_calls_30d.toLocaleString()}</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600">Total Revenue</div>
              <div className="text-2xl font-bold mt-2">${usage.total_revenue.toFixed(2)}</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600">Open Support Tickets</div>
              <div className="text-2xl font-bold mt-2">{usage.open_tickets}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Activity Timeline */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="font-bold text-lg">Activity Timeline</h3>
            </div>
            <div className="p-6">
              {activities.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No activity logs</div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity: any) => (
                    <div key={activity.id} className="flex gap-4 border-l-2 border-blue-200 pl-4 py-2">
                      <div className="flex-1">
                        <div className="font-medium">{activity.action}</div>
                        {activity.resource_type && (
                          <div className="text-sm text-gray-600">
                            {activity.resource_type} {activity.resource_id && `#${activity.resource_id}`}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(activity.created_at).toLocaleString()} • {activity.ip_address}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Support Tickets */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="font-bold text-lg">Recent Support Tickets</h3>
            </div>
            <div className="p-6">
              {tickets.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No support tickets</div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket: any) => (
                    <div key={ticket.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{ticket.subject}</div>
                          <div className="text-sm text-gray-600">#{ticket.ticket_number}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                            ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {ticket.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ticket.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-lg mb-4">Integrations</h3>
          
          {/* API Key */}
          <div className="border rounded-lg p-4 mb-4">
            <div className="font-medium mb-2">API Key</div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={t.api_key} 
                readOnly 
                className="flex-1 px-3 py-2 border rounded bg-gray-50 font-mono text-sm"
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(t.api_key);
                  alert('API key copied!');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
          </div>

          {/* WooCommerce */}
          <div className="border rounded-lg p-4">
            <div className="font-medium mb-3">WooCommerce Integration</div>
            {t.woocommerce?.url ? (
              <div className="space-y-2">
                <div>
                  <div className="text-sm text-gray-600">Store URL</div>
                  <div className="font-mono text-sm">{t.woocommerce.url}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Consumer Key</div>
                  <div className="font-mono text-sm">{t.woocommerce.key?.substring(0, 20)}...</div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700">Connected</span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">Not configured</div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Edit Tenant</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input 
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input 
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Plan</label>
                  <select
                    value={editData.plan}
                    onChange={(e) => setEditData({...editData, plan: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="growth">Growth</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Company Name</label>
                  <input 
                    type="text"
                    value={editData.company_name}
                    onChange={(e) => setEditData({...editData, company_name: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button 
                onClick={updateTenant}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
              <button 
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
