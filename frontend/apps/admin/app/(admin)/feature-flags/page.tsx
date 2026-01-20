'use client';

import { useEffect, useState } from 'react';

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingFlag, setEditingFlag] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '', enabled: false, rollout_percentage: 0, tenant_whitelist: [] });

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/feature-flags`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setFlags(data.flags || []);
    } catch (error) {
      console.error('Failed to load flags:', error);
    }
  };

  const saveFlag = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = editingFlag 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/feature-flags/${editingFlag.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/feature-flags`;
      
      await fetch(url, {
        method: editingFlag ? 'PUT' : 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      setShowModal(false);
      setEditingFlag(null);
      setFormData({ name: '', description: '', enabled: false, rollout_percentage: 0, tenant_whitelist: [] });
      loadFlags();
    } catch (error) {
      console.error('Failed to save flag:', error);
    }
  };

  const editFlag = (flag: any) => {
    setEditingFlag(flag);
    setFormData({
      name: flag.name,
      description: flag.description,
      enabled: flag.enabled,
      rollout_percentage: flag.rollout_percentage,
      tenant_whitelist: flag.tenant_whitelist
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Feature Flags</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + New Feature Flag
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {flags.map((flag) => (
          <div key={flag.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold">{flag.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs ${flag.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {flag.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{flag.description}</p>
                <div className="flex gap-4 mt-3 text-sm">
                  <div>Rollout: <span className="font-medium">{flag.rollout_percentage}%</span></div>
                  <div>Whitelisted Tenants: <span className="font-medium">{flag.tenant_whitelist.length}</span></div>
                </div>
              </div>
              <button 
                onClick={() => editFlag(flag)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px]">
            <h2 className="text-xl font-bold mb-4">{editingFlag ? 'Edit' : 'Create'} Feature Flag</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({...formData, enabled: e.target.checked})}
                  className="mr-2"
                />
                <label className="text-sm">Enabled</label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rollout Percentage</label>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={formData.rollout_percentage}
                  onChange={(e) => setFormData({...formData, rollout_percentage: Number(e.target.value)})}
                  className="w-full"
                />
                <div className="text-sm text-gray-600 mt-1">{formData.rollout_percentage}%</div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={saveFlag}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setEditingFlag(null);
                  setFormData({ name: '', description: '', enabled: false, rollout_percentage: 0, tenant_whitelist: [] });
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
