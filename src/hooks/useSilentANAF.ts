/** @format */

import { useState, useCallback } from 'react';

interface SilentANAFResponse {
  success: boolean;
  message: string;
  authenticated?: boolean;
  authUrl?: string;
  requiresUserInteraction?: boolean;
  popupInstructions?: string;
  error?: string;
  details?: string;
}

export function useSilentANAF() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authenticateSilently = useCallback(async (): Promise<SilentANAFResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/anaf/silent-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: SilentANAFResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to authenticate with ANAF');
      }

      // If requires user interaction, redirect in same window
      if (data.requiresUserInteraction && data.authUrl) {
        // Redirect to ANAF auth URL in the same window
        window.location.href = data.authUrl;
        
        // Return a promise that resolves when user comes back
        return new Promise((resolve) => {
          // This will be handled by the callback page
          resolve({
            success: true,
            message: 'Redirecting to ANAF authentication...',
            requiresUserInteraction: true
          });
        });
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    authenticateSilently,
    loading,
    error
  };
}
