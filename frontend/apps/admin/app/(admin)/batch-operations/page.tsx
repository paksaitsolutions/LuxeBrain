'use client';

import { useState } from 'react';
import { ProgressBar, CircularProgress, useProgress } from '@luxebrain/ui';
import { toast } from '@luxebrain/ui/toast';

export default function BatchOperationsPage() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const { progress, updateProgress, reset } = useProgress();
  const [isProcessing, setIsProcessing] = useState(false);

  const startBatchJob = async () => {
    try {
      setIsProcessing(true);
      reset();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/batch/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'process_items',
          items: Array.from({ length: 20 }, (_, i) => i + 1),
        }),
      });

      const data = await res.json();
      setJobId(data.job_id);
      toast.success('Batch job started!');

      // Poll for progress
      pollJobStatus(data.job_id);
    } catch (error) {
      toast.error('Failed to start batch job');
      setIsProcessing(false);
    }
  };

  const pollJobStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/batch/status/${id}`);
        const status = await res.json();
        
        setJobStatus(status);
        updateProgress(status.progress);

        if (status.status === 'completed' || status.status === 'cancelled') {
          clearInterval(interval);
          setIsProcessing(false);
          toast.success(status.message);
        }
      } catch (error) {
        clearInterval(interval);
        setIsProcessing(false);
        toast.error('Failed to fetch job status');
      }
    }, 1000);
  };

  const cancelJob = async () => {
    if (!jobId) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/batch/cancel/${jobId}`, {
        method: 'DELETE',
      });
      toast.info('Job cancelled');
      setIsProcessing(false);
    } catch (error) {
      toast.error('Failed to cancel job');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Batch Operations</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Process Items</h2>
        
        <div className="space-y-6">
          <div>
            <button
              onClick={startBatchJob}
              disabled={isProcessing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Start Batch Job'}
            </button>
            
            {isProcessing && (
              <button
                onClick={cancelJob}
                className="ml-4 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Cancel
              </button>
            )}
          </div>

          {jobStatus && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <ProgressBar
                    progress={progress}
                    label="Overall Progress"
                    color="blue"
                    size="lg"
                  />
                </div>
                <div className="flex justify-center">
                  <CircularProgress
                    progress={progress}
                    label={jobStatus.message}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold">{jobStatus.total}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{jobStatus.completed}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{jobStatus.failed}</p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Status: {jobStatus.status}</p>
                <p className="text-sm text-blue-700 mt-1">{jobStatus.message}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
