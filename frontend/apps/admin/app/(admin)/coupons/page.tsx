'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@luxebrain/ui';
import { toast } from 'react-hot-toast';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ 
    code: '', 
    discount: 0, 
    type: 'percent', 
    limit: '', 
    expires: '',
    first_time_only: false,
    plan_specific: [] as string[],
    min_amount: '',
    is_stackable: false,
    auto_apply: false
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/coupons`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error('Failed to load coupons:', error);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const createCoupon = async () => {
    if (!newCoupon.code || !newCoupon.discount) {
      toast.error('Code and discount are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/coupons`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: newCoupon.code,
          discount: Number(newCoupon.discount),
          type: newCoupon.type,
          limit: newCoupon.limit ? Number(newCoupon.limit) : null,
          expires: newCoupon.expires || null,
          restrictions: {
            first_time_only: newCoupon.first_time_only,
            plan_specific: newCoupon.plan_specific,
            min_amount: newCoupon.min_amount ? Number(newCoupon.min_amount) : null
          },
          is_stackable: newCoupon.is_stackable,
          auto_apply: newCoupon.auto_apply
        })
      });
      setShowCreateModal(false);
      setNewCoupon({ 
        code: '', 
        discount: 0, 
        type: 'percent', 
        limit: '', 
        expires: '',
        first_time_only: false,
        plan_specific: [],
        min_amount: '',
        is_stackable: false,
        auto_apply: false
      });
      loadCoupons();
      toast.success('Coupon created successfully!');
    } catch (error) {
      console.error('Failed to create coupon:', error);
      toast.error('Failed to create coupon');
    }
  };

  const deleteCoupon = async (couponId: number) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/coupons/${couponId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadCoupons();
      toast.success('Coupon deleted successfully!');
    } catch (error) {
      console.error('Failed to delete coupon:', error);
      toast.error('Failed to delete coupon');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center p-12">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Discount Coupons</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + New Coupon
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {coupons.map(coupon => (
              <tr key={coupon.id}>
                <td className="px-6 py-4 font-mono font-bold">{coupon.code}</td>
                <td className="px-6 py-4">
                  {coupon.type === 'percent' ? `${coupon.discount}%` : `$${coupon.discount}`}
                </td>
                <td className="px-6 py-4">
                  {coupon.uses || 0} {coupon.limit && `/ ${coupon.limit}`}
                </td>
                <td className="px-6 py-4">{coupon.expires || 'Never'}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${coupon.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {coupon.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:underline mr-3">Edit</button>
                  <button 
                    onClick={() => deleteCoupon(coupon.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Coupon Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Coupon</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Coupon Code *</label>
                <input 
                  type="text"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="SAVE20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Discount *</label>
                <input 
                  type="number"
                  value={newCoupon.discount}
                  onChange={(e) => setNewCoupon({...newCoupon, discount: Number(e.target.value)})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type *</label>
                <select 
                  value={newCoupon.type}
                  onChange={(e) => setNewCoupon({...newCoupon, type: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Usage Limit (optional)</label>
                <input 
                  type="number"
                  value={newCoupon.limit}
                  onChange={(e) => setNewCoupon({...newCoupon, limit: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expiry Date (optional)</label>
                <input 
                  type="date"
                  value={newCoupon.expires}
                  onChange={(e) => setNewCoupon({...newCoupon, expires: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Restrictions</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input 
                      type="checkbox"
                      checked={newCoupon.first_time_only}
                      onChange={(e) => setNewCoupon({...newCoupon, first_time_only: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm">First-time customers only</span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium mb-1">Plan-specific (optional)</label>
                    <select 
                      multiple
                      value={newCoupon.plan_specific}
                      onChange={(e) => setNewCoupon({...newCoupon, plan_specific: Array.from(e.target.selectedOptions, o => o.value)})}
                      className="w-full px-3 py-2 border rounded"
                      size={3}
                    >
                      <option value="starter">Starter</option>
                      <option value="growth">Growth</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Minimum amount ($)</label>
                    <input 
                      type="number"
                      value={newCoupon.min_amount}
                      onChange={(e) => setNewCoupon({...newCoupon, min_amount: e.target.value})}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="50"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Options</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input 
                      type="checkbox"
                      checked={newCoupon.is_stackable}
                      onChange={(e) => setNewCoupon({...newCoupon, is_stackable: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm">Stackable with other coupons</span>
                  </label>

                  <label className="flex items-center">
                    <input 
                      type="checkbox"
                      checked={newCoupon.auto_apply}
                      onChange={(e) => setNewCoupon({...newCoupon, auto_apply: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm">Auto-apply at checkout</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={createCoupon}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Coupon
              </button>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCoupon({ 
                    code: '', 
                    discount: 0, 
                    type: 'percent', 
                    limit: '', 
                    expires: '',
                    first_time_only: false,
                    plan_specific: [],
                    min_amount: '',
                    is_stackable: false,
                    auto_apply: false
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
