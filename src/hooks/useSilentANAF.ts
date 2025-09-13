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

      // If requires user interaction, open popup
      if (data.requiresUserInteraction && data.authUrl) {
        return new Promise((resolve, reject) => {
          const popup = window.open(
            data.authUrl,
            'anaf-auth',
            'width=600,height=700,scrollbars=yes,resizable=yes'
          );

          if (!popup) {
            reject(new Error('Popup blocked. Please allow popups for this site.'));
            return;
          }

          // Listen for popup close or message
          const checkClosed = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkClosed);
              // Check if authentication was successful
              setTimeout(() => {
                resolve({
                  success: true,
                  message: 'Authentication completed. Please refresh the page.',
                  authenticated: true
                });
              }, 1000);
            }
          }, 1000);

          // Listen for messages from popup
          const messageHandler = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            
            if (event.data.type === 'ANAF_AUTH_SUCCESS') {
              clearInterval(checkClosed);
              popup.close();
              window.removeEventListener('message', messageHandler);
              resolve({
                success: true,
                message: 'Authentication successful',
                authenticated: true
              });
            } else if (event.data.type === 'ANAF_AUTH_ERROR') {
              clearInterval(checkClosed);
              popup.close();
              window.removeEventListener('message', messageHandler);
              reject(new Error(event.data.error || 'Authentication failed'));
            }
          };

          window.addEventListener('message', messageHandler);

          // Cleanup after 5 minutes
          setTimeout(() => {
            if (!popup.closed) {
              popup.close();
              clearInterval(checkClosed);
              window.removeEventListener('message', messageHandler);
              reject(new Error('Authentication timeout'));
            }
          }, 300000);
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
