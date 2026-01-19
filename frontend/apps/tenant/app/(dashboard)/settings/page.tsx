'use client';

import { RequestIsolatedModel } from '@luxebrain/ui/RequestIsolatedModel';

export default function SettingsPage() {
  // TODO: Get from auth context
  const tenantId = 'tenant_123';
  const plan = 'enterprise';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
        <p className="text-gray-600">Account and integration settings</p>
      </div>

      <RequestIsolatedModel tenantId={tenantId} plan={plan} />
    </div>
  );
}
