export default function RevenuePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Revenue Analytics</h1>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">MRR</h3>
          <p className="text-3xl font-bold mt-2">$12,450</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">ARR</h3>
          <p className="text-3xl font-bold mt-2">$149,400</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">Churn Rate</h3>
          <p className="text-3xl font-bold mt-2">2.3%</p>
        </div>
      </div>
    </div>
  );
}
