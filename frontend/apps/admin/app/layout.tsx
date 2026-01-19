import './globals.css';
import type { Metadata } from 'next';
import { ErrorBoundary } from '@luxebrain/ui/ErrorBoundary';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'LuxeBrain AI - Admin Panel',
  description: 'Admin Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
