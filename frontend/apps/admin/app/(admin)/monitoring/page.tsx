"use client";

/**
 * Batch Queue Monitoring Dashboard
 * Copyright © 2024 Paksa IT Solutions
 */

import { useState, useEffect } from "react";
import { Tooltip, InfoIcon, PageErrorBoundary } from "@luxebrain/ui";

interface BatchStats {
  queue_length: number;
  processing: number;
  failed_count: number;
  failed_jobs: any[];
  completed_last_hour: number;
  processing_rate: number;
}

function MonitoringContent() {
  const [stats, setStats] = useState<BatchStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/admin/batch/stats", {
        credentials: "include",
      });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const retryJob = async (jobId: string) => {
    try {
      await fetch(`http://localhost:8000/api/admin/batch/retry/${jobId}`, {
        method: "POST",
        credentials: "include",
      });
      loadStats();
    } catch (error) {
      console.error("Failed to retry:", error);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  if (!stats || (stats.queue_length === 0 && stats.processing === 0 && stats.failed_count === 0)) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Batch Queue Monitoring</h1>
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No batch jobs submitted</h3>
          <p className="text-gray-500 mb-4">Submit your first batch inference request to see queue statistics</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            View Documentation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">Batch Queue Monitoring</h1>
        <Tooltip content="Batch inference processes large volumes of recommendations asynchronously. Use for bulk operations like email campaigns or product catalog updates.">
          <InfoIcon />
        </Tooltip>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Tooltip content="Number of jobs waiting to be processed">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Queue Length</div>
            <div className="text-3xl font-bold text-blue-600">{stats?.queue_length || 0}</div>
          </div>
        </Tooltip>
        <Tooltip content="Jobs currently being processed">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Processing</div>
            <div className="text-3xl font-bold text-green-600">{stats?.processing || 0}</div>
          </div>
        </Tooltip>
        <Tooltip content="Jobs that encountered errors and need retry">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Failed Jobs</div>
            <div className="text-3xl font-bold text-red-600">{stats?.failed_count || 0}</div>
          </div>
        </Tooltip>
        <Tooltip content="Average number of jobs processed per minute">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Processing Rate</div>
            <div className="text-3xl font-bold text-purple-600">{stats?.processing_rate || 0}/min</div>
          </div>
        </Tooltip>
      </div>

      {stats && stats.failed_jobs.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Failed Jobs</h2>
          </div>
          <div className="divide-y">
            {stats.failed_jobs.map((job, idx) => (
              <div key={idx} className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium">{job.job_id || `Job ${idx + 1}`}</div>
                  <div className="text-sm text-gray-600">{job.error || "Unknown error"}</div>
                </div>
                <button
                  onClick={() => retryJob(job.job_id || idx.toString())}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MonitoringPage() {
  return (
    <PageErrorBoundary pageName="Batch Monitoring">
      <MonitoringContent />
    </PageErrorBoundary>
  );
}
