"use client";

/**
 * Model Versions Management Page
 * Copyright © 2024 Paksa IT Solutions
 */

import { useState, useEffect } from "react";
import { Spinner, Tooltip, InfoIcon, PageErrorBoundary } from "@luxebrain/ui";

interface ModelVersion {
  version: string;
  is_active: boolean;
  ab_test_percentage: number;
  performance_score: number | null;
  created_at: string;
  deployed_at: string | null;
}

function ModelVersionsContent() {
  const [models] = useState<string[]>([
    "recommendation",
    "forecasting",
    "segmentation",
    "pricing",
  ]);
  const [selectedModel, setSelectedModel] = useState("recommendation");
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [performance, setPerformance] = useState<any>(null);
  const [showABTest, setShowABTest] = useState(false);
  const [versionA, setVersionA] = useState("");
  const [versionB, setVersionB] = useState("");
  const [split, setSplit] = useState(50);
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [showTenantModel, setShowTenantModel] = useState(false);
  const [tenants, setTenants] = useState<string[]>([]);
  const [selectedTenant, setSelectedTenant] = useState("");

  useEffect(() => {
    loadVersions();
    loadPerformance();
    loadMetricsHistory();
    loadTenants();
  }, [selectedModel]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/admin/models/list/${selectedModel}`,
        { credentials: "include" }
      );
      const data = await res.json();
      setVersions(data.versions || []);
    } catch (error) {
      console.error("Failed to load versions:", error);
    }
    setLoading(false);
  };

  const loadPerformance = async () => {
    try {
      const res = await fetch(
        "http://localhost:8000/api/admin/models/performance",
        { credentials: "include" }
      );
      if (res.ok) {
        setPerformance(await res.json());
      }
    } catch (error) {
      console.error("Failed to load performance:", error);
    }
  };

  const loadMetricsHistory = async () => {
    try {
      const res = await fetch(
        `http://localhost:8000/api/admin/models/metrics-history/${selectedModel}?days=7`,
        { credentials: "include" }
      );
      if (res.ok) {
        setMetricsHistory(await res.json());
      }
    } catch (error) {
      console.error("Failed to load metrics:", error);
    }
  };

  const loadTenants = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/admin/models/tenants", {
        credentials: "include",
      });
      if (res.ok) {
        setTenants(await res.json());
      }
    } catch (error) {
      console.error("Failed to load tenants:", error);
    }
  };

  const activateVersion = async (version: string) => {
    try {
      await fetch("http://localhost:8000/api/admin/models/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          model_name: selectedModel,
          version,
          ab_percentage: 100,
        }),
      });
      loadVersions();
    } catch (error) {
      console.error("Failed to activate:", error);
    }
  };

  const rollback = async (version: string) => {
    if (!confirm(`Rollback to version ${version}?`)) return;
    try {
      await fetch(
        `http://localhost:8000/api/admin/models/rollback?model_name=${selectedModel}&version=${version}`,
        { method: "POST", credentials: "include" }
      );
      loadVersions();
    } catch (error) {
      console.error("Failed to rollback:", error);
    }
  };

  const setupABTest = async () => {
    if (!versionA || !versionB) return;
    try {
      await fetch("http://localhost:8000/api/admin/models/ab-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          model_name: selectedModel,
          version_a: versionA,
          version_b: versionB,
          split,
        }),
      });
      setShowABTest(false);
      loadVersions();
    } catch (error) {
      console.error("Failed to setup A/B test:", error);
    }
  };

  const createTenantModel = async () => {
    if (!selectedTenant) return;
    try {
      await fetch("http://localhost:8000/api/admin/models/create-tenant-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tenant_id: selectedTenant,
          base_model: selectedModel,
        }),
      });
      setShowTenantModel(false);
      alert(`Tenant model created for ${selectedTenant}`);
    } catch (error) {
      console.error("Failed to create tenant model:", error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Model Version Management</h1>

      {performance && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Click-Through Rate</div>
            <div className="text-2xl font-bold text-blue-600">{performance.ctr}%</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Conversion Rate</div>
            <div className="text-2xl font-bold text-green-600">{performance.conversion_rate}%</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Model Accuracy</div>
            <div className="text-2xl font-bold text-purple-600">{performance.accuracy}%</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Recommendations</div>
            <div className="text-2xl font-bold">{performance.total_recommendations.toLocaleString()}</div>
          </div>
        </div>
      )}

      <div className="mb-6 flex justify-between items-center">
        <div>
          <label className="block text-sm font-medium mb-2">Select Model</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="border rounded px-3 py-2"
          >
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Tooltip content="Create an isolated model for a specific tenant with custom training data">
            <button
              onClick={() => setShowTenantModel(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              Create Tenant Model
              <InfoIcon />
            </button>
          </Tooltip>
          <Tooltip content="Compare two model versions by splitting traffic between them to determine which performs better">
            <button
              onClick={() => setShowABTest(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
            >
              Setup A/B Test
              <InfoIcon />
            </button>
          </Tooltip>
        </div>
      </div>

      {showABTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Setup A/B Test</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Version A</label>
                <select
                  value={versionA}
                  onChange={(e) => setVersionA(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select version</option>
                  {versions.map((v) => (
                    <option key={v.version} value={v.version}>
                      {v.version}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Version B</label>
                <select
                  value={versionB}
                  onChange={(e) => setVersionB(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select version</option>
                  {versions.map((v) => (
                    <option key={v.version} value={v.version}>
                      {v.version}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Traffic Split: {split}% / {100 - split}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={split}
                  onChange={(e) => setSplit(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={setupABTest}
                  disabled={!versionA || !versionB}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  Start Test
                </button>
                <button
                  onClick={() => setShowABTest(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTenantModel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Create Tenant Model</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Tenant</label>
                <select
                  value={selectedTenant}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select tenant</option>
                  {tenants.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Base Model</label>
                <input
                  type="text"
                  value={selectedModel}
                  disabled
                  className="w-full border rounded px-3 py-2 bg-gray-100"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createTenantModel}
                  disabled={!selectedTenant}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Create Model
                </button>
                <button
                  onClick={() => setShowTenantModel(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {metricsHistory.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Performance Over Time</h2>
          <div className="space-y-4">
            {['accuracy', 'precision', 'recall', 'f1'].map((metric) => (
              <div key={metric}>
                <div className="text-sm font-medium text-gray-600 mb-2 capitalize">{metric}</div>
                <div className="flex items-end gap-1 h-20">
                  {metricsHistory.map((data, i) => {
                    const value = data[metric] || 0;
                    const height = `${value}%`;
                    return (
                      <div key={i} className="flex-1 flex flex-col justify-end">
                        <div
                          className="bg-blue-500 rounded-t"
                          style={{ height }}
                          title={`${data.date}: ${value}%`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{metricsHistory[0]?.date}</span>
                  <span>{metricsHistory[metricsHistory.length - 1]?.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      ) : versions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No versions registered yet</h3>
          <p className="text-gray-500 mb-4">Register your first model version to start tracking performance</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Register Version
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  A/B %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {versions.map((v) => (
                <tr key={v.version}>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                    {v.version}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {v.is_active ? (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {v.ab_test_percentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {v.performance_score?.toFixed(3) || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(v.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {!v.is_active && (
                      <>
                        <Tooltip content="Make this version active and route 100% of traffic to it">
                          <button
                            onClick={() => activateVersion(v.version)}
                            className="text-blue-600 hover:text-blue-800 mr-3 inline-flex items-center gap-1"
                          >
                            Activate
                          </button>
                        </Tooltip>
                        <Tooltip content="Revert to this previous version if the current version has issues">
                          <button
                            onClick={() => rollback(v.version)}
                            className="text-orange-600 hover:text-orange-800 inline-flex items-center gap-1"
                          >
                            Rollback
                          </button>
                        </Tooltip>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ModelVersionsPage() {
  return (
    <PageErrorBoundary pageName="Model Versions">
      <ModelVersionsContent />
    </PageErrorBoundary>
  );
}
