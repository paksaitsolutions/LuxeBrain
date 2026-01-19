/**
 * Session Timeout Handler
 * Copyright © 2024 Paksa IT Solutions
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout

export function SessionTimeout() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 minutes in seconds

  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    let warningTimer: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;

    const resetTimers = () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      clearInterval(countdownInterval);
      setShowWarning(false);

      warningTimer = setTimeout(() => {
        setShowWarning(true);
        setTimeLeft(5 * 60);
        
        countdownInterval = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              handleLogout();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, INACTIVITY_TIMEOUT - WARNING_TIME);

      inactivityTimer = setTimeout(() => {
        handleLogout();
      }, INACTIVITY_TIMEOUT);
    };

    const handleLogout = async () => {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/login?reason=timeout');
    };

    const handleActivity = () => {
      if (!showWarning) {
        resetTimers();
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    resetTimers();

    return () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      clearInterval(countdownInterval);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [router, showWarning]);

  const handleStayLoggedIn = () => {
    setShowWarning(false);
    // Trigger activity to reset timers
    document.dispatchEvent(new Event('mousedown'));
  };

  if (!showWarning) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md shadow-xl">
        <h3 className="text-lg font-bold mb-2">Session Timeout Warning</h3>
        <p className="text-gray-600 mb-4">
          Your session will expire in {minutes}:{seconds.toString().padStart(2, '0')} due to inactivity.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleStayLoggedIn}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Stay Logged In
          </button>
          <button
            onClick={() => router.push('/login')}
            className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
}
