'use client';

import { Button } from '@luxebrain/ui';
import { OverageWidget } from '@luxebrain/ui';
import { useState } from 'react';

export default function BillingPage() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (plan: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/create-checkout-session?plan=${plan}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}`
        }
      });
      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      alert('Failed to create checkout session');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/portal', {
        headers: {
          'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}`
        }
      });
      const data = await res.json();
      if (data.portal_url) {
        window.location.href = data.portal_url;
      }
    } catch (error) {
      alert('Failed to open billing portal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Billing & Subscription</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Current Plan: Basic</h2>
        <p className="text-gray-600 mb-4">$0/month</p>
        <div className="space-x-2">
          <Button onClick={() => handleUpgrade('premium')} disabled={loading}>
            Upgrade to Premium ($99/mo)
          </Button>
          <Button onClick={() => handleUpgrade('enterprise')} disabled={loading}>
            Upgrade to Enterprise ($299/mo)
          </Button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Manage Subscription</h2>
        <p className="text-gray-600 mb-4">Update payment method, view invoices, or cancel subscription</p>
        <Button onClick={handleManageBilling} disabled={loading}>
          Open Billing Portal
        </Button>
      </div>

      <OverageWidget />

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Basic</h3>
          <p className="text-2xl font-bold mb-4">$0/mo</p>
          <ul className="text-sm space-y-2">
            <li>✓ 1,000 API calls/day</li>
            <li>✓ Basic recommendations</li>
            <li>✓ Email campaigns</li>
          </ul>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg shadow border-2 border-blue-500">
          <h3 className="font-semibold mb-2">Premium</h3>
          <p className="text-2xl font-bold mb-4">$99/mo</p>
          <ul className="text-sm space-y-2">
            <li>✓ 10,000 API calls/day</li>
            <li>✓ Advanced analytics</li>
            <li>✓ Demand forecasting</li>
            <li>✓ SMS & WhatsApp</li>
          </ul>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Enterprise</h3>
          <p className="text-2xl font-bold mb-4">$299/mo</p>
          <ul className="text-sm space-y-2">
            <li>✓ 100,000 API calls/day</li>
            <li>✓ Visual search</li>
            <li>✓ Dynamic pricing</li>
            <li>✓ Priority support</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
