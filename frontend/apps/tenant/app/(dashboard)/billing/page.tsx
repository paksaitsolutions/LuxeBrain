import { Button } from '@luxebrain/ui';

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Billing & Subscription</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Current Plan: Growth</h2>
        <p className="text-gray-600 mb-4">$299/month</p>
        <Button>Upgrade Plan</Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Usage</h2>
        <p className="text-gray-600">Products: 1,234 / 2,000</p>
        <p className="text-gray-600">Recommendations: 32,450 / 50,000</p>
      </div>
    </div>
  );
}
