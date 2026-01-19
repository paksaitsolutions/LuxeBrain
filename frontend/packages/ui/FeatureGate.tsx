'use client';

import { useFeatureGate } from './useFeatureGate';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { hasAccess, loading } = useFeatureGate(feature);

  if (loading) return null;
  
  if (!hasAccess) {
    return fallback ? <>{fallback}</> : (
      <div className="p-4 bg-gray-100 border border-gray-300 rounded">
        <p className="text-gray-700">🔒 This feature is not available on your current plan.</p>
        <a href="/billing/upgrade" className="text-blue-600 underline">Upgrade to unlock</a>
      </div>
    );
  }

  return <>{children}</>;
}
