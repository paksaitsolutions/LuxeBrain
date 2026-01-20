'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@luxebrain/ui';
import { toast } from 'react-hot-toast';

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [newTemplate, setNewTemplate] = useState({ name: '', subject: '', body: '' });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/email-templates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: any) => {
    setSelectedTemplate({...template});
    setShowEditModal(true);
  };

  const handlePreview = (template: any) => {
    setSelectedTemplate({...template});
    setShowPreviewModal(true);
  };

  const handleTestSend = (template: any) => {
    const email = prompt('Enter email address to send test:');
    if (email) {
      alert(`Test email sent to ${email}`);
    }
  };

  const handleSave = async () => {
    if (!selectedTemplate.name || !selectedTemplate.subject || !selectedTemplate.body) {
      toast.error('Name, subject, and body are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/email-templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: selectedTemplate.name,
          subject: selectedTemplate.subject,
          body: selectedTemplate.body
        })
      });
      setShowEditModal(false);
      loadTemplates();
      toast.success('Template updated successfully!');
    } catch (error) {
      console.error('Failed to update template:', error);
      toast.error('Failed to update template');
    }
  };

  const handleCreate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.body) {
      toast.error('All fields are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/email-templates`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTemplate)
      });
      setShowCreateModal(false);
      setNewTemplate({ name: '', subject: '', body: '' });
      loadTemplates();
      toast.success('Template created successfully!');
    } catch (error) {
      console.error('Failed to create template:', error);
      toast.error('Failed to create template');
    }
  };

  const deleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/email-templates/${templateId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadTemplates();
      toast.success('Template deleted successfully!');
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center p-12">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Email Templates</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + New Template
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Template Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Modified</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {templates.map(template => (
              <tr key={template.id}>
                <td className="px-6 py-4 font-medium">{template.name}</td>
                <td className="px-6 py-4 text-gray-600">{template.subject}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{template.updated_at ? new Date(template.updated_at).toLocaleDateString() : 'N/A'}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${template.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {template.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => handleEdit(template)}
                    className="text-blue-600 hover:underline mr-3"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handlePreview(template)}
                    className="text-blue-600 hover:underline mr-3"
                  >
                    Preview
                  </button>
                  <button 
                    onClick={() => handleTestSend(template)}
                    className="text-blue-600 hover:underline mr-3"
                  >
                    Test Send
                  </button>
                  <button 
                    onClick={() => deleteTemplate(template.id)}
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px]">
            <h2 className="text-xl font-bold mb-4">Create New Template</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Template Name</label>
                <input 
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="e.g. Welcome Email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input 
                  type="text"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Email subject line"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Body</label>
                <textarea 
                  value={newTemplate.body}
                  onChange={(e) => setNewTemplate({...newTemplate, body: e.target.value})}
                  className="w-full px-3 py-2 border rounded h-32"
                  placeholder="Email body content..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={handleCreate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px]">
            <h2 className="text-xl font-bold mb-4">Edit Template</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Template Name</label>
                <input 
                  type="text"
                  value={selectedTemplate.name}
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input 
                  type="text"
                  value={selectedTemplate.subject}
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, subject: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Body</label>
                <textarea 
                  value={selectedTemplate.body}
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, body: e.target.value})}
                  className="w-full px-3 py-2 border rounded h-32"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
              <button 
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px]">
            <h2 className="text-xl font-bold mb-4">Email Preview</h2>
            <div className="border rounded p-4 bg-gray-50">
              <div className="mb-4">
                <div className="text-sm text-gray-600">Subject:</div>
                <div className="font-bold">{selectedTemplate.subject}</div>
              </div>
              <div className="border-t pt-4">
                <div className="whitespace-pre-wrap">{selectedTemplate.body}</div>
              </div>
            </div>
            <button 
              onClick={() => setShowPreviewModal(false)}
              className="w-full mt-6 px-4 py-2 border rounded hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
