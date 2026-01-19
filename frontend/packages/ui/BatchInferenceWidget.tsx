/**
 * Batch Inference Widget
 * Copyright © 2024 Paksa IT Solutions
 */

import React, { useState } from 'react';
import { fetchWithAuth } from '@luxebrain/ui';
import { Tooltip, InfoIcon } from './Tooltip';

export const BatchInferenceWidget: React.FC = () => {
  const [customerIds, setCustomerIds] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const submitBatch = async () => {
    setLoading(true);
    try {
      const ids = customerIds.split(',').map(id => id.trim()).filter(Boolean);
      const response = await fetchWithAuth('/api/v1/recommendations/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_ids: ids })
      });
      const data = await response.json();
      setJobId(data.job_id);
      setStatus('pending');
    } catch (error) {
      alert('Failed to submit batch request');
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!jobId) return;
    try {
      const response = await fetchWithAuth(`/api/v1/recommendations/batch/${jobId}`);
      const data = await response.json();
      setStatus(data.status);
    } catch (error) {
      alert('Failed to check status');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold">Batch Recommendations</h3>
        <Tooltip content="Process recommendations for multiple customers at once. Ideal for email campaigns, scheduled reports, or bulk product suggestions. Results are processed asynchronously.">
          <InfoIcon />
        </Tooltip>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Customer IDs (comma-separated)</label>
          <textarea
            value={customerIds}
            onChange={(e) => setCustomerIds(e.target.value)}
            className="w-full border rounded p-2"
            rows={3}
            placeholder="1, 2, 3, 4, 5"
          />
        </div>
        <button
          onClick={submitBatch}
          disabled={loading || !customerIds}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Batch'}
        </button>
        {jobId && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <p className="text-sm"><strong>Job ID:</strong> {jobId}</p>
            <p className="text-sm"><strong>Status:</strong> {status}</p>
            <button
              onClick={checkStatus}
              className="mt-2 text-blue-600 hover:underline text-sm"
            >
              Refresh Status
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
