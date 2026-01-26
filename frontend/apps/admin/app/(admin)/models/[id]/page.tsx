'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Spinner } from '@luxebrain/ui';
import { toast } from 'react-hot-toast';

export default function ModelPerformancePage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [compareVersion, setCompareVersion] = useState('');
  const [trainingStatus, setTrainingStatus] = useState<any>(null);
  const [isTraining, setIsTraining] = useState(false);

  useEffect(() => {
    loadMetrics();
    loadTrainingStatus();
    const interval = setInterval(loadTrainingStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/models/${params.id}/metrics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      setData(result);
    } catch (error) {
      toast.error('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const loadTrainingStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/models/${params.id}/training-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      setTrainingStatus(result);
    } catch (error) {
      console.error('Failed to load training status');
    }
  };

  const triggerTraining = async () => {
    if (!confirm('Start model retraining? This may take several hours.')) return;

    setIsTraining(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/models/${params.id}/train`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      toast.success('Training job created!');
      loadTrainingStatus();
    } catch (error) {
      toast.error('Failed to start training');
    } finally {
      setIsTraining(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;
  if (!data) return <div className="p-12 text-center">No data found</div>;

  const getMetricColor = (metric: string, value: number) => {
    if (metric === 'accuracy' || metric === 'precision' || metric === 'recall') {
      return value >= 0.8 ? 'text-green-600' : value >= 0.6 ? 'text-yellow-600' : 'text-red-600';
    }
    if (metric === 'error_rate') {
      return value <= 0.05 ? 'text-green-600' : value <= 0.1 ? 'text-yellow-600' : 'text-red-600';
    }
    if (metric === 'latency') {
      return value <= 100 ? 'text-green-600' : value <= 300 ? 'text-yellow-600' : 'text-red-600';
    }
    return 'text-blue-600';
  };

  return (
    <div>
      <button onClick={() => router.back()} className="mb-4 text-blue-600 hover:underline">
        ← Back to Models
      </button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Model Performance Dashboard</h1>
        <button
          onClick={triggerTraining}
          disabled={isTraining || (trainingStatus?.has_training && trainingStatus?.status === 'running')}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isTraining ? 'Starting...' : 'Retrain Model'}
        </button>
      </div>

      {trainingStatus?.has_training && trainingStatus.status !== 'completed' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-blue-900">Training in Progress</h3>
            <span className={`px-3 py-1 rounded-full text-sm ${
              trainingStatus.status === 'running' ? 'bg-blue-100 text-blue-800' :
              trainingStatus.status === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {trainingStatus.status}
            </span>
          </div>
          {trainingStatus.total > 0 && (
            <div className="mb-2">
              <div className="flex justify-between text-sm text-blue-700 mb-1">
                <span>Progress</span>
                <span>{trainingStatus.progress}/{trainingStatus.total}</span>
              </div>
              <div className="bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(trainingStatus.progress / trainingStatus.total) * 100}%` }}
                />
              </div>
            </div>
          )}
          {trainingStatus.logs && (
            <p className="text-sm text-blue-700 mt-2">{trainingStatus.logs}</p>
          )}
          {trainingStatus.error_message && (
            <p className="text-sm text-red-700 mt-2">Error: {trainingStatus.error_message}</p>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Model Information</h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-medium">{data.model.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Version</p>
            <p className="font-medium">{data.model.version}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <span className={`px-3 py-1 rounded-full text-sm ${data.model.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {data.model.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Created</p>
            <p className="font-medium">{new Date(data.model.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm text-gray-600 mb-2">Accuracy</h3>
          <p className={`text-3xl font-bold ${getMetricColor('accuracy', data.metrics.accuracy)}`}>
            {(data.metrics.accuracy * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm text-gray-600 mb-2">Precision</h3>
          <p className={`text-3xl font-bold ${getMetricColor('precision', data.metrics.precision)}`}>
            {(data.metrics.precision * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm text-gray-600 mb-2">Recall</h3>
          <p className={`text-3xl font-bold ${getMetricColor('recall', data.metrics.recall)}`}>
            {(data.metrics.recall * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm text-gray-600 mb-2">Latency</h3>
          <p className={`text-3xl font-bold ${getMetricColor('latency', data.metrics.latency)}`}>
            {data.metrics.latency.toFixed(0)}ms
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm text-gray-600 mb-2">Error Rate</h3>
          <p className={`text-3xl font-bold ${getMetricColor('error_rate', data.metrics.error_rate)}`}>
            {(data.metrics.error_rate * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Performance Timeline (Last 30 Days)</h2>
        <div className="space-y-4">
          {data.timeline.slice(0, 10).map((item: any) => (
            <div key={item.date} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-24">{item.date}</span>
              <div className="flex-1 grid grid-cols-3 gap-2">
                <div className="text-sm">
                  <span className="text-gray-600">Acc: </span>
                  <span className="font-medium">{((item.accuracy || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Lat: </span>
                  <span className="font-medium">{(item.latency || 0).toFixed(0)}ms</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Err: </span>
                  <span className="font-medium">{((item.error_rate || 0) * 100).toFixed(2)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Version Comparison</h2>
          <select
            value={compareVersion}
            onChange={(e) => setCompareVersion(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="">Select version to compare</option>
            {data.versions.filter((v: any) => v.id !== data.model.id).map((v: any) => (
              <option key={v.id} value={v.id}>{v.version}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          {data.versions.map((v: any) => (
            <div key={v.id} className="flex justify-between items-center p-3 border rounded">
              <div className="flex items-center gap-3">
                <span className="font-medium">{v.version}</span>
                {v.is_active && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Active</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Score: {v.performance_score ? v.performance_score.toFixed(2) : 'N/A'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
