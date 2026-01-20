'use client';

import { useEffect, useState } from 'react';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [pendingTenants, setPendingTenants] = useState<any[]>([]);
  const [demoRequests, setDemoRequests] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTenant, setNewTenant] = useState({ 
    email: '', name: '', plan: 'starter',
    company_name: '', company_website: '', company_phone: '', industry: '',
    address_line1: '', address_line2: '', city: '', state: '', postal_code: '', country: '',
    poc_name: '', poc_email: '', poc_phone: '', poc_title: '',
    tax_id: '', vat_number: '',
    woocommerce_url: '', woocommerce_key: '', woocommerce_secret: ''
  });

  useEffect(() => {
    loadTenants();
    loadPlans();
    loadDemoRequests();
  }, []);

  const loadPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/tenants/plans`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  };

  const loadDemoRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/demo/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setDemoRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to load demo requests:', error);
    }
  };

  const loadTenants = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/tenants`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTenants(data.tenants?.filter((t: any) => t.status === 'active') || []);
      setPendingTenants(data.tenants?.filter((t: any) => t.status === 'pending') || []);
    } catch (error) {
      console.error('Failed to load tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTenant = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/tenants`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTenant)
      });
      setShowCreateModal(false);
      setNewTenant({ 
        email: '', name: '', plan: 'starter',
        company_name: '', company_website: '', company_phone: '', industry: '',
        address_line1: '', address_line2: '', city: '', state: '', postal_code: '', country: '',
        poc_name: '', poc_email: '', poc_phone: '', poc_title: '',
        tax_id: '', vat_number: '',
        woocommerce_url: '', woocommerce_key: '', woocommerce_secret: ''
      });
      loadTenants();
      alert('Tenant created successfully!');
    } catch (error: any) {
      console.error('Failed to create tenant:', error);
      alert(error.message || 'Failed to create tenant');
    }
  };

  const approveTenant = async (tenantId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/tenants/${tenantId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadTenants();
    } catch (error) {
      console.error('Failed to approve tenant:', error);
    }
  };

  const suspendTenant = async (tenantId: string) => {
    if (!confirm('Are you sure you want to suspend this tenant?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/tenants/${tenantId}/suspend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadTenants();
    } catch (error) {
      console.error('Failed to suspend tenant:', error);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tenant Management</h1>
          <p className="text-gray-600 mt-1">Manage all customer accounts and subscriptions</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Create Tenant
        </button>
      </div>

      {/* Demo Requests */}
      {demoRequests.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="bg-purple-500 text-white px-2 py-1 rounded mr-2">{demoRequests.length}</span>
            Demo Requests
          </h2>
          <div className="space-y-3">
            {demoRequests.map(req => (
              <div key={req.id} className="bg-white p-4 rounded">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium">{req.name}</div>
                    <div className="text-sm text-gray-600">{req.email}</div>
                    <div className="text-sm text-gray-600 mt-1">Store: {req.store_url}</div>
                    <div className="text-sm text-gray-600">Revenue: {req.revenue}</div>
                    {req.message && <div className="text-sm text-gray-500 mt-2 italic">"{req.message}"</div>}
                    <div className="text-xs text-gray-500 mt-2">Requested: {new Date(req.created_at).toLocaleDateString()}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    req.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Approvals */}
      {pendingTenants.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="bg-yellow-500 text-white px-2 py-1 rounded mr-2">{pendingTenants.length}</span>
            Pending Approvals
          </h2>
          <div className="space-y-3">
            {pendingTenants.map(tenant => (
              <div key={tenant.tenant_id} className="bg-white p-4 rounded flex justify-between items-center">
                <div>
                  <div className="font-medium">{tenant.name || tenant.email}</div>
                  <div className="text-sm text-gray-600">{tenant.email}</div>
                  <div className="text-xs text-gray-500 mt-1">Requested: {new Date(tenant.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => approveTenant(tenant.tenant_id)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button className="px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Tenants */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold">Active Tenants ({tenants.length})</h2>
        </div>
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tenants.map((tenant) => (
              <tr key={tenant.tenant_id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium">{tenant.name || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{tenant.tenant_id}</div>
                </td>
                <td className="px-6 py-4">{tenant.email}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {tenant.plan || 'starter'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {tenant.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(tenant.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:underline mr-3">View</button>
                  <button className="text-blue-600 hover:underline mr-3">Edit</button>
                  <button 
                    onClick={() => suspendTenant(tenant.tenant_id)}
                    className="text-red-600 hover:underline"
                  >
                    Suspend
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Tenant Modal - Advanced Form */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Create New Tenant</h2>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Store Name *</label>
                    <input 
                      type="text"
                      value={newTenant.name}
                      onChange={(e) => setNewTenant({...newTenant, name: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="My Fashion Store"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input 
                      type="email"
                      value={newTenant.email}
                      onChange={(e) => setNewTenant({...newTenant, email: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="owner@store.com"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Plan *</label>
                    <select 
                      value={newTenant.plan}
                      onChange={(e) => setNewTenant({...newTenant, plan: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      disabled={plans.length === 0}
                    >
                      {plans.length === 0 ? (
                        <option value="">Loading plans...</option>
                      ) : (
                        plans.map(plan => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} - {plan.price === 0 ? 'Free' : `$${plan.price}/mo`}
                            {plan.adminOnly && ' (Admin Only)'}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-3">Company Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Company Name</label>
                    <input 
                      type="text"
                      value={newTenant.company_name}
                      onChange={(e) => setNewTenant({...newTenant, company_name: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Fashion Inc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Industry</label>
                    <select
                      value={newTenant.industry}
                      onChange={(e) => setNewTenant({...newTenant, industry: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Industry</option>
                      <option value="fashion">Fashion & Apparel</option>
                      <option value="jewelry">Jewelry & Accessories</option>
                      <option value="beauty">Beauty & Cosmetics</option>
                      <option value="footwear">Footwear</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Company Website</label>
                    <input 
                      type="url"
                      value={newTenant.company_website}
                      onChange={(e) => setNewTenant({...newTenant, company_website: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="https://www.example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Company Phone</label>
                    <input 
                      type="tel"
                      value={newTenant.company_phone}
                      onChange={(e) => setNewTenant({...newTenant, company_phone: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-3">Business Address</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Address Line 1</label>
                    <input 
                      type="text"
                      value={newTenant.address_line1}
                      onChange={(e) => setNewTenant({...newTenant, address_line1: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Address Line 2</label>
                    <input 
                      type="text"
                      value={newTenant.address_line2}
                      onChange={(e) => setNewTenant({...newTenant, address_line2: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Suite 100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <input 
                      type="text"
                      value={newTenant.city}
                      onChange={(e) => setNewTenant({...newTenant, city: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">State/Province</label>
                    <input 
                      type="text"
                      value={newTenant.state}
                      onChange={(e) => setNewTenant({...newTenant, state: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="NY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Postal Code</label>
                    <input 
                      type="text"
                      value={newTenant.postal_code}
                      onChange={(e) => setNewTenant({...newTenant, postal_code: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="10001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Country</label>
                    <select
                      value={newTenant.country}
                      onChange={(e) => setNewTenant({...newTenant, country: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Country</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="PK">Pakistan</option>
                      <option value="IN">India</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Point of Contact */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-3">Point of Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Name</label>
                    <input 
                      type="text"
                      value={newTenant.poc_name}
                      onChange={(e) => setNewTenant({...newTenant, poc_name: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Title</label>
                    <input 
                      type="text"
                      value={newTenant.poc_title}
                      onChange={(e) => setNewTenant({...newTenant, poc_title: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="CEO / Owner"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Email</label>
                    <input 
                      type="email"
                      value={newTenant.poc_email}
                      onChange={(e) => setNewTenant({...newTenant, poc_email: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Phone</label>
                    <input 
                      type="tel"
                      value={newTenant.poc_phone}
                      onChange={(e) => setNewTenant({...newTenant, poc_phone: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="+1 (555) 987-6543"
                    />
                  </div>
                </div>
              </div>

              {/* Tax Information */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-3">Tax Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tax ID / EIN</label>
                    <input 
                      type="text"
                      value={newTenant.tax_id}
                      onChange={(e) => setNewTenant({...newTenant, tax_id: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="12-3456789"
                    />
                    <p className="text-xs text-gray-500 mt-1">For US businesses</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">VAT Number</label>
                    <input 
                      type="text"
                      value={newTenant.vat_number}
                      onChange={(e) => setNewTenant({...newTenant, vat_number: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="GB123456789"
                    />
                    <p className="text-xs text-gray-500 mt-1">For EU/UK businesses</p>
                  </div>
                </div>
              </div>

              {/* WooCommerce Integration */}
              <div>
                <h3 className="font-semibold text-lg mb-3">WooCommerce Integration (Optional)</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">WooCommerce Store URL</label>
                    <input 
                      type="url"
                      value={newTenant.woocommerce_url}
                      onChange={(e) => setNewTenant({...newTenant, woocommerce_url: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="https://store.example.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Consumer Key</label>
                      <input 
                        type="text"
                        value={newTenant.woocommerce_key}
                        onChange={(e) => setNewTenant({...newTenant, woocommerce_key: e.target.value})}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="ck_xxxxxxxxxxxxx"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Consumer Secret</label>
                      <input 
                        type="password"
                        value={newTenant.woocommerce_secret}
                        onChange={(e) => setNewTenant({...newTenant, woocommerce_secret: e.target.value})}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="cs_xxxxxxxxxxxxx"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">These credentials can be added later in tenant settings</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button 
                onClick={createTenant}
                disabled={!newTenant.email || !newTenant.name}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Create Tenant
              </button>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTenant({ 
                    email: '', name: '', plan: 'starter',
                    company_name: '', company_website: '', company_phone: '', industry: '',
                    address_line1: '', address_line2: '', city: '', state: '', postal_code: '', country: '',
                    poc_name: '', poc_email: '', poc_phone: '', poc_title: '',
                    tax_id: '', vat_number: '',
                    woocommerce_url: '', woocommerce_key: '', woocommerce_secret: ''
                  });
                }}
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
