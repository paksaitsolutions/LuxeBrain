'use client';

import { useEffect, useState } from 'react';

export default function BillingManagementPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ tenant_id: '', amount: 0, description: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/billing/invoices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const createInvoice = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/billing/manual-invoice`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newInvoice)
      });
      setShowCreateModal(false);
      setNewInvoice({ tenant_id: '', amount: 0, description: '' });
      loadInvoices();
    } catch (error) {
      console.error('Failed to create invoice:', error);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Billing Management</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Create Manual Invoice
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{inv.id}</td>
                <td className="px-6 py-4 text-sm font-medium">{inv.tenant_id}</td>
                <td className="px-6 py-4 text-sm">${inv.amount}</td>
                <td className="px-6 py-4 text-sm capitalize">{inv.plan}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                    inv.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(inv.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Create Manual Invoice</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tenant ID</label>
                <input 
                  type="text"
                  value={newInvoice.tenant_id}
                  onChange={(e) => setNewInvoice({...newInvoice, tenant_id: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount ($)</label>
                <input 
                  type="number"
                  value={newInvoice.amount}
                  onChange={(e) => setNewInvoice({...newInvoice, amount: Number(e.target.value)})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  value={newInvoice.description}
                  onChange={(e) => setNewInvoice({...newInvoice, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={createInvoice}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Invoice
              </button>
              <button 
                onClick={() => setShowCreateModal(false)}
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
