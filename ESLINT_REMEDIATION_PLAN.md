# ESLint Remediation Plan - Phase 1

## Critical Errors (Must Fix - Breaking Build)
1. **Duplicate Imports** (4 files)
   - `src/components/users/UserManagementGrid.tsx` - Line 21
   - `src/hooks/usePlanLimits.ts` - Line 7
   - `src/lib/auth.ts` - Line 18
   - `src/lib/cached-operations.ts` - Line 4
   - `src/lib/planLimits.ts` - Line 6
   - `src/middleware.ts` - Line 4

2. **Unsafe Function Type** (2 files)
   - `src/lib/api-rate-limiting.ts` - Line 217
   - `src/lib/rate-limiting.ts` - Line 194

3. **Require Import** (1 file)
   - `src/lib/api-security.ts` - Line 69

## High Priority Warnings (Security & Performance)
1. **Console Statements** (100+ instances) - Replace with proper logging
2. **Explicit Any Types** (200+ instances) - Add proper typing
3. **Non-null Assertions** (50+ instances) - Add proper null checks
4. **Unused Variables** (100+ instances) - Remove or use

## Medium Priority (Code Quality)
1. **Missing Dependencies in useEffect** (20+ instances)
2. **Unescaped Entities** (5 instances)
3. **Image Optimization** (2 instances)

## Implementation Strategy

### Phase 1A: Fix Critical Errors (Day 1)
- Fix all duplicate imports
- Fix unsafe function types
- Fix require imports

### Phase 1B: Security & Performance (Day 2-3)
- Replace console statements with proper logging
- Add proper error handling
- Fix non-null assertions

### Phase 1C: Code Quality (Day 4-5)
- Fix TypeScript any types
- Remove unused variables
- Fix React hooks dependencies

## Success Metrics
- Zero critical errors
- < 50 warnings total
- Build passes without ESLint errors
- No security vulnerabilities
