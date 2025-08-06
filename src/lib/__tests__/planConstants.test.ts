import { describe, it, expect } from 'vitest';
import {
  PLAN_LIMITS,
  PLAN_FEATURES,
  getPlanLimits,
  getPlanFeatures,
  getMemoryLimitForPlan,
  getRowsLimitForPlan,
  type PlanLimits
} from '../planConstants';

describe('planConstants', () => {
  describe('PLAN_LIMITS', () => {
    it('should have correct Starter plan limits', () => {
      const starter = PLAN_LIMITS.Starter;
      expect(starter).toEqual({
        databases: 1,
        tables: 5,
        users: 2,
        apiTokens: 1,
        publicTables: 0,
        storage: 100,
        rows: 10000,
      });
    });

    it('should have correct Pro plan limits', () => {
      const pro = PLAN_LIMITS.Pro;
      expect(pro).toEqual({
        databases: 5,
        tables: 25,
        users: 10,
        apiTokens: 5,
        publicTables: 2,
        storage: 1024,
        rows: 100000,
      });
    });

    it('should have correct Business plan limits', () => {
      const business = PLAN_LIMITS.Business;
      expect(business).toEqual({
        databases: 999,
        tables: 999,
        users: 999,
        apiTokens: 10,
        publicTables: 10,
        storage: 5120,
        rows: 1000000,
      });
    });

    it('should have all required properties for each plan', () => {
      const requiredProperties: (keyof PlanLimits)[] = [
        'databases',
        'tables',
        'users',
        'apiTokens',
        'publicTables',
        'storage',
        'rows'
      ];

      Object.values(PLAN_LIMITS).forEach(plan => {
        requiredProperties.forEach(prop => {
          expect(plan).toHaveProperty(prop);
          expect(typeof plan[prop]).toBe('number');
        });
      });
    });
  });

  describe('PLAN_FEATURES', () => {
    it('should have correct Starter plan features', () => {
      const starter = PLAN_FEATURES.Starter;
      expect(starter).toEqual({
        databases: 1,
        tables: 5,
        users: 2,
        storage: "100 MB",
        rows: "10.000 rows",
        price: "$0/month",
      });
    });

    it('should have correct Pro plan features', () => {
      const pro = PLAN_FEATURES.Pro;
      expect(pro).toEqual({
        databases: 5,
        tables: 25,
        users: 10,
        storage: "1 GB",
        rows: "100.000 rows",
        price: "$29/month",
      });
    });

    it('should have correct Business plan features', () => {
      const business = PLAN_FEATURES.Business;
      expect(business).toEqual({
        databases: "Unlimited",
        tables: "Unlimited",
        users: "Unlimited",
        storage: "5 GB",
        rows: "1.000.000 rows",
        price: "$99/month",
      });
    });

    it('should have all required properties for each plan', () => {
      const requiredProperties = [
        'databases',
        'tables',
        'users',
        'storage',
        'rows',
        'price'
      ];

      Object.values(PLAN_FEATURES).forEach(plan => {
        requiredProperties.forEach(prop => {
          expect(plan).toHaveProperty(prop);
        });
      });
    });
  });

  describe('getPlanLimits', () => {
    it('should return Starter plan limits for null input', () => {
      const result = getPlanLimits(null);
      expect(result).toEqual(PLAN_LIMITS.Starter);
    });

    it('should return Starter plan limits for undefined input', () => {
      const result = getPlanLimits(undefined as any);
      expect(result).toEqual(PLAN_LIMITS.Starter);
    });

    it('should return Starter plan limits for empty string', () => {
      const result = getPlanLimits('');
      expect(result).toEqual(PLAN_LIMITS.Starter);
    });

    it('should return Starter plan limits for unknown plan', () => {
      const result = getPlanLimits('UnknownPlan');
      expect(result).toEqual(PLAN_LIMITS.Starter);
    });

    it('should return correct plan limits for valid plan names', () => {
      expect(getPlanLimits('Starter')).toEqual(PLAN_LIMITS.Starter);
      expect(getPlanLimits('Pro')).toEqual(PLAN_LIMITS.Pro);
      expect(getPlanLimits('Business')).toEqual(PLAN_LIMITS.Business);
    });

    it('should handle case-sensitive plan names', () => {
      const result = getPlanLimits('starter');
      expect(result).toEqual(PLAN_LIMITS.Starter);
    });
  });

  describe('getPlanFeatures', () => {
    it('should return Starter plan features for null input', () => {
      const result = getPlanFeatures(null);
      expect(result).toEqual(PLAN_FEATURES.Starter);
    });

    it('should return Starter plan features for undefined input', () => {
      const result = getPlanFeatures(undefined as any);
      expect(result).toEqual(PLAN_FEATURES.Starter);
    });

    it('should return Starter plan features for empty string', () => {
      const result = getPlanFeatures('');
      expect(result).toEqual(PLAN_FEATURES.Starter);
    });

    it('should return Starter plan features for unknown plan', () => {
      const result = getPlanFeatures('UnknownPlan');
      expect(result).toEqual(PLAN_FEATURES.Starter);
    });

    it('should return correct plan features for valid plan names', () => {
      expect(getPlanFeatures('Starter')).toEqual(PLAN_FEATURES.Starter);
      expect(getPlanFeatures('Pro')).toEqual(PLAN_FEATURES.Pro);
      expect(getPlanFeatures('Business')).toEqual(PLAN_FEATURES.Business);
    });

    it('should handle case-sensitive plan names', () => {
      const result = getPlanFeatures('starter');
      expect(result).toEqual(PLAN_FEATURES.Starter);
    });
  });

  describe('getMemoryLimitForPlan', () => {
    it('should return correct memory limit for Starter plan', () => {
      const result = getMemoryLimitForPlan('Starter');
      expect(result).toBe(100);
    });

    it('should return correct memory limit for Pro plan', () => {
      const result = getMemoryLimitForPlan('Pro');
      expect(result).toBe(1024);
    });

    it('should return correct memory limit for Business plan', () => {
      const result = getMemoryLimitForPlan('Business');
      expect(result).toBe(5120);
    });

    it('should return Starter memory limit for null input', () => {
      const result = getMemoryLimitForPlan(null);
      expect(result).toBe(100);
    });

    it('should return Starter memory limit for unknown plan', () => {
      const result = getMemoryLimitForPlan('UnknownPlan');
      expect(result).toBe(100);
    });

    it('should return Starter memory limit for empty string', () => {
      const result = getMemoryLimitForPlan('');
      expect(result).toBe(100);
    });
  });

  describe('getRowsLimitForPlan', () => {
    it('should return correct rows limit for Starter plan', () => {
      const result = getRowsLimitForPlan('Starter');
      expect(result).toBe(10000);
    });

    it('should return correct rows limit for Pro plan', () => {
      const result = getRowsLimitForPlan('Pro');
      expect(result).toBe(100000);
    });

    it('should return correct rows limit for Business plan', () => {
      const result = getRowsLimitForPlan('Business');
      expect(result).toBe(1000000);
    });

    it('should return Starter rows limit for null input', () => {
      const result = getRowsLimitForPlan(null);
      expect(result).toBe(10000);
    });

    it('should return Starter rows limit for unknown plan', () => {
      const result = getRowsLimitForPlan('UnknownPlan');
      expect(result).toBe(10000);
    });

    it('should return Starter rows limit for empty string', () => {
      const result = getRowsLimitForPlan('');
      expect(result).toBe(10000);
    });
  });
}); 