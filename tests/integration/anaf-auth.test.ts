/**
 * ANAF Authentication Integration Tests
 * 
 * Tests the ANAF authentication module with proper OAuth2 flow
 * according to ANAF e-Factura documentation.
 */

import { ANAFAuth } from '@/lib/anaf/anafAuth';
import { ANAFOAuthService } from '@/lib/anaf/oauth-service';
import { ANAFAPIService } from '@/lib/anaf/anaf-api-service';

// Mock environment variables for testing
const mockEnv = {
  ANAF_CLIENT_ID: 'test-client-id',
  ANAF_CLIENT_SECRET: 'test-client-secret',
  ANAF_REDIRECT_URI: 'https://test.example.com/api/anaf/callback',
  ANAF_ENVIRONMENT: 'sandbox',
  ANAF_BASE_URL: 'https://api.anaf.ro/test/FCTEL/rest'
};

// Mock fetch for testing
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ANAF Authentication Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.ANAF_CLIENT_ID = mockEnv.ANAF_CLIENT_ID;
    process.env.ANAF_CLIENT_SECRET = mockEnv.ANAF_CLIENT_SECRET;
    process.env.ANAF_REDIRECT_URI = mockEnv.ANAF_REDIRECT_URI;
    process.env.ANAF_ENVIRONMENT = mockEnv.ANAF_ENVIRONMENT;
    process.env.ANAF_BASE_URL = mockEnv.ANAF_BASE_URL;
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.ANAF_CLIENT_ID;
    delete process.env.ANAF_CLIENT_SECRET;
    delete process.env.ANAF_REDIRECT_URI;
    delete process.env.ANAF_ENVIRONMENT;
    delete process.env.ANAF_BASE_URL;
  });

  describe('Configuration Validation', () => {
    it('should validate required environment variables', async () => {
      // Test with missing client ID
      delete process.env.ANAF_CLIENT_ID;
      
      const result = await ANAFAuth.getAccessToken({ userId: 1, tenantId: 1 });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('ANAF_CLIENT_ID environment variable is not set');
    });

    it('should validate missing client secret', async () => {
      delete process.env.ANAF_CLIENT_SECRET;
      
      const result = await ANAFAuth.getAccessToken({ userId: 1, tenantId: 1 });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('ANAF_CLIENT_SECRET environment variable is not set');
    });

    it('should validate missing redirect URI', async () => {
      delete process.env.ANAF_REDIRECT_URI;
      
      const result = await ANAFAuth.getAccessToken({ userId: 1, tenantId: 1 });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('ANAF_REDIRECT_URI environment variable is not set');
    });
  });

  describe('Client Credentials Flow', () => {
    it('should successfully obtain access token using client_credentials', async () => {
      // Mock successful ANAF response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          access_token: 'test-access-token-123',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'e-factura'
        }))
      });

      const result = await ANAFAuth.getAccessToken({ userId: 1, tenantId: 1 });

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('test-access-token-123');
      expect(result.tokenType).toBe('Bearer');
      expect(result.scope).toBe('e-factura');
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should handle ANAF authentication errors properly', async () => {
      // Mock ANAF error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve(JSON.stringify({
          error: 'invalid_client',
          error_description: 'Invalid client credentials'
        }))
      });

      const result = await ANAFAuth.getAccessToken({ userId: 1, tenantId: 1 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid client credentials');
    });

    it('should handle rate limiting errors', async () => {
      // Mock rate limit error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve(JSON.stringify({
          error: 'rate_limit_exceeded',
          error_description: 'Too many requests'
        }))
      });

      const result = await ANAFAuth.getAccessToken({ userId: 1, tenantId: 1 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('429 Too Many Requests');
    });

    it('should retry on network errors', async () => {
      // Mock network error first, then success
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({
            access_token: 'test-access-token-123',
            token_type: 'Bearer',
            expires_in: 3600,
            scope: 'e-factura'
          }))
        });

      const result = await ANAFAuth.getAccessToken({ 
        userId: 1, 
        tenantId: 1,
        maxRetries: 2
      });

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Authorization Code Flow', () => {
    it('should generate correct authorization URL', async () => {
      const authUrl = await ANAFAuth.getAuthorizationUrl(1, 1);

      expect(authUrl).toContain('https://logincert.anaf.ro/anaf-oauth2/v1/authorize');
      expect(authUrl).toContain('client_id=test-client-id');
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('scope=e-factura');
      expect(authUrl).toContain('redirect_uri=');
      expect(authUrl).toContain('state=');
    });

    it('should exchange authorization code for token', async () => {
      // Mock successful token exchange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          access_token: 'test-access-token-456',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'e-factura'
        }))
      });

      const result = await ANAFAuth.getAuthorizationCodeToken('test-code-123', 1, 1);

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('test-access-token-456');
      expect(result.tokenType).toBe('Bearer');
    });

    it('should validate state parameter', () => {
      const state = 'dGVzdDoxOjE2MzQ1Njc4OTAxMjM6YWJjZGVm';
      const decoded = Buffer.from(state, 'base64').toString();
      
      // This should be a valid state format: userId:tenantId:timestamp:random
      const parts = decoded.split(':');
      expect(parts).toHaveLength(4);
      expect(parts[0]).toBe('test');
      expect(parts[1]).toBe('1');
    });
  });

  describe('Connectivity Tests', () => {
    it('should test basic connectivity without authentication', async () => {
      // Mock TestOauth response (401 is expected for unauthenticated requests)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      });

      const result = await ANAFAuth.testConnectivity('Test Connectivity');

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('test-connectivity-success');
    });

    it('should test authenticated connectivity', async () => {
      // Mock successful token request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          access_token: 'test-access-token-789',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'e-factura'
        }))
      });

      // Mock successful authenticated test
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('Authenticated test successful')
      });

      const result = await ANAFAuth.testAuthenticatedConnectivity(1, 1, 'Test Auth');

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('authenticated-test-success');
    });
  });

  describe('OAuth Service Integration', () => {
    it('should work with OAuth service wrapper', async () => {
      // Mock successful token request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          access_token: 'test-access-token-oauth',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'e-factura'
        }))
      });

      const token = await ANAFOAuthService.getValidAccessToken(1, 1);

      expect(token).toBe('test-access-token-oauth');
    });

    it('should generate authorization URL through OAuth service', async () => {
      const authUrl = await ANAFOAuthService.getAuthUrl(1, 1);

      expect(authUrl).toContain('https://logincert.anaf.ro/anaf-oauth2/v1/authorize');
      expect(authUrl).toContain('client_id=test-client-id');
    });
  });

  describe('API Service Integration', () => {
    it('should test connectivity through API service', async () => {
      // Mock TestOauth response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      });

      const result = await ANAFAPIService.testConnectivity('API Test');

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
    });

    it('should test authenticated connectivity through API service', async () => {
      // Mock successful token request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          access_token: 'test-access-token-api',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'e-factura'
        }))
      });

      // Mock successful authenticated test
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('API authenticated test successful')
      });

      const result = await ANAFAPIService.testAuthenticatedConnectivity(1, 1, 'API Auth Test');

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      // Mock timeout error
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

      const result = await ANAFAuth.getAccessToken({ 
        userId: 1, 
        tenantId: 1,
        maxRetries: 1
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to obtain access token');
    });

    it('should handle malformed JSON responses', async () => {
      // Mock malformed JSON response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('Invalid JSON response')
      });

      const result = await ANAFAuth.getAccessToken({ userId: 1, tenantId: 1 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to obtain access token');
    });

    it('should handle missing access token in response', async () => {
      // Mock response without access_token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'e-factura'
        }))
      });

      const result = await ANAFAuth.getAccessToken({ userId: 1, tenantId: 1 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid token response from ANAF: missing access_token');
    });
  });

  describe('Security', () => {
    it('should not log sensitive information', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          access_token: 'sensitive-token-123',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'e-factura'
        }))
      });

      await ANAFAuth.getAccessToken({ userId: 1, tenantId: 1 });

      // Check that sensitive information is not logged
      const logCalls = consoleSpy.mock.calls;
      const sensitiveData = logCalls.some(call => 
        call.some(arg => 
          typeof arg === 'string' && 
          (arg.includes('sensitive-token-123') || arg.includes('test-client-secret'))
        )
      );

      expect(sensitiveData).toBe(false);
      consoleSpy.mockRestore();
    });

    it('should validate state parameter format', () => {
      const validState = ANAFAuth.validateState('dGVzdDoxOjE2MzQ1Njc4OTAxMjM6YWJjZGVm');
      const invalidState = ANAFAuth.validateState('invalid-state');

      expect(validState).toEqual({ userId: 1, tenantId: 1 });
      expect(invalidState).toBeNull();
    });
  });
});
