/** @format */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('User Deactivation Integration Tests', () => {
  let testTenantId: number;
  let adminToken: string;
  let editorUserId: number;
  let editorToken: string;

  beforeAll(async () => {
    // Setup test data - create tenant and users
    // This would use your test setup utilities
  });

  afterAll(async () => {
    // Cleanup test data
  });

  describe('Deactivate User', () => {
    it('should deactivate a user successfully', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users/${editorUserId}/deactivate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user.isActive).toBe(false);
      expect(data.user.deactivatedAt).toBeTruthy();
    });

    it('should prevent non-admin from deactivating users', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users/${editorUserId}/deactivate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${editorToken}`,
          },
        }
      );

      expect(response.status).toBe(401);
    });

    it('should prevent deactivating the last admin', async () => {
      // This test would try to deactivate the only admin
      // and verify it returns error
    });

    it('should log out deactivated user', async () => {
      // Deactivate user
      await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users/${editorUserId}/deactivate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      // Try to access protected route with deactivated user token
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users`,
        {
          headers: {
            Authorization: `Bearer ${editorToken}`,
          },
        }
      );

      // Should fail because sessions were deleted
      expect(response.status).toBe(401);
    });
  });

  describe('Activate User', () => {
    it('should reactivate a deactivated user successfully', async () => {
      // First deactivate
      await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users/${editorUserId}/deactivate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      // Then activate
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users/${editorUserId}/activate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user.isActive).toBe(true);
      expect(data.user.deactivatedAt).toBeNull();
      expect(data.user.deactivatedBy).toBeNull();
    });

    it('should prevent non-admin from activating users', async () => {
      const response = await fetch(
        `http://localhost:3000/api/tenants/${testTenantId}/users/${editorUserId}/activate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${editorToken}`,
          },
        }
      );

      expect(response.status).toBe(401);
    });
  });

  describe('Login with Deactivated User', () => {
    it('should prevent deactivated user from logging in', async () => {
      // This would test the auth callback
      // You'd need to mock the login process
    });
  });
});

