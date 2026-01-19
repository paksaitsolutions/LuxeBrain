import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'LuxeBrain AI - AI-Driven eCommerce Automation',
  description: 'Boost revenue with AI-powered recommendations, forecasting, and automation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold">LuxeBrain AI</Link>
            <div className="space-x-6">
              <Link href="/pricing" className="hover:text-blue-600">Pricing</Link>
              <Link href="/roi-calculator" className="hover:text-blue-600">ROI Calculator</Link>
              <Link href="/case-studies" className="hover:text-blue-600">Case Studies</Link>
              <Link href="/docs" className="hover:text-blue-600">Docs</Link>
              <Link href="http://localhost:3000/login" className="px-4 py-2 bg-blue-600 text-white rounded">Login</Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
