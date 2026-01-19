import { FeatureGate } from '@luxebrain/ui';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics & Insights</h1>
      
      <FeatureGate feature="advanced_analytics">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">Detailed analytics and reports</p>
        </div>
      </FeatureGate>
    </div>
  );
}
