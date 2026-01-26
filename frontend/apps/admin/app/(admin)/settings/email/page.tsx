'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Spinner } from '@luxebrain/ui';

interface EmailSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  sender_name: string;
  sender_email: string;
  use_tls: boolean;
}

export default function EmailSettingsPage() {
  const [settings, setSettings] = useState<EmailSettings>({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    sender_name: '',
    sender_email: '',
    use_tls: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/email`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSettings({
        smtp_host: data.smtp_host || '',
        smtp_port: parseInt(data.smtp_port) || 587,
        smtp_username: data.smtp_username || '',
        smtp_password: data.smtp_password || '',
        sender_name: data.sender_name || '',
        sender_email: data.sender_email || '',
        use_tls: data.use_tls === 'True' || data.use_tls === true
      });
    } catch (error) {
      toast.error('Failed to load email settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/email`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      toast.success('Email settings saved successfully');
    } catch (error) {
      toast.error('Failed to save email settings');
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    setTesting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/email/test?test_email=${testEmail}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success(`Test email sent to ${testEmail}`);
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to send test email');
      }
    } catch (error) {
      toast.error('Failed to send test email');
    } finally {
      setTesting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center p-12">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Configuration</h1>
        <p className="text-gray-600 mt-1">Configure SMTP settings for sending emails</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6">SMTP Settings</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
            <input
              type="text"
              value={settings.smtp_host}
              onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="smtp.gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
            <input
              type="number"
              value={settings.smtp_port}
              onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="587"
            />
            <p className="text-xs text-gray-500 mt-1">Common ports: 587 (TLS), 465 (SSL), 25 (Plain)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Username</label>
            <input
              type="text"
              value={settings.smtp_username}
              onChange={(e) => setSettings({ ...settings, smtp_username: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your-email@gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={settings.smtp_password}
                onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sender Name</label>
            <input
              type="text"
              value={settings.sender_name}
              onChange={(e) => setSettings({ ...settings, sender_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="LuxeBrain AI"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sender Email</label>
            <input
              type="email"
              value={settings.sender_email}
              onChange={(e) => setSettings({ ...settings, sender_email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="noreply@luxebrain.ai"
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.use_tls}
                onChange={(e) => setSettings({ ...settings, use_tls: e.target.checked })}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Use TLS/STARTTLS</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">Recommended for secure connections</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${
              saving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Test Email Configuration</h2>
        <p className="text-sm text-gray-600 mb-4">Send a test email to verify your SMTP settings</p>
        
        <div className="flex gap-4">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="test@example.com"
          />
          <button
            onClick={sendTestEmail}
            disabled={testing}
            className={`px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 ${
              testing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {testing ? 'Sending...' : '📧 Send Test Email'}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Email Configuration Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Gmail:</strong> Use smtp.gmail.com:587 with app password</li>
          <li>• <strong>SendGrid:</strong> Use smtp.sendgrid.net:587 with API key</li>
          <li>• <strong>AWS SES:</strong> Use email-smtp.region.amazonaws.com:587</li>
          <li>• <strong>Mailgun:</strong> Use smtp.mailgun.org:587</li>
          <li>• Always test your configuration before production use</li>
        </ul>
      </div>
    </div>
  );
}
