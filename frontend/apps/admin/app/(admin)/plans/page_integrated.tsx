'use client';

import { useState, useEffect } from 'react';

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [newPlan, setNewPlan] = useState<any>({ name: '', price: 0, features: [''], active: true, adminOnly: false });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/plans`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingPlan)
      });
      setShowEditModal(false);
      loadPlans();
    } catch (error) {
      alert('Failed to update plan');
    }
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/plans`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPlan)
      });
      setShowCreateModal(false);
      setNewPlan({ name: '', price: 0, features: [''], active: true, adminOnly: false });
      loadPlans();
    } catch (error) {
      alert('Failed to create plan');
    }
  };

  const handleDelete = async (planId: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/plans/${planId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadPlans();
    } catch (error) {
      alert('Failed to delete plan');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pricing Plans</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan: any) => (
          <div key={plan.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="text-3xl font-bold mt-2">
                  {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  {plan.price > 0 && <span className="text-sm text-gray-500">/mo</span>}
                </div>
                {plan.adminOnly && <span className="text-xs text-orange-600 mt-1 block">Admin-only</span>}
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${plan.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {plan.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature: string, i: number) => (
                <li key={i} className="flex items-center text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button 
                onClick={() => { setEditingPlan({...plan}); setShowEditModal(true); }}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                Edit
              </button>
              <button 
                onClick={() => handleDelete(plan.id)}
                className="flex-1 px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modals omitted for brevity - same as before but call handleSave/handleCreate */}
    </div>
  );
}
