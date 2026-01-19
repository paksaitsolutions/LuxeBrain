'use client';

/**
 * Anomaly Notification Banner
 * Copyright © 2024 Paksa IT Solutions
 */

import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '@luxebrain/ui';

interface Anomaly {
  id: number;
  type: string;
  severity: string;
  message: string;
}

export const AnomalyBanner: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        const response = await fetchWithAuth(`/api/admin/anomalies/${tenantId}`);
        const data = await response.json();
        setAnomalies(data.filter((a: Anomaly) => a.severity === 'high'));
      } catch (error) {
        console.error('Failed to fetch anomalies');
      }
    };

    fetchAnomalies();
    const interval = setInterval(fetchAnomalies, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [tenantId]);

  if (anomalies.length === 0) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Security Alerts</h3>
          <div className="mt-2 text-sm text-red-700">
            <ul className="list-disc pl-5 space-y-1">
              {anomalies.map(anomaly => (
                <li key={anomaly.id}>{anomaly.message}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
