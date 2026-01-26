'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Spinner } from '@luxebrain/ui';

export default function CouponUsagePage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsageData();
  }, []);

  const loadUsageData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/coupons/${params.id}/usage`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const result = await res.json();
      setData(result);
    } catch (error) {
      toast.error('Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center p-12">
      <Spinner size="lg" />
    </div>
  );

  if (!data) return <div className="p-6">Coupon not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-3xl font-bold">Coupon Usage: {data.coupon.code}</h1>
          <p className="text-gray-600 mt-1">Track redemptions and revenue impact</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Redemptions</div>
          <div className="text-3xl font-bold text-blue-600">{data.stats.redemption_count}</div>
          {data.coupon.limit && (
            <div className="text-xs text-gray-500 mt-1">
              of {data.coupon.limit} limit
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Discount</div>
          <div className="text-3xl font-bold text-green-600">
            ${data.stats.total_discount.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Revenue impact</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Unique Tenants</div>
          <div className="text-3xl font-bold text-purple-600">{data.stats.unique_tenants}</div>
          <div className="text-xs text-gray-500 mt-1">Used by</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Remaining Uses</div>
          <div className="text-3xl font-bold text-orange-600">
            {data.stats.remaining_uses !== null ? data.stats.remaining_uses : '∞'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {data.coupon.active ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>

      {/* Coupon Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Coupon Details</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-600">Code</div>
            <div className="font-mono font-bold text-lg">{data.coupon.code}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Discount</div>
            <div className="font-bold text-lg">
              {data.coupon.type === 'percent' ? `${data.coupon.discount}%` : `$${data.coupon.discount}`}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Type</div>
            <div className="font-bold text-lg capitalize">{data.coupon.type}</div>
          </div>
        </div>
      </div>

      {/* Usage Timeline */}
      {data.timeline.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Usage Timeline (Last 30 Days)</h2>
          <div className="space-y-2">
            {data.timeline.map((item: any) => (
              <div key={item.date} className="flex items-center gap-4">
                <div className="text-sm text-gray-600 w-32">{item.date}</div>
                <div className="flex-1">
                  <div className="bg-blue-100 rounded-full h-6 relative">
                    <div
                      className="bg-blue-600 rounded-full h-6 flex items-center justify-end pr-2"
                      style={{ width: `${(item.count / Math.max(...data.timeline.map((t: any) => t.count))) * 100}%` }}
                    >
                      <span className="text-xs text-white font-medium">{item.count}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tenant List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-xl font-semibold">Tenants Using This Coupon</h2>
        </div>
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage Count</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.tenants.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No tenants have used this coupon yet
                </td>
              </tr>
            ) : (
              data.tenants.map((tenant: any) => (
                <tr key={tenant.tenant_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{tenant.name}</div>
                    <div className="text-sm text-gray-500">{tenant.tenant_id}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">{tenant.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {tenant.usage_count}x
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => router.push(`/tenants/${tenant.tenant_id}`)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Tenant
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Usage Tracking</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Redemption count shows total times coupon was used</li>
          <li>• Total discount shows revenue impact from this coupon</li>
          <li>• Timeline shows daily usage patterns over last 30 days</li>
          <li>• Tenant list shows who used the coupon and how many times</li>
        </ul>
      </div>
    </div>
  );
}
