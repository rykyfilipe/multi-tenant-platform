/** @format */

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { ANAFOAuthService } from '@/lib/anaf/oauth-service';

export function useANAF() {
  const { user, tenant } = useApp();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      if (!user?.id || !tenant?.id) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const authenticated = await ANAFOAuthService.isAuthenticated(user.id, tenant.id);
        setIsAuthenticated(authenticated);
      } catch (err) {
        console.error('Error checking ANAF authentication:', err);
        setError(err instanceof Error ? err.message : 'Failed to check authentication');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, [user?.id, tenant?.id]);

  const authenticate = async () => {
    if (!user?.id || !tenant?.id) {
      throw new Error('User or tenant not available');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const authUrl = await ANAFOAuthService.getAuthUrl(user.id, tenant.id);
      window.location.href = authUrl;
    } catch (err) {
      console.error('Error initiating ANAF authentication:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate authentication');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    if (!user?.id || !tenant?.id) {
      throw new Error('User or tenant not available');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await ANAFOAuthService.revokeAccess(user.id, tenant.id);
      setIsAuthenticated(false);
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
