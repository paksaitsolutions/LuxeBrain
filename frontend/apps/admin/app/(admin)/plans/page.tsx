'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@luxebrain/ui';
import { toast } from 'react-hot-toast';

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
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
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: any) => {
    setEditingPlan({...plan});
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!editingPlan.name || editingPlan.price < 0) {
      toast.error('Plan name is required and price must be positive');
      return;
    }

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
      setEditingPlan(null);
      loadPlans();
      toast.success('Plan updated successfully!');
    } catch (error) {
      console.error('Failed to update plan:', error);
      toast.error('Failed to update plan');
    }
  };

  const handleCreate = async () => {
    if (!newPlan.name || newPlan.price < 0) {
      toast.error('Plan name is required and price must be positive');
      return;
    }

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
      toast.success('Plan created successfully!');
    } catch (error) {
      console.error('Failed to create plan:', error);
      toast.error('Failed to create plan');
    }
  };

  const addFeatureNew = () => {
    setNewPlan({...newPlan, features: [...newPlan.features, '']});
  };

  const updateFeatureNew = (index: number, value: string) => {
    const newFeatures = [...newPlan.features];
    newFeatures[index] = value;
    setNewPlan({...newPlan, features: newFeatures});
  };

  const removeFeatureNew = (index: number) => {
    setNewPlan({...newPlan, features: newPlan.features.filter((_: any, i: number) => i !== index)});
  };

  const handleDelete = async (planId: number) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/plans/${planId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadPlans();
      toast.success('Plan deleted successfully!');
    } catch (error) {
      console.error('Failed to delete plan:', error);
      toast.error('Failed to delete plan');
    }
  };

  const addFeature = () => {
    setEditingPlan({...editingPlan, features: [...editingPlan.features, '']});
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...editingPlan.features];
    newFeatures[index] = value;
    setEditingPlan({...editingPlan, features: newFeatures});
  };

  const removeFeature = (index: number) => {
    setEditingPlan({...editingPlan, features: editingPlan.features.filter((_: any, i: number) => i !== index)});
  };

  if (loading) return (
    <div className="flex justify-center items-center p-12">
      <Spinner size="lg" />
    </div>
  );

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
        {plans.map(plan => (
          <div key={plan.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="text-3xl font-bold mt-2">
                  {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  {plan.price > 0 && <span className="text-sm text-gray-500">/mo</span>}
                </div>
                {plan.adminOnly && <span className="text-xs text-orange-600 mt-1 block">Admin-only assignment</span>}
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${plan.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {plan.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center text-sm">
                  <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button 
                onClick={() => handleEdit(plan)}
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

      {/* Edit Modal */}
      {showEditModal && editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Plan</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Plan Name</label>
                <input 
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price ($/month)</label>
                <input 
                  type="number"
                  value={editingPlan.price}
                  onChange={(e) => setEditingPlan({...editingPlan, price: Number(e.target.value)})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select 
                  value={editingPlan.active ? 'active' : 'inactive'}
                  onChange={(e) => setEditingPlan({...editingPlan, active: e.target.value === 'active'})}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox"
                  checked={editingPlan.adminOnly}
                  onChange={(e) => setEditingPlan({...editingPlan, adminOnly: e.target.checked})}
                  className="mr-2"
                />
                <label className="text-sm">Admin-only assignment (not visible to customers)</label>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Features</label>
                  <button 
                    onClick={addFeature}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    + Add Feature
                  </button>
                </div>
                <div className="space-y-2">
                  {editingPlan.features.map((feature: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <input 
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        className="flex-1 px-3 py-2 border rounded"
                        placeholder="Feature description"
                      />
                      <button 
                        onClick={() => removeFeature(index)}
                        className="px-3 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={handleSave}
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Plan</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Plan Name</label>
                <input 
                  type="text"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="e.g. Professional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price ($/month)</label>
                <input 
                  type="number"
                  value={newPlan.price}
                  onChange={(e) => setNewPlan({...newPlan, price: Number(e.target.value)})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="0 for free plan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select 
                  value={newPlan.active ? 'active' : 'inactive'}
                  onChange={(e) => setNewPlan({...newPlan, active: e.target.value === 'active'})}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox"
                  checked={newPlan.adminOnly}
                  onChange={(e) => setNewPlan({...newPlan, adminOnly: e.target.checked})}
                  className="mr-2"
                />
                <label className="text-sm">Admin-only assignment (not visible to customers)</label>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Features</label>
                  <button 
                    onClick={addFeatureNew}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    + Add Feature
                  </button>
                </div>
                <div className="space-y-2">
                  {newPlan.features.map((feature: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <input 
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeatureNew(index, e.target.value)}
                        className="flex-1 px-3 py-2 border rounded"
                        placeholder="Feature description"
                      />
                      <button 
                        onClick={() => removeFeatureNew(index)}
                        className="px-3 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={handleCreate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Plan
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
