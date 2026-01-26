'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@luxebrain/ui';
import { toast } from 'react-hot-toast';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState<any[]>([]);
  const [newKey, setNewKey] = useState({
    name: '',
    tenant_id: '',
    permissions: [] as string[],
    expires_at: ''
  });
  const [createdKey, setCreatedKey] = useState('');

  useEffect(() => {
    loadKeys();
    loadPermissions();
  }, []);

  const loadKeys = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/api-keys`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setKeys(data.keys || []);
    } catch (error) {
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/api-keys/permissions/available`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAvailablePermissions(data.permissions || []);
    } catch (error) {
      console.error('Failed to load permissions');
    }
  };

  const createKey = async () => {
    if (!newKey.name || !newKey.tenant_id) {
      toast.error('Name and tenant ID are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/api-keys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newKey)
      });
      const data = await res.json();
      setCreatedKey(data.key);
      loadKeys();
      toast.success('API key created!');
    } catch (error) {
      toast.error('Failed to create API key');
    }
  };

  const revokeKey = async (keyId: number) => {
    if (!confirm('Revoke this API key?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadKeys();
      toast.success('API key revoked');
    } catch (error) {
      toast.error('Failed to revoke key');
    }
  };

  const togglePermission = (perm: string) => {
    setNewKey(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }));
  };

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">API Keys</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + New API Key
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permissions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Used</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {keys.map(key => (
              <tr key={key.id}>
                <td className="px-6 py-4">{key.name}</td>
                <td className="px-6 py-4 font-mono text-sm">{key.key}</td>
                <td className="px-6 py-4">{key.tenant_id}</td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{key.permissions?.length || 0} permissions</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${key.revoked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {key.revoked ? 'Revoked' : 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {!key.revoked && (
                    <>
                      <a
                        href={`/admin/api-keys/${key.id}`}
                        className="text-blue-600 hover:underline mr-3"
                      >
                        Analytics
                      </a>
                      <button
                        onClick={() => revokeKey(key.id)}
                        className="text-red-600 hover:underline"
                      >
                        Revoke
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create API Key</h2>
            
            {createdKey ? (
              <div>
                <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
                  <p className="text-sm text-green-800 mb-2">API Key created successfully! Copy it now:</p>
                  <code className="block bg-white p-3 rounded border text-sm break-all">{createdKey}</code>
                  <p className="text-xs text-green-700 mt-2">⚠️ Save this key - it won't be shown again!</p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreatedKey('');
                    setNewKey({ name: '', tenant_id: '', permissions: [], expires_at: '' });
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    value={newKey.name}
                    onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="Production API Key"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tenant ID *</label>
                  <input
                    type="text"
                    value={newKey.tenant_id}
                    onChange={(e) => setNewKey({ ...newKey, tenant_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="tenant_123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Permissions</label>
                  <div className="border rounded p-3 max-h-60 overflow-y-auto space-y-2">
                    {availablePermissions.map(perm => (
                      <label key={perm.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newKey.permissions.includes(perm.value)}
                          onChange={() => togglePermission(perm.value)}
                          className="mr-2"
                        />
                        <span className="text-sm">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Expires At (optional)</label>
                  <input
                    type="date"
                    value={newKey.expires_at}
                    onChange={(e) => setNewKey({ ...newKey, expires_at: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={createKey}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Create Key
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewKey({ name: '', tenant_id: '', permissions: [], expires_at: '' });
                    }}
                    className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
