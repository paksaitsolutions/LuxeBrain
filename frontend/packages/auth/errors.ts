/**
 * Auth Error Messages
 * Copyright © 2024 Paksa IT Solutions
 */

export const AUTH_ERRORS: Record<number, string> = {
  401: 'Invalid email or password',
  403: 'Email not verified. Please check your inbox',
  423: 'Account locked due to too many failed attempts',
  400: 'Invalid request. Please check your input',
  500: 'Server error. Please try again later',
};

export const getAuthErrorMessage = (statusCode: number, detail?: string): string => {
  if (detail?.includes('locked')) {
    return detail; // Use server message for lockout (includes time)
  }
  
  if (detail?.includes('verified')) {
    return AUTH_ERRORS[403];
  }
  
  return AUTH_ERRORS[statusCode] || 'An error occurred. Please try again';
};
