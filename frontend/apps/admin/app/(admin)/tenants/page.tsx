export default function TenantsPage() {
  const tenants = [
    { id: '1', name: 'Fashion Store A', email: 'store@example.com', plan: 'Growth', status: 'Active', mrr: 299 },
    { id: '2', name: 'Fashion Store B', email: 'store2@example.com', plan: 'Pro', status: 'Active', mrr: 799 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tenant Management</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">MRR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td className="px-6 py-4 whitespace-nowrap">{tenant.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{tenant.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{tenant.plan}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    {tenant.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">${tenant.mrr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
