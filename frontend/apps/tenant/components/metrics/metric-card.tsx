import { Card } from '@luxebrain/ui';

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  trend?: 'up' | 'down';
}

export function MetricCard({ title, value, change, trend }: MetricCardProps) {
  return (
    <Card>
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
      {change !== undefined && (
        <p className={`text-sm mt-2 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {change > 0 ? '+' : ''}{change}% from last period
        </p>
      )}
    </Card>
  );
}
