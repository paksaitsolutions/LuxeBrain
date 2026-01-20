'use client';

import { useEffect, useState } from 'react';

export default function BackupRestorePage() {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/backups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setBackups(data.backups || []);
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  };

  const createBackup = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/backups/create`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTimeout(loadBackups, 2000);
    } catch (error) {
      console.error('Failed to create backup:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Backup & Restore</h1>
        <button 
          onClick={createBackup}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : '+ Create Backup'}
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          <div>
            <div className="font-medium text-yellow-800">Important</div>
            <div className="text-sm text-yellow-700 mt-1">
              Backups are stored locally. For production, configure S3 or external storage.
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filename</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {backups.map((backup) => (
              <tr key={backup.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{backup.filename}</td>
                <td className="px-6 py-4 text-sm">{backup.size_mb} MB</td>
                <td className="px-6 py-4 text-sm capitalize">{backup.backup_type}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    backup.status === 'completed' ? 'bg-green-100 text-green-800' :
                    backup.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {backup.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(backup.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
