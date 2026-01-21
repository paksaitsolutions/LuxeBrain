'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Spinner } from '@luxebrain/ui';
import { toast } from 'react-hot-toast';

const CANNED_RESPONSES = [
  { label: 'Thank you', text: 'Thank you for contacting us. We are looking into your issue and will get back to you shortly.' },
  { label: 'Resolved', text: 'This issue has been resolved. Please let us know if you need any further assistance.' },
  { label: 'More info', text: 'Could you please provide more information about this issue? This will help us assist you better.' },
  { label: 'Investigating', text: 'We are currently investigating this issue. We will update you as soon as we have more information.' },
];

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id;
  
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [sending, setSending] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    loadTicketDetail();
    loadAdmins();
  }, [ticketId]);

  const loadTicketDetail = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/support/tickets/${ticketId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTicket(data.ticket);
      setMessages(data.messages || []);
      setAttachments(data.attachments || []);
      setStatusHistory(data.status_history || []);
    } catch (error) {
      console.error('Failed to load ticket:', error);
      toast.error('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: replyMessage,
          is_internal: isInternal,
          send_email: sendEmail
        })
      });
      
      toast.success('Reply sent successfully');
      setReplyMessage('');
      setIsInternal(false);
      setSendEmail(true);
      loadTicketDetail();
    } catch (error) {
      console.error('Failed to send reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const loadAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/support/tickets/admins`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAdmins(data.admins || []);
    } catch (error) {
      console.error('Failed to load admins:', error);
    }
  };

  const assignTicket = async () => {
    if (!selectedAssignee) {
      toast.error('Please select an assignee');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/support/tickets/${ticketId}/assign?assignee_id=${selectedAssignee}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      toast.success('Ticket assigned successfully');
      loadTicketDetail();
    } catch (error) {
      console.error('Failed to assign ticket:', error);
      toast.error('Failed to assign ticket');
    }
  };

  const updateStatus = async () => {
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/support/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: selectedStatus })
      });
      
      toast.success('Status updated successfully');
      setSelectedStatus('');
      loadTicketDetail();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center p-12">
      <Spinner size="lg" />
    </div>
  );

  if (!ticket) return (
    <div className="p-6">
      <p>Ticket not found</p>
    </div>
  );

  const priorityColor = {
    urgent: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-800'
  }[ticket.priority] || 'bg-gray-100 text-gray-800';

  const statusColor = {
    open: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800'
  }[ticket.status] || 'bg-gray-100 text-gray-800';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-blue-600 hover:underline">
          ← Back
        </button>
        <h1 className="text-3xl font-bold">Ticket #{ticket.ticket_number}</h1>
      </div>

      {/* Ticket Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{ticket.subject}</h2>
            <div className="flex gap-3 text-sm text-gray-600">
              <span>Tenant: <strong>{ticket.tenant_name}</strong> ({ticket.tenant_email})</span>
              <span>•</span>
              <span>Created: {new Date(ticket.created_at).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-sm ${priorityColor}`}>
              {ticket.priority}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm ${statusColor}`}>
              {ticket.status}
            </span>
          </div>
        </div>
        
        {/* Assignment & Status Section */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Assign to:</label>
            <select
              value={selectedAssignee || ticket.assigned_to || ''}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
            >
              <option value="">Unassigned</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.email}
                </option>
              ))}
            </select>
            <button
              onClick={assignTicket}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Assign
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Status:</label>
            <select
              value={selectedStatus || ticket.status}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
            >
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <button
              onClick={updateStatus}
              disabled={!selectedStatus || selectedStatus === ticket.status}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              Update
            </button>
          </div>
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold">Conversation</h3>
        </div>
        <div className="p-6 space-y-4">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No messages yet</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <strong>{msg.sender_email || 'System'}</strong>
                    <span className="ml-2 text-xs text-gray-500">
                      ({msg.sender_role || 'system'})
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(msg.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                {msg.is_internal && (
                  <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                    Internal Note
                  </span>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Reply Form */}
        <div className="p-6 border-t bg-gray-50">
          <h4 className="font-bold mb-3">Reply</h4>
          
          {/* Canned Responses */}
          <div className="mb-3">
            <label className="block text-sm font-medium mb-2">Quick Responses:</label>
            <div className="flex gap-2 flex-wrap">
              {CANNED_RESPONSES.map((resp) => (
                <button
                  key={resp.label}
                  onClick={() => setReplyMessage(resp.text)}
                  className="px-3 py-1 text-sm border rounded hover:bg-white"
                >
                  {resp.label}
                </button>
              ))}
            </div>
          </div>
          
          <textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            className="w-full px-3 py-2 border rounded mb-3"
            rows={4}
            placeholder="Type your reply here..."
          />
          
          <div className="flex items-center gap-4 mb-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Internal note (not visible to customer)</span>
            </label>
            
            {!isInternal && (
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Send email notification</span>
              </label>
            )}
          </div>
          
          <button
            onClick={sendReply}
            disabled={sending || !replyMessage.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {sending ? 'Sending...' : 'Send Reply'}
          </button>
        </div>
      </div>

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-xl font-bold">Attachments</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attachments.map((att) => (
                <div key={att.id} className="flex items-center gap-3 p-3 border rounded">
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <div className="font-medium">{att.filename}</div>
                    <div className="text-sm text-gray-500">
                      {(att.file_size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <a 
                    href={att.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status History */}
      {statusHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-xl font-bold">Status History</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {statusHistory.map((history) => (
                <div key={history.id} className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500">
                    {new Date(history.changed_at).toLocaleString()}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{history.old_status}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium text-blue-600">{history.new_status}</span>
                  {history.changed_by && (
                    <span className="text-gray-500">by {history.changed_by}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
