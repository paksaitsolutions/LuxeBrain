'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FeaturesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/feature-flags');
  }, [router]);

  return (
    <div className="p-6">
      <p>Redirecting to Feature Flags...</p>
    </div>
  );
}
