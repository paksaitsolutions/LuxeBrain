'use client';

import { useEffect, useState } from 'react';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKey, setNewKey] = useState({ name: '', tenant_id: '', scopes: ['read'], expires_days: 365 });
  const [createdKey, setCreatedKey] = useState('');

  useEffect(() => {
    loadKeys();
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
      console.error('Failed to load keys:', error);
    }
  };

  const createKey = async () => {
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
      setNewKey({ name: '', tenant_id: '', scopes: ['read'], expires_days: 365 });
      loadKeys();
    } catch (error) {
      console.error('Failed to create key:', error);
    }
  };

  const revokeKey = async (keyId: number) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadKeys();
    } catch (error) {
      console.error('Failed to revoke key:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">API Keys</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Generate API Key
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scopes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Used</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {keys.map((key) => (
              <tr key={key.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{key.name}</td>
                <td className="px-6 py-4 text-sm font-mono text-gray-600">{key.key}</td>
                <td className="px-6 py-4 text-sm">{key.tenant_id}</td>
                <td className="px-6 py-4 text-sm">
                  {key.scopes.map((scope: string) => (
                    <span key={scope} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs mr-1">
                      {scope}
                    </span>
                  ))}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {key.expires_at ? new Date(key.expires_at).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4 text-sm">
                  <button 
                    onClick={() => revokeKey(key.id)}
                    className="text-red-600 hover:underline"
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px]">
            <h2 className="text-xl font-bold mb-4">Generate API Key</h2>
            
            {createdKey ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <div className="text-sm text-green-800 font-medium mb-2">API Key Created Successfully!</div>
                  <div className="text-xs text-green-700 mb-3">Copy this key now. You won't be able to see it again.</div>
                  <div className="bg-white p-3 rounded border font-mono text-sm break-all">{createdKey}</div>
                </div>
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreatedKey('');
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Key Name</label>
                    <input 
                      type="text"
                      value={newKey.name}
                      onChange={(e) => setNewKey({...newKey, name: e.target.value})}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="Production API Key"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tenant ID</label>
                    <input 
                      type="text"
                      value={newKey.tenant_id}
                      onChange={(e) => setNewKey({...newKey, tenant_id: e.target.value})}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Scopes</label>
                    <div className="space-y-2">
                      {['read', 'write', 'admin'].map((scope) => (
                        <label key={scope} className="flex items-center">
                          <input 
                            type="checkbox"
                            checked={newKey.scopes.includes(scope)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewKey({...newKey, scopes: [...newKey.scopes, scope]});
                              } else {
                                setNewKey({...newKey, scopes: newKey.scopes.filter(s => s !== scope)});
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm capitalize">{scope}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Expires In (Days)</label>
                    <input 
                      type="number"
                      value={newKey.expires_days}
                      onChange={(e) => setNewKey({...newKey, expires_days: Number(e.target.value)})}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={createKey}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Generate Key
                  </button>
                  <button 
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
