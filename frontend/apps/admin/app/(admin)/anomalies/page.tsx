"use client";

/**
 * Anomaly Detection & Alerts Page
 * Copyright © 2024 Paksa IT Solutions
 */

import { useState, useEffect } from "react";
import { Spinner, Tooltip, InfoIcon, PageErrorBoundary } from "@luxebrain/ui";

interface Anomaly {
  type: string;
  tenant_id: string;
  severity: string;
  timestamp: string;
  count?: number;
  amount?: number;
  id?: string;
}

interface Alert {
  type: string;
  data: Anomaly;
  timestamp: string;
}

function AnomaliesContent() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/admin/alerts", {
        credentials: "include",
      });
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error("Failed to load alerts:", error);
    }
    setLoading(false);
  };

  const viewDetails = async (anomalyId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/anomalies/${anomalyId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedAnomaly(data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Failed to load details:', error);
    }
  };

  const markFalsePositive = async (anomalyId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/anomalies/${anomalyId}/mark-false-positive`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setShowDetailModal(false);
      loadAlerts();
    } catch (error) {
      console.error('Failed to mark false positive:', error);
    }
  };

  const createTicket = async (anomalyId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/anomalies/${anomalyId}/create-ticket`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('Ticket created successfully');
    } catch (error) {
      console.error('Failed to create ticket:', error);
    }
  };

  const notifyTenant = async (anomalyId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/anomalies/${anomalyId}/notify-tenant`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('Tenant notified successfully');
    } catch (error) {
      console.error('Failed to notify tenant:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "low":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      high_api_rate: "High API Rate",
      failed_auth: "Failed Authentication",
      large_order: "Large Order",
      rapid_orders: "Rapid Orders",
      unusual_time: "Unusual Time Activity",
    };
    return labels[type] || type;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Security Anomalies & Alerts</h1>
          <Tooltip content="Anomalies are unusual patterns detected in API usage, authentication attempts, and order behavior. High severity requires immediate attention.">
            <InfoIcon />
          </Tooltip>
        </div>
        <button
          onClick={loadAlerts}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {loading && alerts.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <p className="text-green-800 font-medium">No anomalies detected</p>
          <p className="text-green-600 text-sm mt-2">
            All systems operating normally
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg shadow border-l-4 border-red-500 p-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Tooltip content={`${alert.data.severity === 'high' ? 'Critical issue requiring immediate action' : alert.data.severity === 'medium' ? 'Moderate issue that should be reviewed soon' : 'Low priority issue for monitoring'}`}>
                      <span
                        className={`px-2 py-1 text-xs rounded ${getSeverityColor(
                          alert.data.severity
                        )}`}
                      >
                        {alert.data.severity.toUpperCase()}
                      </span>
                    </Tooltip>
                    <span className="font-medium">
                      {getTypeLabel(alert.data.type)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Tenant:</span>{" "}
                      {alert.data.tenant_id}
                    </p>
                    {alert.data.count && (
                      <p>
                        <span className="font-medium">Count:</span>{" "}
                        {alert.data.count}
                      </p>
                    )}
                    {alert.data.amount && (
                      <p>
                        <span className="font-medium">Amount:</span> $
                        {alert.data.amount}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-sm text-gray-500">
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewDetails(alert.data.id || `${alert.data.tenant_id}-${idx}`)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetailModal && selectedAnomaly && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[800px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Anomaly Details</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Metric</p>
                  <p className="font-medium">{selectedAnomaly.anomaly.metric_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Severity</p>
                  <span className={`px-3 py-1 rounded-full text-sm ${getSeverityColor(selectedAnomaly.anomaly.severity)}`}>
                    {selectedAnomaly.anomaly.severity}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Actual Value</p>
                  <p className="font-medium">{selectedAnomaly.anomaly.metric_value}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expected Value</p>
                  <p className="font-medium">{selectedAnomaly.anomaly.expected_value || 'N/A'}</p>
                </div>
              </div>

              {selectedAnomaly.tenant && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Affected Tenant</h3>
                  <p><span className="text-gray-600">Name:</span> {selectedAnomaly.tenant.name}</p>
                  <p><span className="text-gray-600">Email:</span> {selectedAnomaly.tenant.email}</p>
                </div>
              )}

              {selectedAnomaly.related_anomalies?.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Related Anomalies</h3>
                  <div className="space-y-2">
                    {selectedAnomaly.related_anomalies.map((r: any) => (
                      <div key={r.anomaly_id} className="text-sm p-2 bg-gray-50 rounded">
                        <span className="font-medium">{r.metric_name}</span> - {r.severity}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedAnomaly.timeline?.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Timeline (Last 7 Days)</h3>
                  <div className="space-y-1">
                    {selectedAnomaly.timeline.slice(0, 5).map((t: any) => (
                      <div key={t.anomaly_id} className="text-sm flex justify-between">
                        <span>{new Date(t.detected_at).toLocaleString()}</span>
                        <span>Value: {t.metric_value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => markFalsePositive(selectedAnomaly.anomaly.anomaly_id)}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Mark False Positive
              </button>
              <button
                onClick={() => createTicket(selectedAnomaly.anomaly.anomaly_id)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Create Ticket
              </button>
              <button
                onClick={() => notifyTenant(selectedAnomaly.anomaly.anomaly_id)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Notify Tenant
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnomaliesPage() {
  return (
    <PageErrorBoundary pageName="Anomalies">
      <AnomaliesContent />
    </PageErrorBoundary>
  );
}
