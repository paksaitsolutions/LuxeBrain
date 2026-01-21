'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Spinner } from '@luxebrain/ui';
import { toast } from 'react-hot-toast';

export default function WebhookLogsPage() {
  const params = useParams();
  const router = useRouter();
  const webhookId = params.id;
  
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [retrying, setRetrying] = useState<number | null>(null);

  useEffect(() => {
    loadLogs();
  }, [webhookId]);

  const loadLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/webhooks/${webhookId}/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to load logs:', error);
      toast.error('Failed to load webhook logs');
    } finally {
      setLoading(false);
    }
  };

  const retryDelivery = async (logId: number) => {
    setRetrying(logId);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/webhooks/logs/${logId}/retry`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Retry successful! Status: ${data.status_code}`);
      } else {
        toast.error(`Retry failed: ${data.error}`);
      }
      
      loadLogs();
    } catch (error) {
      console.error('Failed to retry:', error);
      toast.error('Failed to retry delivery');
    } finally {
      setRetrying(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center p-12">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-blue-600 hover:underline">
          ← Back
        </button>
        <h1 className="text-3xl font-bold">Webhook Delivery Logs</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Response Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retry Count</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No delivery logs yet
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono">{log.event}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      log.status_code >= 200 && log.status_code < 300
                        ? 'bg-green-100 text-green-800'
                        : log.status_code === 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {log.status_code >= 200 && log.status_code < 300 ? 'Success' : 'Failed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{log.status_code || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm">{log.duration_ms}ms</td>
                  <td className="px-6 py-4 text-sm">{log.retry_count || 0}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </button>
                      {(log.status_code === 0 || log.status_code >= 400) && log.retry_count < 3 && (
                        <button
                          onClick={() => retryDelivery(log.id)}
                          disabled={retrying === log.id}
                          className="text-orange-600 hover:underline disabled:text-gray-400"
                        >
                          {retrying === log.id ? 'Retrying...' : 'Retry'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[700px] max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Delivery Details</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Timestamp</span>
                  <div className="mt-1">{new Date(selectedLog.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Event</span>
                  <div className="mt-1 font-mono">{selectedLog.event}</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Status Code</span>
                  <div className="mt-1">{selectedLog.status_code || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Duration</span>
                  <div className="mt-1">{selectedLog.duration_ms}ms</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Retry Count</span>
                  <div className="mt-1">{selectedLog.retry_count || 0}</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Status</span>
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedLog.status_code >= 200 && selectedLog.status_code < 300
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedLog.status_code >= 200 && selectedLog.status_code < 300 ? 'Success' : 'Failed'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500 block mb-2">Response Body</span>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-60">
                  {selectedLog.response_body || 'No response body'}
                </pre>
              </div>
            </div>
            
            <button
              onClick={() => setSelectedLog(null)}
              className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
