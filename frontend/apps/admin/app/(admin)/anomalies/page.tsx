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

  const resolveAnomaly = async (anomalyId: string, status: string) => {
    try {
      await fetch("http://localhost:8000/api/admin/anomalies/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ anomaly_id: anomalyId, status }),
      });
      loadAlerts();
    } catch (error) {
      console.error("Failed to resolve:", error);
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
                      onClick={() => resolveAnomaly(alert.data.id || `${alert.data.tenant_id}-${idx}`, "resolved")}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => resolveAnomaly(alert.data.id || `${alert.data.tenant_id}-${idx}`, "ignored")}
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Ignore
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
