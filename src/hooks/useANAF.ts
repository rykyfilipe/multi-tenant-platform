/** @format */

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';

export function useANAF() {
  const { user, tenant, token } = useApp();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      if (!user?.id || !tenant?.id || !token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/anaf/status', {
          credentials: 'include', // Include cookies for session authentication
        });
        const data = await response.json();
        
        if (data.success) {
          setIsAuthenticated(data.isAuthenticated);
        } else {
          setError(data.error || 'Failed to check authentication');
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Error checking ANAF authentication:', err);
        setError(err instanceof Error ? err.message : 'Failed to check authentication');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, [user?.id, tenant?.id, token]);

  const authenticate = async () => {
    if (!user?.id || !tenant?.id || !token) {
      throw new Error('User, tenant, or token not available');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/anaf/auth-url', {
        credentials: 'include', // Include cookies for session authentication
      });
      const data = await response.json();
      
      if (data.success) {
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.error || 'Failed to get auth URL');
      }
    } catch (err) {
      console.error('Error initiating ANAF authentication:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate authentication');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    if (!user?.id || !tenant?.id || !token) {
      throw new Error('User, tenant, or token not available');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/anaf/disconnect', {
        method: 'POST',
        credentials: 'include', // Include cookies for session authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsAuthenticated(false);
      } else {
        throw new Error(data.error || 'Failed to disconnect');
      }
    } catch (err) {
      console.error('Error disconnecting from ANAF:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isAuthenticated,
    isLoading,
    error,
    authenticate,
    disconnect,
  };
}
