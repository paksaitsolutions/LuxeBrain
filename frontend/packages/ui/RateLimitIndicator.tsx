/**
 * Rate Limit Display Hook
 * Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
 */

import { useState, useEffect } from "react";

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

export function useRateLimitInfo() {
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);

  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      const limit = response.headers.get("X-RateLimit-Limit");
      const remaining = response.headers.get("X-RateLimit-Remaining");
      const reset = response.headers.get("X-RateLimit-Reset");
      
      if (limit && remaining && reset) {
        setRateLimitInfo({
          limit: parseInt(limit),
          remaining: parseInt(remaining),
          reset: parseInt(reset),
        });
      }
      
      return response;
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return rateLimitInfo;
}

export function RateLimitIndicator() {
  const rateLimitInfo = useRateLimitInfo();

  if (!rateLimitInfo) return null;

  const percentage = (rateLimitInfo.remaining / rateLimitInfo.limit) * 100;
  const isLow = percentage < 20;

  return (
    <div className={`fixed bottom-4 right-4 p-3 rounded-lg shadow-lg ${isLow ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"} border`}>
      <div className="text-xs font-medium mb-1">
        API Rate Limit
      </div>
      <div className="flex items-center gap-2">
        <div className="text-sm font-bold">
          {rateLimitInfo.remaining}/{rateLimitInfo.limit}
        </div>
        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${isLow ? "bg-red-500" : "bg-blue-500"}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
