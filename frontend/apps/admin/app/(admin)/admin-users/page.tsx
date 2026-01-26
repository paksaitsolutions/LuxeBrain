'use client';

import { useEffect, useState } from 'react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('admin');
  const [newUser, setNewUser] = useState({ 
    email: '', password: '', full_name: '', role: 'support', 
    department: '', phone: '', permissions: [], avatar_url: '' 
  });
  const [filter, setFilter] = useState({ role: '', department: '' });

  useEffect(() => {
    loadUsers();
    loadRoles();
    loadInvitations();
  }, [filter]);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filter.role) params.append('role', filter.role);
      if (filter.department) params.append('department', filter.department);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/rbac/users?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

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

  const loadInvitations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/invitations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setInvitations(data.invitations || []);
    } catch (error) {
      console.error('Failed to load invitations:', error);
    }
  };

  const sendInvite = async () => {
    if (!inviteEmail) {
      alert('Please enter an email');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/invite`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      
      alert('Invitation sent successfully!');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('admin');
      loadInvitations();
    } catch (error: any) {
      console.error('Failed to send invite:', error);
      alert(error.message || 'Failed to send invitation');
    }
  };

  const createUser = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/rbac/users`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });
      setShowCreateModal(false);
      setNewUser({ email: '', password: '', full_name: '', role: 'support', department: '', phone: '', permissions: [], avatar_url: '' });
      loadUsers();
      alert('User created successfully!');
    } catch (error: any) {
      console.error('Failed to create user:', error);
      alert(error.message || 'Failed to create user');
    }
  };

  const updateUser = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/rbac/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: selectedUser.full_name,
          role: selectedUser.role,
          department: selectedUser.department,
          phone: selectedUser.phone,
          is_active: selectedUser.is_active
        })
      });
      setShowEditModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const viewProfile = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/rbac/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedUser(data);
      setShowProfileModal(true);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/rbac/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: any = {
      super_admin: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      support: 'bg-green-100 text-green-800',
      technical: 'bg-orange-100 text-orange-800',
      sales: 'bg-pink-100 text-pink-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-1">Manage team members and their access</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
          >
            Invite User
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + New User
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow flex gap-4">
        <select 
          value={filter.role}
          onChange={(e) => setFilter({...filter, role: e.target.value})}
          className="px-3 py-2 border rounded"
        >
          <option value="">All Roles</option>
          {roles.map(r => <option key={r.name} value={r.name}>{r.display_name}</option>)}
        </select>
        <select 
          value={filter.department}
          onChange={(e) => setFilter({...filter, department: e.target.value})}
          className="px-3 py-2 border rounded"
        >
          <option value="">All Departments</option>
          <option value="support">Support</option>
          <option value="technical">Technical</option>
          <option value="sales">Sales</option>
        </select>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Pending Invitations ({invitations.length})</h3>
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex justify-between items-center bg-white p-3 rounded">
                <div>
                  <div className="font-medium">{inv.email}</div>
                  <div className="text-sm text-gray-600">
                    Role: {inv.role} • Expires: {new Date(inv.expires_at).toLocaleDateString()}
                  </div>
                </div>
                <span className="text-xs text-yellow-600">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">
                      {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{user.full_name || 'N/A'}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs ${getRoleBadgeColor(user.role)}`}>
                    {user.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm capitalize">{user.department || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button onClick={() => viewProfile(user.id)} className="text-blue-600 hover:underline">View</button>
                  <button onClick={() => { setSelectedUser(user); setShowEditModal(true); }} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => deleteUser(user.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px]">
            <h2 className="text-xl font-bold mb-4">Invite Admin User</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="user@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-800">
                  An invitation email will be sent with a link that expires in 48 hours.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={sendInvite}
                disabled={!inviteEmail}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                Send Invitation
              </button>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                  setInviteRole('admin');
                }}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create New User</h2>
            
            <div className="space-y-4">
              {/* Personal Information */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={newUser.full_name}
                      onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Password *</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Role & Department */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-3">Role & Department</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Role *</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {roles.map(r => (
                        <option key={r.name} value={r.name}>{r.display_name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {roles.find(r => r.name === newUser.role)?.description}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Department</label>
                    <select
                      value={newUser.department}
                      onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Department</option>
                      <option value="support">Support</option>
                      <option value="technical">Technical</option>
                      <option value="sales">Sales</option>
                      <option value="marketing">Marketing</option>
                      <option value="operations">Operations</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Avatar URL */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-3">Profile Picture</h3>
                <div>
                  <label className="block text-sm font-medium mb-1">Avatar URL (Optional)</label>
                  <input
                    type="url"
                    value={newUser.avatar_url || ''}
                    onChange={(e) => setNewUser({...newUser, avatar_url: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to use default avatar</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewUser({ email: '', password: '', full_name: '', role: 'support', department: '', phone: '', permissions: [], avatar_url: '' });
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createUser}
                disabled={!newUser.email || !newUser.password || !newUser.full_name}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Edit User</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    value={selectedUser.full_name || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, full_name: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={selectedUser.phone || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    value={selectedUser.role}
                    onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  >
                    {roles.map(r => (
                      <option key={r.name} value={r.name}>{r.display_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <select
                    value={selectedUser.department || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, department: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="">Select Department</option>
                    <option value="support">Support</option>
                    <option value="technical">Technical</option>
                    <option value="sales">Sales</option>
                    <option value="marketing">Marketing</option>
                    <option value="operations">Operations</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedUser.is_active}
                      onChange={(e) => setSelectedUser({...selectedUser, is_active: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Active User</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowEditModal(false); setSelectedUser(null); }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={updateUser}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Profile Modal */}
      {showProfileModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">User Profile</h2>
            
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-white text-2xl font-bold">
                  {selectedUser.user?.full_name?.charAt(0) || selectedUser.user?.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedUser.user?.full_name || 'N/A'}</h3>
                  <p className="text-gray-600">{selectedUser.user?.email}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs ${getRoleBadgeColor(selectedUser.user?.role)}`}>
                      {selectedUser.user?.role.replace('_', ' ')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs ${selectedUser.user?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {selectedUser.user?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* User Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <p className="text-base capitalize">{selectedUser.user?.department || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-base">{selectedUser.user?.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Login</label>
                  <p className="text-base">{selectedUser.user?.last_login_at ? new Date(selectedUser.user.last_login_at).toLocaleString() : 'Never'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Login IP</label>
                  <p className="text-base">{selectedUser.user?.last_login_ip || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-base">{new Date(selectedUser.user?.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email Verified</label>
                  <p className="text-base">{selectedUser.user?.email_verified ? '✅ Yes' : '❌ No'}</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Recent Activity</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedUser.activities?.length > 0 ? (
                    selectedUser.activities.map((activity: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded border">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{activity.action.replace('_', ' ')}</p>
                            <p className="text-sm text-gray-600">{activity.resource_type} #{activity.resource_id}</p>
                          </div>
                          <span className="text-xs text-gray-500">{new Date(activity.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No activity recorded</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => { setShowProfileModal(false); setSelectedUser(null); }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
