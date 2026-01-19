'use client';
/**
 * Documentation Page
 * Copyright © 2024 Paksa IT Solutions
 */

import { useState } from 'react';
import Link from 'next/link';

const docs = [
  { id: 'readme', title: 'Getting Started', file: 'README.md', icon: '🚀' },
  { id: 'api', title: 'API Reference', file: 'api_reference.md', icon: '📡' },
  { id: 'architecture', title: 'Architecture', file: 'architecture.md', icon: '🏗️' },
  { id: 'frontend', title: 'Frontend Flow', file: 'frontend_flow.md', icon: '⚛️' },
  { id: 'phase3', title: 'Phase 3 Features', file: 'phase3_features.md', icon: '✨' },
  { id: 'guide', title: 'User Guide', file: 'phase3_user_guide.md', icon: '📖' },
  { id: 'deployment', title: 'Deployment', file: 'deployment.md', icon: '🚢' },
  { id: 'woocommerce', title: 'WooCommerce Integration', file: 'woocommerce_integration.md', icon: '🛒' },
  { id: 'env', title: 'Environment Variables', file: 'environment_variables.md', icon: '⚙️' },
  { id: 'postgres', title: 'PostgreSQL Setup', file: 'postgresql_setup.md', icon: '🐘' },
];

export default function DocsPage() {
  const [activeDoc, setActiveDoc] = useState('readme');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const loadDoc = async (docId: string, file: string) => {
    setActiveDoc(docId);
    setLoading(true);
    try {
      const res = await fetch(`/docs/${file}`);
      const text = await res.text();
      setContent(text);
    } catch (error) {
      setContent('# Error\n\nFailed to load documentation.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            LuxeBrain AI
          </Link>
          <nav className="flex gap-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
            <Link href="/docs" className="text-blue-600 font-medium">Docs</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-4 sticky top-8">
              <h2 className="text-lg font-bold mb-4">Documentation</h2>
              <nav className="space-y-1">
                {docs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => loadDoc(doc.id, doc.file)}
                    className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 ${
                      activeDoc === doc.id
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{doc.icon}</span>
                    <span className="text-sm">{doc.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 bg-white rounded-lg shadow p-8">
            {!content && !loading && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h1 className="text-3xl font-bold mb-4">LuxeBrain AI Documentation</h1>
                <p className="text-gray-600 mb-8">
                  Select a topic from the sidebar to get started
                </p>
                <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {docs.slice(0, 4).map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => loadDoc(doc.id, doc.file)}
                      className="p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition"
                    >
                      <div className="text-3xl mb-2">{doc.icon}</div>
                      <div className="font-medium">{doc.title}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {content && !loading && (
              <div className="prose prose-blue max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {content}
                </pre>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600 text-sm">
          © 2024 Paksa IT Solutions. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
