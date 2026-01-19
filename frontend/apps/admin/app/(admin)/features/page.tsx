'use client';

export default function FeaturesPage() {
  const planFeatures = {
    basic: ['recommendations', 'basic_analytics', 'email_campaigns'],
    premium: [
      'recommendations', 'basic_analytics', 'email_campaigns',
      'advanced_analytics', 'demand_forecasting', 'customer_segmentation',
      'sms_campaigns', 'whatsapp_campaigns'
    ],
    enterprise: [
      'recommendations', 'basic_analytics', 'email_campaigns',
      'advanced_analytics', 'demand_forecasting', 'customer_segmentation',
      'sms_campaigns', 'whatsapp_campaigns', 'visual_search',
      'dynamic_pricing', 'ab_testing', 'custom_models',
      'api_access', 'priority_support'
    ]
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Feature Flags</h1>

      <div className="grid grid-cols-3 gap-4">
        {Object.entries(planFeatures).map(([plan, features]) => (
          <div key={plan} className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 capitalize">{plan} Plan</h2>
            <div className="space-y-2">
              {features.map(feature => (
                <div key={feature} className="flex items-center text-sm">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>{feature.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <span className="text-sm font-semibold">{features.length} features</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 p-4 rounded border border-blue-200">
        <p className="text-sm text-blue-800">
          💡 Feature flags are configured in <code className="bg-blue-100 px-2 py-1 rounded">api/utils/feature_gate.py</code>
        </p>
      </div>
    </div>
  );
}
