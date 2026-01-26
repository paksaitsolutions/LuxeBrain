'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@luxebrain/ui';
import { toast } from 'react-hot-toast';

export default function AlertRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_name: '',
    metric_name: '',
    threshold_value: 0,
    condition: 'greater_than',
    severity: 'medium',
    channels: [] as string[]
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/anomalies/rules`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setRules(data.rules || []);
    } catch (error) {
      toast.error('Failed to load rules');
    } finally {
      setLoading(false);
    }
  };

  const createRule = async () => {
    if (!newRule.rule_name || !newRule.metric_name || newRule.channels.length === 0) {
      toast.error('Name, metric, and at least one channel are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/anomalies/rules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newRule)
      });
      setShowCreateModal(false);
      setNewRule({
        rule_name: '',
        metric_name: '',
        threshold_value: 0,
        condition: 'greater_than',
        severity: 'medium',
        channels: []
      });
      loadRules();
      toast.success('Alert rule created!');
    } catch (error) {
      toast.error('Failed to create rule');
    }
  };

  const toggleRule = async (ruleId: number, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/anomalies/rules/${ruleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !isActive })
      });
      loadRules();
      toast.success('Rule updated');
    } catch (error) {
      toast.error('Failed to update rule');
    }
  };

  const deleteRule = async (ruleId: number) => {
    if (!confirm('Delete this alert rule?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/anomalies/rules/${ruleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadRules();
      toast.success('Rule deleted');
    } catch (error) {
      toast.error('Failed to delete rule');
    }
  };

  const toggleChannel = (channel: string) => {
    setNewRule(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Anomaly Alert Rules</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + New Rule
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rule Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metric</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Threshold</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channels</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rules.map(rule => (
              <tr key={rule.id}>
                <td className="px-6 py-4 font-medium">{rule.rule_name}</td>
                <td className="px-6 py-4">{rule.metric_name}</td>
                <td className="px-6 py-4">{rule.condition.replace('_', ' ')}</td>
                <td className="px-6 py-4">{rule.threshold_value}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    rule.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    rule.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    rule.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {rule.severity}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    {rule.channels?.map((ch: string) => (
                      <span key={ch} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {ch}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleRule(rule.id, rule.is_active)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px]">
            <h2 className="text-xl font-bold mb-4">Create Alert Rule</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rule Name *</label>
                <input
                  type="text"
                  value={newRule.rule_name}
                  onChange={(e) => setNewRule({...newRule, rule_name: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="High API Usage Alert"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Metric Name *</label>
                <select
                  value={newRule.metric_name}
                  onChange={(e) => setNewRule({...newRule, metric_name: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Select metric</option>
                  <option value="api_calls">API Calls</option>
                  <option value="error_rate">Error Rate</option>
                  <option value="response_time">Response Time</option>
                  <option value="failed_auth">Failed Authentication</option>
                  <option value="order_amount">Order Amount</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Condition</label>
                  <select
                    value={newRule.condition}
                    onChange={(e) => setNewRule({...newRule, condition: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="greater_than">Greater Than</option>
                    <option value="less_than">Less Than</option>
                    <option value="equals">Equals</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Threshold Value</label>
                  <input
                    type="number"
                    value={newRule.threshold_value}
                    onChange={(e) => setNewRule({...newRule, threshold_value: Number(e.target.value)})}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Severity</label>
                <select
                  value={newRule.severity}
                  onChange={(e) => setNewRule({...newRule, severity: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notification Channels *</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newRule.channels.includes('email')}
                      onChange={() => toggleChannel('email')}
                      className="mr-2"
                    />
                    <span className="text-sm">Email</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newRule.channels.includes('slack')}
                      onChange={() => toggleChannel('slack')}
                      className="mr-2"
                    />
                    <span className="text-sm">Slack</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newRule.channels.includes('webhook')}
                      onChange={() => toggleChannel('webhook')}
                      className="mr-2"
                    />
                    <span className="text-sm">Webhook</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={createRule}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Rule
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewRule({
                    rule_name: '',
                    metric_name: '',
                    threshold_value: 0,
                    condition: 'greater_than',
                    severity: 'medium',
                    channels: []
                  });
                }}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
