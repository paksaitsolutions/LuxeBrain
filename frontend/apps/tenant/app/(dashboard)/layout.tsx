import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-900 text-white p-6">
        <h2 className="text-2xl font-bold mb-8">LuxeBrain AI</h2>
        <nav className="space-y-2">
          <Link href="/overview" className="block px-4 py-2 rounded hover:bg-gray-800">Overview</Link>
          <Link href="/recommendations" className="block px-4 py-2 rounded hover:bg-gray-800">Recommendations</Link>
          <Link href="/automation" className="block px-4 py-2 rounded hover:bg-gray-800">Automation</Link>
          <Link href="/analytics" className="block px-4 py-2 rounded hover:bg-gray-800">Analytics</Link>
          <Link href="/settings" className="block px-4 py-2 rounded hover:bg-gray-800">Settings</Link>
          <Link href="/billing" className="block px-4 py-2 rounded hover:bg-gray-800">Billing</Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
