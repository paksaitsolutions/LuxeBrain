import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-900 text-white p-6">
        <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>
        <nav className="space-y-2">
          <Link href="/tenants" className="block px-4 py-2 rounded hover:bg-gray-800">Tenants</Link>
          <Link href="/revenue" className="block px-4 py-2 rounded hover:bg-gray-800">Revenue</Link>
          <Link href="/usage" className="block px-4 py-2 rounded hover:bg-gray-800">Usage</Link>
          <Link href="/support" className="block px-4 py-2 rounded hover:bg-gray-800">Support</Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
