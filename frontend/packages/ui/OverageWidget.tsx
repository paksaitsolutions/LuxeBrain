'use client';

import { useEffect, useState } from 'react';

interface OverageData {
  api_calls: {
    used: number;
    included: number;
    overage: number;
    charge: number;
  };
  ml_inferences: {
    used: number;
    included: number;
    overage: number;
    charge: number;
  };
  total_overage_charge: number;
}

export function OverageWidget() {
  const [data, setData] = useState<OverageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/metering/overage', {
      headers: { 'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}` }
    })
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 bg-white rounded shadow">Loading...</div>;
  if (!data) return null;

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-bold mb-4">Overage Charges</h3>
      
      {data.total_overage_charge > 0 ? (
        <>
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded">
            <p className="text-yellow-800 font-semibold">
              ⚠️ You have overage charges this month
            </p>
          </div>

          <div className="space-y-3">
            {data.api_calls.overage > 0 && (
              <div className="border-b pb-2">
                <div className="flex justify-between text-sm">
                  <span>API Calls Overage</span>
                  <span className="font-semibold">${data.api_calls.charge}</span>
                </div>
                <div className="text-xs text-gray-600">
                  {data.api_calls.overage.toLocaleString()} calls over limit
                </div>
              </div>
            )}

            {data.ml_inferences.overage > 0 && (
              <div className="border-b pb-2">
                <div className="flex justify-between text-sm">
                  <span>ML Inferences Overage</span>
                  <span className="font-semibold">${data.ml_inferences.charge}</span>
                </div>
                <div className="text-xs text-gray-600">
                  {data.ml_inferences.overage.toLocaleString()} inferences over limit
                </div>
              </div>
            )}

            <div className="pt-2 border-t-2">
              <div className="flex justify-between font-bold">
                <span>Total Overage</span>
                <span className="text-red-600">${data.total_overage_charge}</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Will be invoiced at end of month
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-green-600">✓ No overage charges</p>
          <p className="text-sm text-gray-600 mt-1">You're within your plan limits</p>
        </div>
      )}
    </div>
  );
}
