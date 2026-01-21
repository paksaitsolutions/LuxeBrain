import './globals.css';
import type { Metadata } from 'next';
import { ErrorBoundary } from '@luxebrain/ui/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import ImpersonationBanner from '../components/ImpersonationBanner';

export const metadata: Metadata = {
  title: 'LuxeBrain AI - Tenant Dashboard',
  description: 'AI-Driven eCommerce Automation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <ImpersonationBanner />
          {children}
        </ErrorBoundary>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
