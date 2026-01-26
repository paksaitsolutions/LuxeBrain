'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@luxebrain/ui';
import { toast } from 'react-hot-toast';

export default function BatchJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showLogsModal, setShowLogsModal] = useState(false);

  useEffect(() => {
    loadJobs();
  }, [statusFilter]);

  const loadJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = statusFilter 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/batch/jobs?status=${statusFilter}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/batch/jobs`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (error) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const cancelJob = async (jobId: string) => {
    if (!confirm('Cancel this job?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/batch/jobs/${jobId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadJobs();
      toast.success('Job cancelled');
    } catch (error) {
      toast.error('Failed to cancel job');
    }
  };

  const retryJob = async (jobId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/batch/jobs/${jobId}/retry`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadJobs();
      toast.success('Job queued for retry');
    } catch (error) {
      toast.error('Failed to retry job');
    }
  };

  const viewLogs = async (jobId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/batch/jobs/${jobId}/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedJob(data);
      setShowLogsModal(true);
    } catch (error) {
      toast.error('Failed to load logs');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Batch Jobs</h1>

      <div className="mb-6 flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button onClick={loadJobs} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {jobs.map(job => (
              <tr key={job.id}>
                <td className="px-6 py-4 font-mono text-sm">{job.job_id}</td>
                <td className="px-6 py-4">{job.job_type}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    job.status === 'completed' ? 'bg-green-100 text-green-800' :
                    job.status === 'running' ? 'bg-blue-100 text-blue-800' :
                    job.status === 'failed' ? 'bg-red-100 text-red-800' :
                    job.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {job.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {job.total > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(job.progress / job.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{job.progress}/{job.total}</span>
                    </div>
                  ) : '-'}
                </td>
                <td className="px-6 py-4">{job.tenant_id || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(job.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewLogs(job.job_id)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Logs
                    </button>
                    {job.status === 'failed' && (
                      <button
                        onClick={() => retryJob(job.job_id)}
                        className="text-green-600 hover:underline text-sm"
                      >
                        Retry
                      </button>
                    )}
                    {(job.status === 'pending' || job.status === 'running') && (
                      <button
                        onClick={() => cancelJob(job.job_id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showLogsModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[700px] max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Job Logs: {selectedJob.job_id}</h2>
            
            {selectedJob.error_message && (
              <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                <p className="text-sm font-medium text-red-800 mb-1">Error:</p>
                <p className="text-sm text-red-700">{selectedJob.error_message}</p>
              </div>
            )}
            
            <div className="bg-gray-50 rounded p-4 font-mono text-sm whitespace-pre-wrap">
              {selectedJob.logs}
            </div>
            
            <button
              onClick={() => setShowLogsModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
