'use client';

import { useEffect, useState } from 'react';

export default function ImpersonationBanner() {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    checkImpersonation();
  }, []);

  const checkImpersonation = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.impersonation) {
          setIsImpersonating(true);
          setAdminEmail(payload.sub);
        }
      } catch (e) {}
    }
  };

  const exitImpersonation = async () => {
    try {
      const originalToken = localStorage.getItem('original_token');
      if (originalToken) {
        const token = localStorage.getItem('token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/tenants/impersonate/exit`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        localStorage.setItem('token', originalToken);
        localStorage.removeItem('original_token');
        window.location.href = 'http://localhost:3001/tenants';
      }
    } catch (error) {
      console.error('Failed to exit impersonation:', error);
    }
  };

  if (!isImpersonating) return null;

  return (
    <div className="bg-orange-500 text-white px-6 py-3 flex justify-between items-center fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-3">
        <span className="font-bold">⚠️ ADMIN IMPERSONATION MODE</span>
        <span className="text-sm">Viewing as tenant • Admin: {adminEmail}</span>
      </div>
      <button
        onClick={exitImpersonation}
        className="px-4 py-2 bg-white text-orange-600 rounded hover:bg-gray-100 font-medium"
      >
        Exit & Return to Admin
      </button>
    </div>
  );
}
