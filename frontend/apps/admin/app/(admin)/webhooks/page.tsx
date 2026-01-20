'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@luxebrain/ui';
import { toast } from 'react-hot-toast';

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ url: '', events: [] as string[] });

  const availableEvents = [
    'tenant.created', 'tenant.updated', 'tenant.deleted',
    'payment.success', 'payment.failed',
    'subscription.created', 'subscription.cancelled',
    'anomaly.detected'
  ];

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/webhooks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setWebhooks(data.webhooks || []);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
      toast.error('Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async () => {
    if (!newWebhook.url || newWebhook.events.length === 0) {
      toast.error('URL and at least one event are required');
      return;
    }

    if (!/^https?:\/\/.+/.test(newWebhook.url)) {
      toast.error('Please enter a valid URL');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/webhooks`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newWebhook)
      });
      const data = await res.json();
      setShowCreateModal(false);
      setNewWebhook({ url: '', events: [] });
      loadWebhooks();
      toast.success(`Webhook created! Secret: ${data.secret}`);
    } catch (error) {
      console.error('Failed to create webhook:', error);
      toast.error('Failed to create webhook');
    }
  };

  const deleteWebhook = async (webhookId: number) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadWebhooks();
      toast.success('Webhook deleted successfully!');
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      toast.error('Failed to delete webhook');
    }
  };

  const toggleEvent = (event: string) => {
    if (newWebhook.events.includes(event)) {
      setNewWebhook({...newWebhook, events: newWebhook.events.filter(e => e !== event)});
    } else {
      setNewWebhook({...newWebhook, events: [...newWebhook.events, event]});
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center p-12">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Webhooks</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + New Webhook
        </button>
      </div>

      <div className="space-y-4">
        {webhooks.map(webhook => (
          <div key={webhook.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded">{webhook.url}</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${webhook.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {webhook.active ? 'active' : 'inactive'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {webhook.events?.map((event: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">{event}</span>
                  ))}
                </div>
                <div className="text-sm text-gray-500">Last triggered: {webhook.last_triggered || 'Never'}</div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 border rounded hover:bg-gray-50">Edit</button>
                <button className="px-3 py-1 border rounded hover:bg-gray-50">Test</button>
                <button 
                  onClick={() => deleteWebhook(webhook.id)}
                  className="px-3 py-1 border border-red-600 text-red-600 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h3 className="font-bold mb-2">Available Events</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          {availableEvents.map(event => (
            <span key={event} className="font-mono">{event}</span>
          ))}
        </div>
      </div>

      {/* Create Webhook Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px]">
            <h2 className="text-xl font-bold mb-4">Create New Webhook</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Webhook URL *</label>
                <input 
                  type="url"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({...newWebhook, url: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="https://example.com/webhook"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Events * (select at least one)</label>
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3">
                  {availableEvents.map(event => (
                    <label key={event} className="flex items-center">
                      <input 
                        type="checkbox"
                        checked={newWebhook.events.includes(event)}
                        onChange={() => toggleEvent(event)}
                        className="mr-2"
                      />
                      <span className="text-sm font-mono">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={createWebhook}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Webhook
              </button>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setNewWebhook({ url: '', events: [] });
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
