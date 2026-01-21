'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@luxebrain/ui';
import { toast } from 'react-hot-toast';

export default function PlanFeaturesPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/plans/features`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Failed to load plans:', error);
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: any) => {
    setEditingPlan({
      ...plan,
      limits: plan.limits || { 
        api_calls: 0, storage_gb: 0, users: 0, ml_inferences: 0,
        overage_api_calls: 0, overage_storage: 0, overage_users: 0, overage_ml: 0
      }
    });
    setShowEditModal(true);
  };

  const saveLimits = async () => {
    if (!editingPlan) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/plans/${editingPlan.id}/limits`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingPlan.limits)
      });
      
      toast.success('Plan limits updated');
      setShowEditModal(false);
      loadPlans();
    } catch (error) {
      console.error('Failed to update limits:', error);
      toast.error('Failed to update limits');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center p-12">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Plan Features Matrix</h1>
        <p className="text-gray-600 mt-1">Compare features and limits across all plans</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 w-48">Feature</th>
              {plans.map((plan) => (
                <th key={plan.id} className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                  <div>{plan.name}</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1">
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </div>
                  <div className="text-xs text-gray-500">/{plan.billing_period}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 font-medium text-gray-900">API Calls / Month</td>
              {plans.map((plan) => (
                <td key={plan.id} className="px-6 py-4 text-center">
                  <span className="text-lg font-semibold">
                    {plan.limits?.api_calls === 0 ? 'Unlimited' : (plan.limits?.api_calls || 0).toLocaleString()}
                  </span>
                </td>
              ))}
            </tr>
            <tr className="bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900">Storage</td>
              {plans.map((plan) => (
                <td key={plan.id} className="px-6 py-4 text-center">
                  <span className="text-lg font-semibold">
                    {plan.limits?.storage_gb === 0 ? 'Unlimited' : `${plan.limits?.storage_gb || 0} GB`}
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-6 py-4 font-medium text-gray-900">Team Members</td>
              {plans.map((plan) => (
                <td key={plan.id} className="px-6 py-4 text-center">
                  <span className="text-lg font-semibold">
                    {plan.limits?.users === 0 ? 'Unlimited' : (plan.limits?.users || 0)}
                  </span>
                </td>
              ))}
            </tr>
            <tr className="bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900">ML Inferences / Month</td>
              {plans.map((plan) => (
                <td key={plan.id} className="px-6 py-4 text-center">
                  <span className="text-lg font-semibold">
                    {plan.limits?.ml_inferences === 0 ? 'Unlimited' : (plan.limits?.ml_inferences || 0).toLocaleString()}
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-6 py-4 font-medium text-gray-900">Actions</td>
              {plans.map((plan) => (
                <td key={plan.id} className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Edit Limits
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {showEditModal && editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Limits - {editingPlan.name}</h2>
            
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-3">Usage Limits</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">API Calls / Month</label>
                    <input
                      type="number"
                      value={editingPlan.limits.api_calls}
                      onChange={(e) => setEditingPlan({
                        ...editingPlan,
                        limits: { ...editingPlan.limits, api_calls: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 border rounded"
                    />
                    <p className="text-xs text-gray-500 mt-1">0 = Unlimited</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Storage (GB)</label>
                    <input
                      type="number"
                      value={editingPlan.limits.storage_gb}
                      onChange={(e) => setEditingPlan({
                        ...editingPlan,
                        limits: { ...editingPlan.limits, storage_gb: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 border rounded"
                    />
                    <p className="text-xs text-gray-500 mt-1">0 = Unlimited</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Team Members</label>
                    <input
                      type="number"
                      value={editingPlan.limits.users}
                      onChange={(e) => setEditingPlan({
                        ...editingPlan,
                        limits: { ...editingPlan.limits, users: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 border rounded"
                    />
                    <p className="text-xs text-gray-500 mt-1">0 = Unlimited</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">ML Inferences / Month</label>
                    <input
                      type="number"
                      value={editingPlan.limits.ml_inferences}
                      onChange={(e) => setEditingPlan({
                        ...editingPlan,
                        limits: { ...editingPlan.limits, ml_inferences: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 border rounded"
                    />
                    <p className="text-xs text-gray-500 mt-1">0 = Unlimited</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Overage Pricing (per unit)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">API Calls (per 1000)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingPlan.limits.overage_api_calls || 0}
                      onChange={(e) => setEditingPlan({
                        ...editingPlan,
                        limits: { ...editingPlan.limits, overage_api_calls: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 border rounded"
                    />
                    <p className="text-xs text-gray-500 mt-1">$ per 1000 calls</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Storage (per GB)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingPlan.limits.overage_storage || 0}
                      onChange={(e) => setEditingPlan({
                        ...editingPlan,
                        limits: { ...editingPlan.limits, overage_storage: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 border rounded"
                    />
                    <p className="text-xs text-gray-500 mt-1">$ per GB</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Users (per user)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingPlan.limits.overage_users || 0}
                      onChange={(e) => setEditingPlan({
                        ...editingPlan,
                        limits: { ...editingPlan.limits, overage_users: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 border rounded"
                    />
                    <p className="text-xs text-gray-500 mt-1">$ per user</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">ML Inferences (per 1000)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingPlan.limits.overage_ml || 0}
                      onChange={(e) => setEditingPlan({
                        ...editingPlan,
                        limits: { ...editingPlan.limits, overage_ml: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 border rounded"
                    />
                    <p className="text-xs text-gray-500 mt-1">$ per 1000 inferences</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={saveLimits}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
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
