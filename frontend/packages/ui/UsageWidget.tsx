'use client';

import { useEffect, useState } from 'react';

interface UsageData {
  limits: {
    api_calls_per_day: number;
    ml_inferences_per_day: number;
    products: number;
    storage_mb: number;
  };
  usage: {
    api_calls: number;
    ml_inferences: number;
    storage_bytes: number;
  };
  usage_percentage: {
    api_calls: number;
    ml_inferences: number;
    storage: number;
  };
  within_limits: boolean;
}

export function UsageWidget() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/limits/status', {
      headers: { 'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}` }
    })
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 bg-white rounded shadow">Loading...</div>;
  if (!data) return null;

  const getColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-bold mb-4">Usage & Limits</h3>
      
      {!data.within_limits && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700 font-semibold">⚠️ Limit Exceeded</p>
          <a href="/billing/upgrade" className="text-blue-600 underline">Upgrade Plan</a>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>API Calls</span>
            <span>{data.usage.api_calls} / {data.limits.api_calls_per_day}</span>
          </div>
          <div className="w-full bg-gray-200 rounded h-2">
            <div 
              className={`h-2 rounded ${getColor(data.usage_percentage.api_calls)}`}
              style={{ width: `${Math.min(data.usage_percentage.api_calls, 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>ML Inferences</span>
            <span>{data.usage.ml_inferences} / {data.limits.ml_inferences_per_day}</span>
          </div>
          <div className="w-full bg-gray-200 rounded h-2">
            <div 
              className={`h-2 rounded ${getColor(data.usage_percentage.ml_inferences)}`}
              style={{ width: `${Math.min(data.usage_percentage.ml_inferences, 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Storage</span>
            <span>{(data.usage.storage_bytes / (1024 * 1024)).toFixed(1)} MB / {data.limits.storage_mb} MB</span>
          </div>
          <div className="w-full bg-gray-200 rounded h-2">
            <div 
              className={`h-2 rounded ${getColor(data.usage_percentage.storage)}`}
              style={{ width: `${Math.min(data.usage_percentage.storage, 100)}%` }}
            />
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span>Products</span>
            <span>{data.limits.products === -1 ? 'Unlimited' : `0 / ${data.limits.products}`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
