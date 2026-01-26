'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Spinner } from '@luxebrain/ui';

interface PaymentSettings {
  stripe_test_public_key: string;
  stripe_test_secret_key: string;
  stripe_live_public_key: string;
  stripe_live_secret_key: string;
  paypal_client_id: string;
  paypal_secret: string;
  test_mode: boolean;
}

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<PaymentSettings>({
    stripe_test_public_key: '',
    stripe_test_secret_key: '',
    stripe_live_public_key: '',
    stripe_live_secret_key: '',
    paypal_client_id: '',
    paypal_secret: '',
    test_mode: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/payment`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSettings({
        stripe_test_public_key: data.stripe_test_public_key || '',
        stripe_test_secret_key: data.stripe_test_secret_key || '',
        stripe_live_public_key: data.stripe_live_public_key || '',
        stripe_live_secret_key: data.stripe_live_secret_key || '',
        paypal_client_id: data.paypal_client_id || '',
        paypal_secret: data.paypal_secret || '',
        test_mode: data.test_mode === 'True' || data.test_mode === true
      });
    } catch (error) {
      toast.error('Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/payment`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      toast.success('Payment settings saved successfully');
    } catch (error) {
      toast.error('Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/payment/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.message} (${data.mode} mode)`);
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Connection test failed');
      }
    } catch (error) {
      toast.error('Failed to test connection');
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
        <h1 className="text-3xl font-bold">Payment Gateway Configuration</h1>
        <p className="text-gray-600 mt-1">Configure Stripe and PayPal payment gateways</p>
      </div>

      {/* Mode Toggle */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Payment Mode</h2>
            <p className="text-sm text-gray-600 mt-1">Switch between test and live payment processing</p>
          </div>
          <label className="flex items-center gap-3">
            <span className={`text-sm font-medium ${!settings.test_mode ? 'text-gray-400' : 'text-blue-600'}`}>
              Test Mode
            </span>
            <div className="relative">
              <input
                type="checkbox"
                checked={!settings.test_mode}
                onChange={(e) => setSettings({ ...settings, test_mode: !e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
            </div>
            <span className={`text-sm font-medium ${settings.test_mode ? 'text-gray-400' : 'text-green-600'}`}>
              Live Mode
            </span>
          </label>
        </div>
        {!settings.test_mode && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">⚠️ <strong>Warning:</strong> Live mode will process real payments. Ensure all settings are correct.</p>
          </div>
        )}
      </div>

      {/* Stripe Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6">Stripe Configuration</h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Test Publishable Key</label>
              <input
                type="text"
                value={settings.stripe_test_public_key}
                onChange={(e) => setSettings({ ...settings, stripe_test_public_key: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="pk_test_..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Test Secret Key</label>
              <div className="relative">
                <input
                  type={showSecrets ? 'text' : 'password'}
                  value={settings.stripe_test_secret_key}
                  onChange={(e) => setSettings({ ...settings, stripe_test_secret_key: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="sk_test_..."
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Live Publishable Key</label>
              <input
                type="text"
                value={settings.stripe_live_public_key}
                onChange={(e) => setSettings({ ...settings, stripe_live_public_key: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="pk_live_..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Live Secret Key</label>
              <input
                type={showSecrets ? 'text' : 'password'}
                value={settings.stripe_live_secret_key}
                onChange={(e) => setSettings({ ...settings, stripe_live_secret_key: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="sk_live_..."
              />
            </div>
          </div>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showSecrets}
              onChange={(e) => setShowSecrets(e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Show secret keys</span>
          </label>
        </div>
      </div>

      {/* PayPal Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6">PayPal Configuration</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Client ID</label>
            <input
              type="text"
              value={settings.paypal_client_id}
              onChange={(e) => setSettings({ ...settings, paypal_client_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="AYSq3RDGsmBLJE-otTkBtM-jBc..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Secret</label>
            <input
              type={showSecrets ? 'text' : 'password'}
              value={settings.paypal_secret}
              onChange={(e) => setSettings({ ...settings, paypal_secret: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="EGnHDxD_qRPdaLdZz8iCr8N7_MzF..."
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={saveSettings}
          disabled={saving}
          className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${
            saving ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        <button
          onClick={testConnection}
          disabled={testing}
          className={`px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 ${
            testing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {testing ? 'Testing...' : '🔌 Test Stripe Connection'}
        </button>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Payment Gateway Setup</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Stripe:</strong> Get keys from dashboard.stripe.com/apikeys</li>
          <li>• <strong>PayPal:</strong> Get credentials from developer.paypal.com</li>
          <li>• Test mode uses sandbox/test credentials for safe testing</li>
          <li>• Live mode processes real payments - use with caution</li>
          <li>• Always test connection before going live</li>
        </ul>
      </div>
    </div>
  );
}
