/**
 * Network Error Recovery UI
 * Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
 */

import { useState, useEffect } from "react";

interface NetworkErrorProps {
  error: Error;
  onRetry: () => void;
  maxRetries?: number;
}

export function NetworkError({ error, onRetry, maxRetries = 3 }: NetworkErrorProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isRetrying) {
      handleRetry();
    }
  }, [countdown, isRetrying]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
      setRetryCount(0);
      setIsRetrying(false);
    } catch (err) {
      setRetryCount(retryCount + 1);
      setIsRetrying(false);
      
      if (retryCount < maxRetries - 1) {
        // Exponential backoff: 2^retryCount seconds
        const delay = Math.pow(2, retryCount);
        setCountdown(delay);
      }
    }
  };

  const handleManualRetry = () => {
    setRetryCount(0);
    setCountdown(0);
    handleRetry();
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
      <div className="text-red-600 text-4xl mb-4">⚠️</div>
      <h3 className="text-xl font-bold text-red-900 mb-2">Network Error</h3>
      <p className="text-red-700 mb-4 text-center">{error.message}</p>
      
      {retryCount < maxRetries ? (
        <>
          {countdown > 0 ? (
            <p className="text-sm text-red-600 mb-4">
              Auto-retrying in {countdown} second{countdown !== 1 ? "s" : ""}...
            </p>
          ) : (
            <button
              onClick={handleManualRetry}
              disabled={isRetrying}
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isRetrying ? "Retrying..." : "Retry Now"}
            </button>
          )}
          <p className="text-xs text-gray-600 mt-2">
            Attempt {retryCount + 1} of {maxRetries}
          </p>
        </>
      ) : (
        <div className="text-center">
          <p className="text-red-700 mb-4">
            Maximum retry attempts reached. Please check your connection and try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      )}
    </div>
  );
}

export function useNetworkError() {
  const [error, setError] = useState<Error | null>(null);

  const handleError = (err: Error) => {
    if (err.message.includes("network") || err.message.includes("fetch")) {
      setError(err);
    }
  };

  const clearError = () => setError(null);

  return { error, handleError, clearError };
}
