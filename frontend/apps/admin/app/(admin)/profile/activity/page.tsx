'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@luxebrain/ui';
import { toast } from 'react-hot-toast';

export default function ActivityLogsPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    loadActivities();
  }, [filterAction, filterDateFrom, filterDateTo]);

  const loadActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token!.split('.')[1]));
      const userId = payload.user_id;
      
      const params = new URLSearchParams();
      if (filterAction) params.append('action_type', filterAction);
      if (filterDateFrom) params.append('date_from', filterDateFrom);
      if (filterDateTo) params.append('date_to', filterDateTo);
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/activity?${params}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Failed to load activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterAction('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const getActionColor = (action: string) => {
    if (action.includes('login')) return 'bg-green-100 text-green-800';
    if (action.includes('delete') || action.includes('reject')) return 'bg-red-100 text-red-800';
    if (action.includes('create') || action.includes('add')) return 'bg-blue-100 text-blue-800';
    if (action.includes('update') || action.includes('edit')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) return (
    <div className="flex justify-center items-center p-12">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-blue-600 hover:underline">
          ← Back
        </button>
        <div>
          <h1 className="text-3xl font-bold">Activity Logs</h1>
          <p className="text-gray-600 mt-1">{activities.length} activities found</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-4 gap-4">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="">All Actions</option>
            <option value="login">Login</option>
            <option value="tenant_created">Tenant Created</option>
            <option value="tenant_updated">Tenant Updated</option>
            <option value="ticket_reply">Ticket Reply</option>
            <option value="ticket_assigned">Ticket Assigned</option>
            <option value="ticket_status_changed">Status Changed</option>
          </select>
          
          <div>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="From Date"
            />
          </div>
          
          <div>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="To Date"
            />
          </div>
          
          <button
            onClick={clearFilters}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Activity Timeline</h2>
        </div>
        
        <div className="p-6">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No activities found
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-600" />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getActionColor(activity.action)}`}>
                          {activity.action}
                        </span>
                        <div className="mt-2 text-gray-900">
                          {activity.details || 'No details available'}
                        </div>
                        {activity.resource_type && (
                          <div className="mt-1 text-sm text-gray-600">
                            Resource: {activity.resource_type}
                            {activity.resource_id && ` #${activity.resource_id}`}
                          </div>
                        )}
                        {activity.ip_address && (
                          <div className="mt-1 text-sm text-gray-500">
                            IP: {activity.ip_address}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-500 text-right">
                        <div>{new Date(activity.created_at).toLocaleDateString()}</div>
                        <div>{new Date(activity.created_at).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
