'use client';

import { useEffect, useState } from 'react';

export default function FailedPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFailedPayments();
  }, []);

  const loadFailedPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/billing/failed-payments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPayments(data.failed_payments || []);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const retryPayment = async (paymentId: number) => {
    if (!confirm('Retry this payment?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/billing/failed-payments/${paymentId}/retry`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('Payment retry initiated');
      loadFailedPayments();
    } catch (error) {
      alert('Failed to retry payment');
    }
  };

  const contactCustomer = async (paymentId: number) => {
    if (!confirm('Send dunning email to customer?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/billing/failed-payments/${paymentId}/contact`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('Dunning email sent');
    } catch (error) {
      alert('Failed to send email');
    }
  };

  const suspendAccount = async (paymentId: number) => {
    if (!confirm('Suspend this account? This will block their access.')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/billing/failed-payments/${paymentId}/suspend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('Account suspended');
      loadFailedPayments();
    } catch (error) {
      alert('Failed to suspend account');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Failed Payments</h1>
          <p className="text-gray-600 mt-1">Manage failed payments and dunning process</p>
        </div>
        <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg font-medium">
          {payments.length} Failed Payment{payments.length !== 1 ? 's' : ''}
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">No Failed Payments</h2>
          <p className="text-gray-600">All payments are processing successfully</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Failed Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retry Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{payment.tenant_name}</div>
                    <div className="text-sm text-gray-500">{payment.tenant_id}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">{payment.tenant_email}</td>
                  <td className="px-6 py-4 font-medium">${payment.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm capitalize">{payment.plan}</td>
                  <td className="px-6 py-4 text-sm">{new Date(payment.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                      {payment.retry_count} retries
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => retryPayment(payment.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Retry
                      </button>
                      <button
                        onClick={() => contactCustomer(payment.id)}
                        className="px-3 py-1 border border-blue-600 text-blue-600 rounded text-sm hover:bg-blue-50"
                      >
                        Contact
                      </button>
                      <button
                        onClick={() => suspendAccount(payment.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Suspend
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dunning Process Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-lg mb-2">Automated Dunning Process</h3>
        <p className="text-sm text-gray-700 mb-3">
          Failed payments trigger an automated 3-attempt dunning sequence over 7 days:
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
            <span>Day 0: Immediate email notification</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">2</span>
            <span>Day 3: Reminder email with payment link</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">3</span>
            <span>Day 7: Final notice before suspension</span>
          </li>
        </ul>
        <p className="text-xs text-gray-600 mt-3">
          Note: Automated dunning emails are sent via background jobs. Use "Contact" button for manual emails.
        </p>
      </div>
    </div>
  );
}
