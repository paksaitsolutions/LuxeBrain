import { MetricCard } from '@/components/metrics/metric-card';
import { UsageWidget } from '@luxebrain/ui/UsageWidget';
import { ModelPerformanceWidget } from '@luxebrain/ui/ModelPerformanceWidget';

export default async function OverviewPage() {
  const metrics = {
    ai_revenue: 45230,
    ai_revenue_change: 23.5,
    conversion_lift: 18.2,
    conversion_lift_change: 5.3,
    aov_increase: 12.8,
    aov_increase_change: 3.1,
    active_campaigns: 8,
    campaign_change: 2,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">AI Performance Dashboard</h1>
      
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="AI-Driven Revenue"
          value={`$${metrics.ai_revenue.toLocaleString()}`}
          change={metrics.ai_revenue_change}
          trend="up"
        />
        <MetricCard
          title="Conversion Lift"
          value={`${metrics.conversion_lift}%`}
          change={metrics.conversion_lift_change}
          trend="up"
        />
        <MetricCard
          title="AOV Increase"
          value={`${metrics.aov_increase}%`}
          change={metrics.aov_increase_change}
          trend="up"
        />
        <MetricCard
          title="Active Campaigns"
          value={metrics.active_campaigns.toString()}
          change={metrics.campaign_change}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Revenue Chart</h2>
          <p className="text-gray-600">Chart implementation here</p>
        </div>
        <div className="space-y-4">
          <UsageWidget />
          <ModelPerformanceWidget />
        </div>
      </div>
    </div>
  );
}
