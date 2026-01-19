/**
 * Password Strength Meter
 * Copyright © 2024 Paksa IT Solutions
 */

import React from 'react';

interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const calculateStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0;
    
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    
    const common = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (common.some(c => pwd.toLowerCase().includes(c))) score = Math.max(0, score - 2);
    
    if (score <= 1) return { score, label: 'Weak', color: '#ef4444' };
    if (score <= 3) return { score, label: 'Fair', color: '#f59e0b' };
    if (score <= 4) return { score, label: 'Good', color: '#3b82f6' };
    return { score, label: 'Strong', color: '#10b981' };
  };

  if (!password) return null;

  const { score, label, color } = calculateStrength(password);
  const width = `${(score / 5) * 100}%`;

  return (
    <div className="mt-2">
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full transition-all duration-300" 
          style={{ width, backgroundColor: color }}
        />
      </div>
      <p className="text-sm mt-1" style={{ color }}>
        {label}
      </p>
    </div>
  );
};
