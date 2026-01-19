"use client";

/**
 * Model Isolation Requests Page
 * Copyright © 2024 Paksa IT Solutions
 */

import { useState, useEffect } from "react";

interface IsolationRequest {
  id: number;
  tenant_id: string;
  model_name: string;
  status: string;
  created_at: string;
  reason?: string;
}

export default function IsolationRequestsPage() {
  const [requests, setRequests] = useState<IsolationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/admin/models/isolation-requests", {
        credentials: "include",
      });
      if (res.ok) {
        setRequests(await res.json());
      }
    } catch (error) {
      console.error("Failed to load requests:", error);
    }
    setLoading(false);
  };

  const updateStatus = async (id: number, status: string, reason?: string) => {
    try {
      await fetch(`http://localhost:8000/api/admin/models/isolation-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, reason }),
      });
      loadRequests();
    } catch (error) {
      console.error("Failed to update:", error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Model Isolation Requests</h1>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tenant ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Requested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.map((req) => (
                <tr key={req.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                    {req.tenant_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{req.model_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        req.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : req.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {req.status === "pending" && (
                      <>
                        <button
                          onClick={() => updateStatus(req.id, "approved")}
                          className="text-green-600 hover:text-green-800 mr-3"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateStatus(req.id, "rejected", "Insufficient data")}
                          className="text-red-600 hover:text-red-800"
                        >
                          Reject
                        </button>
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
