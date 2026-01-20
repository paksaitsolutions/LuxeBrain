'use client';

import { useEffect, useState } from 'react';

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    name: '', display_name: '', description: '', permissions: [] as string[]
  });

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const loadRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/rbac/roles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setRoles(data.roles || []);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const loadPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/rbac/permissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPermissions(data.permissions || []);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  };

  const saveRole = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = editingRole 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/rbac/roles/${editingRole.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/rbac/roles`;
      
      await fetch(url, {
        method: editingRole ? 'PUT' : 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      setShowModal(false);
      setEditingRole(null);
      setFormData({ name: '', display_name: '', description: '', permissions: [] });
      loadRoles();
    } catch (error) {
      console.error('Failed to save role:', error);
    }
  };

  const deleteRole = async (roleId: number) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/rbac/roles/${roleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadRoles();
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  };

  const togglePermission = (perm: string) => {
    if (formData.permissions.includes(perm)) {
      setFormData({...formData, permissions: formData.permissions.filter(p => p !== perm)});
    } else {
      setFormData({...formData, permissions: [...formData.permissions, perm]});
    }
  };

  const groupedPermissions = permissions.reduce((acc: any, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Roles & Permissions</h1>
          <p className="text-gray-600 mt-1">Manage access control roles</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + New Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold">{role.display_name}</h3>
                <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                {role.is_system && (
                  <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    System Role
                  </span>
                )}
              </div>
              {!role.is_system && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setEditingRole(role);
                      setFormData({
                        name: role.name,
                        display_name: role.display_name,
                        description: role.description,
                        permissions: role.permissions
                      });
                      setShowModal(true);
                    }}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => deleteRole(role.id)}
                    className="px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Permissions:</div>
              <div className="flex flex-wrap gap-1">
                {role.permissions.map((perm: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[700px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingRole ? 'Edit' : 'Create'} Role</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Role Name (ID)</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="e.g., custom_role"
                  disabled={!!editingRole}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Display Name</label>
                <input 
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="e.g., Custom Role"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Permissions</label>
                <div className="space-y-3 max-h-96 overflow-y-auto border rounded p-3">
                  {Object.entries(groupedPermissions).map(([category, perms]: any) => (
                    <div key={category}>
                      <div className="font-medium text-sm capitalize mb-2">{category}</div>
                      <div className="grid grid-cols-2 gap-2 ml-4">
                        {perms.map((perm: any) => (
                          <label key={perm.name} className="flex items-center text-sm">
                            <input 
                              type="checkbox"
                              checked={formData.permissions.includes(perm.name)}
                              onChange={() => togglePermission(perm.name)}
                              className="mr-2"
                            />
                            {perm.action}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={saveRole}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Role
              </button>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setEditingRole(null);
                  setFormData({ name: '', display_name: '', description: '', permissions: [] });
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
