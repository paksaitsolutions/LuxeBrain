'use client';

import { useEffect, useState } from 'react';

export function useFeatureGate(feature: string) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/features/check/${feature}`, {
      headers: { 'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}` }
    })
      .then(res => res.json())
      .then(data => setHasAccess(data.has_access))
      .finally(() => setLoading(false));
  }, [feature]);

  return { hasAccess, loading };
}

export function useFeatures() {
  const [features, setFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/features/available', {
      headers: { 'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}` }
    })
      .then(res => res.json())
      .then(data => setFeatures(data.features || []))
      .finally(() => setLoading(false));
  }, []);

  const hasFeature = (feature: string) => features.includes(feature);

  return { features, hasFeature, loading };
}
