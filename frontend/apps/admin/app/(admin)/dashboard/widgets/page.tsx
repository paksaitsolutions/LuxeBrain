'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Spinner } from '@luxebrain/ui';

interface Widget {
  id: number;
  widget_type: string;
  position: number;
  size: string;
  refresh_interval: number;
  config: any;
}

export default function DashboardWidgetsPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [widgetData, setWidgetData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const widgetTypes = [
    { type: 'revenue', label: 'Revenue', icon: '💰' },
    { type: 'tenants', label: 'Tenants', icon: '👥' },
    { type: 'tickets', label: 'Support Tickets', icon: '🎫' },
    { type: 'users', label: 'Users', icon: '👤' }
  ];

  useEffect(() => {
    loadWidgets();
  }, []);

  const loadWidgets = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/widgets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setWidgets(data);
      
      for (const widget of data) {
        await loadWidgetData(widget.widget_type);
      }
    } catch (error) {
      toast.error('Failed to load widgets');
    } finally {
      setLoading(false);
    }
  };

  const loadWidgetData = async (type: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/widgets/data/${type}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setWidgetData((prev: any) => ({ ...prev, [type]: data }));
    } catch (error) {
      console.error(`Failed to load ${type} data`);
    }
  };

  const addWidget = async (type: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/widgets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          widget_type: type,
          position: widgets.length,
          size: 'medium',
          refresh_interval: 300
        })
      });
      toast.success('Widget added');
      setShowAddModal(false);
      loadWidgets();
    } catch (error) {
      toast.error('Failed to add widget');
    }
  };

  const deleteWidget = async (id: number) => {
    if (!confirm('Remove this widget?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/widgets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Widget removed');
      loadWidgets();
    } catch (error) {
      toast.error('Failed to remove widget');
    }
  };

  const updateWidgetSize = async (id: number, size: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/widgets/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ size })
      });
      loadWidgets();
    } catch (error) {
      toast.error('Failed to update widget');
    }
  };

  const renderWidget = (widget: Widget) => {
    const data = widgetData[widget.widget_type] || {};
    const sizeClass = widget.size === 'small' ? 'col-span-1' : widget.size === 'large' ? 'col-span-2' : 'col-span-1';

    return (
      <div key={widget.id} className={`bg-white rounded-lg shadow p-6 ${sizeClass}`}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold capitalize">{widget.widget_type}</h3>
          <div className="flex gap-2">
            <select
              value={widget.size}
              onChange={(e) => updateWidgetSize(widget.id, e.target.value)}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
            <button
              onClick={() => deleteWidget(widget.id)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {widget.widget_type === 'revenue' && (
          <div>
            <div className="text-3xl font-bold text-green-600">${data.total?.toFixed(2) || '0.00'}</div>
            <div className="text-sm text-gray-600 mt-1">Total Revenue</div>
            <div className="text-sm text-gray-500 mt-2">Last 30 days: ${data.last_30_days?.toFixed(2) || '0.00'}</div>
          </div>
        )}

        {widget.widget_type === 'tenants' && (
          <div>
            <div className="text-3xl font-bold text-blue-600">{data.total || 0}</div>
            <div className="text-sm text-gray-600 mt-1">Total Tenants</div>
            <div className="text-sm text-gray-500 mt-2">Active: {data.active || 0}</div>
          </div>
        )}

        {widget.widget_type === 'tickets' && (
          <div>
            <div className="text-3xl font-bold text-orange-600">{data.open || 0}</div>
            <div className="text-sm text-gray-600 mt-1">Open Tickets</div>
            <div className="text-sm text-gray-500 mt-2">Total: {data.total || 0}</div>
          </div>
        )}

        {widget.widget_type === 'users' && (
          <div>
            <div className="text-3xl font-bold text-purple-600">{data.total || 0}</div>
            <div className="text-sm text-gray-600 mt-1">Total Users</div>
            <div className="text-sm text-gray-500 mt-2">Active: {data.active || 0}</div>
          </div>
        )}

        <div className="text-xs text-gray-400 mt-4">Refreshes every {widget.refresh_interval}s</div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex justify-center items-center p-12">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Widgets</h1>
          <p className="text-gray-600 mt-1">Customize your dashboard</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Widget
        </button>
      </div>

      {widgets.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">No widgets added yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Your First Widget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {widgets.map(renderWidget)}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add Widget</h2>
            <div className="grid grid-cols-2 gap-4">
              {widgetTypes.map(({ type, label, icon }) => (
                <button
                  key={type}
                  onClick={() => addWidget(type)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <div className="text-3xl mb-2">{icon}</div>
                  <div className="font-medium">{label}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Widget Customization</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Add widgets to track key metrics</li>
          <li>• Resize widgets (small, medium, large)</li>
          <li>• Remove widgets with × button</li>
          <li>• Widgets auto-refresh every 5 minutes</li>
        </ul>
      </div>
    </div>
  );
}
