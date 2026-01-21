'use client';

import { useEffect, useState } from 'react';

export default function BillingManagementPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [creditData, setCreditData] = useState({ tenant_id: '', amount: 0, reason: '' });
  const [refundData, setRefundData] = useState({ invoice_id: 0, amount: 0, reason: '' });
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

  const loadInvoiceDetail = async (invoiceId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/billing/invoices/${invoiceId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedInvoice(data.invoice);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Failed to load invoice:', error);
    }
  };

  const invoiceAction = async (action: string, amount?: number) => {
    if (!selectedInvoice) return;
    if (!confirm(`Are you sure you want to ${action} this invoice?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/billing/invoices/${selectedInvoice.id}/action`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, amount })
      });
      setShowDetailModal(false);
      loadInvoices();
      alert(`Invoice ${action} successfully`);
    } catch (error) {
      console.error('Failed to perform action:', error);
      alert('Failed to perform action');
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

  const issueCredit = async () => {
    if (!creditData.tenant_id || !creditData.amount || !creditData.reason) {
      alert('All fields required');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/billing/credits?tenant_id=${creditData.tenant_id}&amount=${creditData.amount}&reason=${encodeURIComponent(creditData.reason)}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setShowCreditModal(false);
      setCreditData({ tenant_id: '', amount: 0, reason: '' });
      alert('Credit issued successfully');
    } catch (error) {
      alert('Failed to issue credit');
    }
  };

  const processRefund = async () => {
    if (!refundData.invoice_id || !refundData.amount || !refundData.reason) {
      alert('All fields required');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/billing/refunds?invoice_id=${refundData.invoice_id}&amount=${refundData.amount}&reason=${encodeURIComponent(refundData.reason)}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setShowRefundModal(false);
      setRefundData({ invoice_id: 0, amount: 0, reason: '' });
      loadInvoices();
      alert('Refund processed successfully');
    } catch (error) {
      alert('Failed to process refund');
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
        <button 
          onClick={() => setShowCreditModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Issue Credit
        </button>
        <button 
          onClick={() => setShowRefundModal(true)}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          Process Refund
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                <td className="px-6 py-4">
                  <button
                    onClick={() => loadInvoiceDetail(inv.id)}
                    className="text-blue-600 hover:underline"
                  >
                    View Details
                  </button>
                </td>
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

      {/* Invoice Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl my-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">Invoice Details</h2>
                <p className="text-gray-600">{selectedInvoice.invoice_number}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="border-b pb-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Bill To</div>
                  <div className="font-medium">{selectedInvoice.tenant_name}</div>
                  <div className="text-sm text-gray-600">{selectedInvoice.tenant_email}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Date</div>
                  <div className="font-medium">{new Date(selectedInvoice.created_at).toLocaleDateString()}</div>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${
                    selectedInvoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                    selectedInvoice.status === 'refunded' ? 'bg-purple-100 text-purple-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>{selectedInvoice.status.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold mb-3">Line Items</h3>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm">Description</th>
                    <th className="px-4 py-2 text-right text-sm">Qty</th>
                    <th className="px-4 py-2 text-right text-sm">Price</th>
                    <th className="px-4 py-2 text-right text-sm">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.line_items.map((item: any, idx: number) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-3">{item.description}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">${item.unit_price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-medium">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t pt-4 mb-6">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between"><span>Subtotal:</span><span>${selectedInvoice.subtotal.toFixed(2)}</span></div>
                  {selectedInvoice.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount:</span><span>-${selectedInvoice.discount.toFixed(2)}</span></div>}
                  {selectedInvoice.tax_amount > 0 && <div className="flex justify-between"><span>Tax:</span><span>${selectedInvoice.tax_amount.toFixed(2)}</span></div>}
                  <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total:</span><span>${selectedInvoice.total.toFixed(2)}</span></div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded p-4 mb-6 text-sm">
              <span className="text-gray-600">Payment Method:</span>
              <span className="ml-2 font-medium">{selectedInvoice.payment_method}</span>
            </div>

            <div className="flex gap-3">
              <button onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/billing/invoices/${selectedInvoice.id}/pdf`, '_blank')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Download PDF</button>
              <button onClick={async () => {
                if (!confirm('Send invoice email to tenant?')) return;
                try {
                  const token = localStorage.getItem('token');
                  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/billing/invoices/${selectedInvoice.id}/send`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  alert('Invoice email sent successfully!');
                } catch (error) {
                  alert('Failed to send email');
                }
              }} className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50">Send Email</button>
              {selectedInvoice.status === 'pending' && <button onClick={() => invoiceAction('mark_paid')} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Mark as Paid</button>}
              {selectedInvoice.status === 'paid' && <button onClick={() => invoiceAction('refund', selectedInvoice.total)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Issue Refund</button>}
              <button onClick={() => setShowDetailModal(false)} className="ml-auto px-4 py-2 border rounded hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Issue Credit</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tenant ID</label>
                <input type="text" value={creditData.tenant_id} onChange={(e) => setCreditData({...creditData, tenant_id: e.target.value})} className="w-full px-3 py-2 border rounded" placeholder="tenant_xxxxx" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount ($)</label>
                <input type="number" value={creditData.amount} onChange={(e) => setCreditData({...creditData, amount: Number(e.target.value)})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <textarea value={creditData.reason} onChange={(e) => setCreditData({...creditData, reason: e.target.value})} className="w-full px-3 py-2 border rounded" rows={3} placeholder="Reason for credit..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={issueCredit} className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Issue Credit</button>
              <button onClick={() => setShowCreditModal(false)} className="flex-1 px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Process Refund</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Invoice ID</label>
                <input type="number" value={refundData.invoice_id} onChange={(e) => setRefundData({...refundData, invoice_id: Number(e.target.value)})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Refund Amount ($)</label>
                <input type="number" value={refundData.amount} onChange={(e) => setRefundData({...refundData, amount: Number(e.target.value)})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <textarea value={refundData.reason} onChange={(e) => setRefundData({...refundData, reason: e.target.value})} className="w-full px-3 py-2 border rounded" rows={3} placeholder="Reason for refund..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={processRefund} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">Process Refund</button>
              <button onClick={() => setShowRefundModal(false)} className="flex-1 px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
