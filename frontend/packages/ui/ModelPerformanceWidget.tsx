/**
 * Model Performance Widget
 * Copyright © 2024 Paksa IT Solutions
 */

'use client';

import { useEffect, useState } from 'react';

interface PerformanceData {
  ctr: number;
  conversion_rate: number;
  accuracy: number;
  total_recommendations: number;
  period: string;
}

export function ModelPerformanceWidget() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformance();
    const interval = setInterval(fetchPerformance, 300000); // 5 min
    return () => clearInterval(interval);
  }, []);

  const fetchPerformance = async () => {
    try {
      const res = await fetch('/api/admin/models/performance');
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch performance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Model Performance</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Click-Through Rate</span>
          <span className="text-2xl font-bold text-blue-600">{data.ctr}%</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Conversion Rate</span>
          <span className="text-2xl font-bold text-green-600">{data.conversion_rate}%</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Model Accuracy</span>
          <span className="text-2xl font-bold text-purple-600">{data.accuracy}%</span>
        </div>
        
        <div className="pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Recommendations</span>
            <span className="font-medium">{data.total_recommendations.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Period</span>
            <span className="font-medium">Last 7 days</span>
          </div>
        </div>
      </div>
    </div>
  );
}
