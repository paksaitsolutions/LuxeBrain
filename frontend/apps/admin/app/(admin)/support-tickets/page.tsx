'use client';

import { useEffect, useState } from 'react';

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ tenant_id: '', subject: '', description: '', priority: 'medium' });

  useEffect(() => {
    loadTickets();
  }, [filter]);

  const loadTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = filter 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/support/tickets?status=${filter}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/support/tickets`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  };

  const createTicket = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/support/tickets`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTicket)
      });
      setShowCreateModal(false);
      setNewTicket({ tenant_id: '', subject: '', description: '', priority: 'medium' });
      loadTickets();
    } catch (error) {
      console.error('Failed to create ticket:', error);
    }
  };

  const updateStatus = async (ticketId: number, status: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/support/tickets/${ticketId}?status=${status}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadTickets();
    } catch (error) {
      console.error('Failed to update ticket:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Support Tickets</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + New Ticket
        </button>
      </div>

      <div className="flex gap-2">
        {['', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded ${filter === status ? 'bg-blue-600 text-white' : 'bg-white border'}`}
          >
            {status || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{ticket.ticket_number}</td>
                <td className="px-6 py-4 text-sm">{ticket.subject}</td>
                <td className="px-6 py-4 text-sm">{ticket.tenant_id}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {ticket.priority}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(ticket.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm">
                  <select 
                    value={ticket.status}
                    onChange={(e) => updateStatus(ticket.id, e.target.value)}
                    className="px-2 py-1 border rounded text-xs"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px]">
            <h2 className="text-xl font-bold mb-4">Create Support Ticket</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tenant ID</label>
                <input 
                  type="text"
                  value={newTicket.tenant_id}
                  onChange={(e) => setNewTicket({...newTicket, tenant_id: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input 
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select 
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={createTicket}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Ticket
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
