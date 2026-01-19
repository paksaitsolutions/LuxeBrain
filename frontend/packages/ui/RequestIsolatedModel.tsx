/**
 * Request Isolated Model Component
 * Copyright © 2024 Paksa IT Solutions
 */

'use client';

import { useState, useEffect } from 'react';

interface IsolationStatus {
  has_request: boolean;
  status?: string;
  model_name?: string;
  created_at?: string;
  reason?: string;
}

export function RequestIsolatedModel({ tenantId, plan }: { tenantId: string; plan: string }) {
  const [status, setStatus] = useState<IsolationStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, [tenantId]);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/admin/models/isolation-status/${tenantId}`);
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const requestIsolation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/models/request-isolation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, model_name: 'recommendation' }),
      });
      
      if (res.ok) {
        await fetchStatus();
      }
    } catch (error) {
      console.error('Failed to request:', error);
    } finally {
      setLoading(false);
    }
  };

  if (plan !== 'enterprise') return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2">Isolated Model</h3>
      <p className="text-sm text-gray-600 mb-4">
        Request a dedicated AI model trained exclusively on your data for maximum performance.
      </p>

      {status?.has_request ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <span className={`px-2 py-1 text-xs rounded ${
              status.status === 'approved' ? 'bg-green-100 text-green-800' :
              status.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {status.status}
            </span>
          </div>
          {status.reason && (
            <p className="text-sm text-gray-600">{status.reason}</p>
          )}
        </div>
      ) : (
        <button
          onClick={requestIsolation}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Requesting...' : 'Request Isolated Model'}
        </button>
      )}
    </div>
  );
}
