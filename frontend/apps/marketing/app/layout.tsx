import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'LuxeBrain AI - AI-Driven eCommerce Automation for WooCommerce',
  description: 'Increase AOV by 15%, conversion by 25%, and ROI by 300%+ with AI-powered recommendations, dynamic pricing, and automation for WooCommerce fashion stores.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LuxeBrain AI
            </Link>
            <div className="flex items-center space-x-8">
              <Link href="/pricing" className="hover:text-blue-600 font-medium">Pricing</Link>
              <Link href="/roi-calculator" className="hover:text-blue-600 font-medium">ROI Calculator</Link>
              <Link href="/case-studies" className="hover:text-blue-600 font-medium">Case Studies</Link>
              <Link href="/docs" className="hover:text-blue-600 font-medium">Docs</Link>
              <Link href="/demo" className="hover:text-blue-600 font-medium">Demo</Link>
              <Link href="/login" className="hover:text-blue-600 font-medium">Login</Link>
              <Link href="/signup" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                Start Free Trial
              </Link>
            </div>
          </div>
        </nav>
        {children}
        <Toaster position="top-right" />
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-bold mb-4">LuxeBrain AI</h3>
                <p className="text-gray-400">AI-powered revenue growth for WooCommerce stores.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/pricing">Pricing</Link></li>
                  <li><Link href="/roi-calculator">ROI Calculator</Link></li>
                  <li><Link href="/case-studies">Case Studies</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Resources</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/docs">Documentation</Link></li>
                  <li><Link href="/demo">Request Demo</Link></li>
                  <li><a href="http://localhost:8000/docs">API Docs</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="mailto:support@paksait.com">Contact</a></li>
                  <li><Link href="/privacy">Privacy</Link></li>
                  <li><Link href="/terms">Terms</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
              <p>© 2024 Paksa IT Solutions. All Rights Reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
