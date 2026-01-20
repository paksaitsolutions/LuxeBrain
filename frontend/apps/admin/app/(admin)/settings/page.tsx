'use client';

import { useState, useEffect } from 'react';
import { toast } from '@luxebrain/ui/toast';
import { Spinner } from '@luxebrain/ui';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSettings(await res.json());
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      toast.success('Settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Spinner size="lg" /></div>;
  if (!settings) return null;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">System Settings</h1>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">General</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Site Name</label>
              <input type="text" value={settings.site_name} onChange={(e) => setSettings({...settings, site_name: e.target.value})} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Support Email</label>
              <input type="email" value={settings.support_email} onChange={(e) => setSettings({...settings, support_email: e.target.value})} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Tenants Per Plan</label>
              <input type="number" value={settings.max_tenants_per_plan} onChange={(e) => setSettings({...settings, max_tenants_per_plan: Number(e.target.value)})} className="w-full px-3 py-2 border rounded" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Features</h2>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" checked={settings.enable_signups} onChange={(e) => setSettings({...settings, enable_signups: e.target.checked})} className="mr-2" />
              <span>Enable New Signups</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" checked={settings.maintenance_mode} onChange={(e) => setSettings({...settings, maintenance_mode: e.target.checked})} className="mr-2" />
              <span>Maintenance Mode</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" checked={settings.email_notifications} onChange={(e) => setSettings({...settings, email_notifications: e.target.checked})} className="mr-2" />
              <span>Email Notifications</span>
            </label>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Integrations</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Slack Webhook URL</label>
              <input type="text" value={settings.slack_webhook} onChange={(e) => setSettings({...settings, slack_webhook: e.target.value})} placeholder="https://hooks.slack.com/..." className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stripe Public Key</label>
              <input type="text" value={settings.stripe_public_key} onChange={(e) => setSettings({...settings, stripe_public_key: e.target.value})} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Google Analytics ID</label>
              <input type="text" value={settings.google_analytics} onChange={(e) => setSettings({...settings, google_analytics: e.target.value})} className="w-full px-3 py-2 border rounded" />
            </div>
          </div>
        </div>

        <button onClick={saveSettings} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Settings</button>
      </div>
    </div>
  );
}
