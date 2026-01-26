'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Spinner } from '@luxebrain/ui';

export default function ReportsPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [reportType, setReportType] = useState('revenue');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filters, setFilters] = useState<any>({});
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadTemplates();
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setDateFrom(thirtyDaysAgo);
    setDateTo(today);
  }, []);

  const loadTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reports/templates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      toast.error('Failed to load templates');
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reports/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          report_type: reportType,
          metrics: [],
          date_from: dateFrom,
          date_to: dateTo,
          filters
        })
      });
      const data = await res.json();
      setReportData(data);
      toast.success('Report generated');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reports/export/csv`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          report_type: reportType,
          metrics: [],
          date_from: dateFrom,
          date_to: dateTo,
          filters
        })
      });
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      toast.success('Report exported');
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Custom Reports Builder</h1>
        <p className="text-gray-600 mt-1">Generate and export custom reports</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6">Report Configuration</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {templates.find(t => t.id === reportType) && (
              <p className="text-sm text-gray-500 mt-1">
                {templates.find(t => t.id === reportType).description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {reportType === 'tenants' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Plan</label>
                <select
                  value={filters.plan || ''}
                  onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Plans</option>
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={generateReport}
              disabled={loading}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Generating...' : '📊 Generate Report'}
            </button>
            {reportData && (
              <button
                onClick={exportCSV}
                disabled={exporting}
                className={`px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 ${
                  exporting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {exporting ? 'Exporting...' : '📥 Export CSV'}
              </button>
            )}
          </div>
        </div>
      </div>

      {reportData && (
        <>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Report Summary</h2>
            <div className="grid grid-cols-3 gap-6">
              {Object.entries(reportData.summary).map(([key, value]) => (
                <div key={key} className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 capitalize">{key.replace(/_/g, ' ')}</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="text-xl font-semibold">Report Data ({reportData.data.length} records)</h2>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {reportData.data[0] && Object.keys(reportData.data[0]).map((key) => (
                      <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {key.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.data.slice(0, 100).map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      {Object.values(row).map((value: any, i) => (
                        <td key={i} className="px-6 py-4 text-sm text-gray-900">
                          {typeof value === 'number' ? value.toLocaleString() : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {reportData.data.length > 100 && (
                <div className="px-6 py-4 bg-gray-50 text-sm text-gray-600 text-center">
                  Showing first 100 of {reportData.data.length} records. Export to CSV for full data.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Report Builder Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Select report type and date range to generate custom reports</li>
          <li>• Use filters to narrow down data for specific insights</li>
          <li>• Export to CSV for further analysis in Excel or other tools</li>
          <li>• Reports show up to 100 records in preview, full data in export</li>
        </ul>
      </div>
    </div>
  );
}
