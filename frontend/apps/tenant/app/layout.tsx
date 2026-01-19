import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LuxeBrain AI - Tenant Dashboard',
  description: 'AI-Driven eCommerce Automation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
