'use client';

import { useEffect, useState } from 'react';

export default function NotificationsCenterPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [unreadOnly]);

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/notifications?unread_only=${unreadOnly}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Notifications Center</h1>
        <label className="flex items-center gap-2">
          <input 
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
          />
          <span className="text-sm">Unread only</span>
        </label>
      </div>

      <div className="space-y-3">
        {notifications.map((notif) => (
          <div key={notif.id} className={`bg-white p-4 rounded-lg shadow ${!notif.read ? 'border-l-4 border-blue-600' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    notif.type === 'system' ? 'bg-blue-100 text-blue-800' :
                    notif.type === 'billing' ? 'bg-green-100 text-green-800' :
                    notif.type === 'anomaly' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {notif.type}
                  </span>
                  {!notif.read && <span className="text-xs text-blue-600 font-medium">NEW</span>}
                </div>
                <h3 className="font-medium mt-2">{notif.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                <div className="text-xs text-gray-500 mt-2">{new Date(notif.created_at).toLocaleString()}</div>
              </div>
              {!notif.read && (
                <button 
                  onClick={() => markAsRead(notif.id)}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                >
                  Mark as Read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
