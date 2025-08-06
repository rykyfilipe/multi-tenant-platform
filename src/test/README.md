# Test Suite Documentation

## Overview

This test suite provides comprehensive unit testing for the multi-tenant platform application using **Vitest** and **Testing Library**. The tests are designed to achieve **100% code coverage** across all components, utilities, and hooks.

## Test Structure

```
src/
├── test/
│   ├── setup.ts                 # Global test setup and mocks
│   ├── test-runner.ts           # Custom test runner
│   └── README.md               # This file
├── lib/
│   └── __tests__/
│       ├── utils.test.ts        # Tests for utility functions
│       ├── planConstants.test.ts # Tests for plan constants
│       ├── columnTypes.test.ts  # Tests for column type definitions
│       └── validation.test.ts   # Tests for validation schemas
├── components/
│   ├── ui/
│   │   └── __tests__/
│   │       ├── button.test.tsx  # Tests for Button component
│   │       └── input.test.tsx   # Tests for Input component
│   └── auth/
│       └── __tests__/
│           └── AuthForm.test.tsx # Tests for AuthForm component
└── hooks/
    └── __tests__/
        └── usePlanLimits.test.ts # Tests for usePlanLimits hook
```

## Running Tests

### Prerequisites

Make sure you have all dependencies installed:

```bash
npm install
```

### Available Test Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- src/lib/__tests__/utils.test.ts

# Run tests matching a pattern
npm test -- --grep "Button"

# Run tests with UI
npm test -- --ui
```

### Coverage Reports

After running tests with coverage, you can find the reports in:

- **Text Report**: Displayed in the terminal
- **HTML Report**: `coverage/index.html` (open in browser)
- **LCOV Report**: `coverage/lcov.info` (for CI/CD integration)

## Test Categories

### 1. Utility Functions (`src/lib/__tests__/`)

#### `utils.test.ts`
- **cn() function**: Class name merging and conditional classes
- **colExists() function**: Column existence checking
- **Edge cases**: Null/undefined inputs, empty arrays, case sensitivity

#### `planConstants.test.ts`
- **PLAN_LIMITS**: All plan configurations (Starter, Pro, Business)
- **PLAN_FEATURES**: Feature descriptions and pricing
- **Helper functions**: getPlanLimits, getPlanFeatures, getMemoryLimitForPlan, getRowsLimitForPlan
- **Edge cases**: Unknown plans, null/undefined inputs

#### `columnTypes.test.ts`
- **Column type definitions**: All user-friendly column types
- **Property definitions**: Required, primary key properties
- **Helper functions**: getColumnTypeLabel, getPropertyLabel, getColumnTypeDescription, getPropertyDescription
- **Edge cases**: Unknown types, null inputs

#### `validation.test.ts`
- **Zod schemas**: Email, password, name, phone, database/table/column names
- **Input sanitization**: SQL injection and XSS prevention
- **Validation functions**: validateInput, validateAndSanitizeInput
- **Security**: SQL injection patterns, XSS patterns
- **Edge cases**: Invalid inputs, boundary conditions

### 2. UI Components (`src/components/ui/__tests__/`)

#### `button.test.tsx`
- **Rendering**: All variants (default, destructive, outline, secondary, ghost, link)
- **Sizes**: Default, small, large, icon
- **Props**: All HTML button attributes, custom className
- **Events**: Click, focus, blur, keyboard, mouse events
- **Accessibility**: ARIA attributes, keyboard navigation
- **Edge cases**: Empty children, ref forwarding, all event handlers

#### `input.test.tsx`
- **Input types**: All HTML input types (text, email, password, number, file, etc.)
- **Props**: All HTML input attributes, validation attributes
- **Events**: Change, input, focus, blur, keyboard, mouse, form events
- **Accessibility**: ARIA attributes, screen reader support
- **Styling**: All CSS classes, focus states, invalid states
- **Edge cases**: Controlled/uncontrolled components, file inputs, validation

### 3. Custom Components (`src/components/auth/__tests__/`)

#### `AuthForm.test.tsx`
- **Rendering**: Login/register tabs, OAuth integration
- **State management**: Tab switching, forgot password flow
- **User interactions**: Form submissions, navigation
- **Props passing**: Child component integration
- **Accessibility**: Proper heading structure, button roles
- **Edge cases**: Rapid interactions, multiple submissions

### 4. Custom Hooks (`src/hooks/__tests__/`)

#### `usePlanLimits.test.ts`
- **Initial state**: No session, session without user ID
- **Data fetching**: API calls, error handling, loading states
- **Limit checking**: All limit types, edge cases
- **Usage calculations**: Percentages, over-limit scenarios
- **Plan variations**: All subscription plans
- **Effect dependencies**: User ID changes, refetching

## Test Patterns

### Component Testing
```typescript
describe('ComponentName', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      // Test basic rendering
    });
  });

  describe('user interactions', () => {
    it('should handle click events', () => {
      // Test user interactions
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      // Test accessibility
    });
  });

  describe('edge cases', () => {
    it('should handle invalid props', () => {
      // Test edge cases
    });
  });
});
```

### Hook Testing
```typescript
describe('useHookName', () => {
  beforeEach(() => {
    // Setup mocks
  });

  describe('initial state', () => {
    it('should return initial values', () => {
      // Test initial state
    });
  });

  describe('data fetching', () => {
    it('should fetch data successfully', async () => {
      // Test async operations
    });
  });

  describe('return values', () => {
    it('should return expected structure', () => {
      // Test return values
    });
  });
});
```

### Utility Testing
```typescript
describe('functionName', () => {
  it('should handle valid inputs', () => {
    // Test normal cases
  });

  it('should handle edge cases', () => {
    // Test edge cases
  });

  it('should handle invalid inputs', () => {
    // Test error cases
  });
});
```

## Mocking Strategy

### Global Mocks (`src/test/setup.ts`)
- **Next.js**: Router, Image, Link components
- **External libraries**: Framer Motion, Recharts, Stripe
- **Browser APIs**: ResizeObserver, matchMedia
- **Authentication**: NextAuth session management

### Component Mocks
- **Child components**: Mocked to test parent component logic
- **External dependencies**: API calls, third-party services
- **Complex interactions**: Form submissions, navigation

## Coverage Goals

### 100% Coverage Targets
- **Statements**: Every line of code executed
- **Branches**: Every conditional branch taken
- **Functions**: Every function called
- **Lines**: Every line covered

### Coverage Exclusions
- **Configuration files**: `*.config.*`, `*.d.ts`
- **Build artifacts**: `dist/`, `build/`, `.next/`
- **Dependencies**: `node_modules/`
- **Database**: `prisma/`, `migrations/`

## Best Practices

### Test Organization
1. **Group related tests** using `describe` blocks
2. **Use descriptive test names** that explain the expected behavior
3. **Test one thing per test** for better isolation
4. **Arrange-Act-Assert** pattern for clear test structure

### Test Data
1. **Use realistic test data** that matches production scenarios
2. **Create reusable test utilities** for common setup
3. **Mock external dependencies** to isolate unit tests
4. **Test edge cases** and error conditions

### Accessibility Testing
1. **Test ARIA attributes** for screen reader support
2. **Verify keyboard navigation** for all interactive elements
3. **Check semantic HTML** structure
4. **Test focus management** for modals and forms

### Performance Testing
1. **Test component rendering** performance
2. **Verify memory leaks** in hooks and effects
3. **Test large data sets** for scalability
4. **Monitor bundle size** impact of components

## Continuous Integration

### GitHub Actions
```yaml
- name: Run Tests
  run: npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:coverage"
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Test setup errors**: Check `src/test/setup.ts` for missing mocks
2. **Component rendering issues**: Verify all required props are provided
3. **Async test failures**: Use `waitFor` for asynchronous operations
4. **Coverage gaps**: Check for untested conditional branches

### Debugging Tips

1. **Use `--reporter=verbose`** for detailed test output
2. **Run single test** with `--grep` to isolate issues
3. **Check coverage report** to identify uncovered code
4. **Use `console.log`** in tests for debugging (remove before commit)

## Contributing

### Adding New Tests
1. **Follow existing patterns** for consistency
2. **Achieve 100% coverage** for new code
3. **Test edge cases** and error conditions
4. **Update documentation** for new test categories

### Test Maintenance
1. **Update tests** when components change
2. **Refactor tests** for better maintainability
3. **Remove obsolete tests** for deleted code
4. **Keep mocks up to date** with dependency changes

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [React Testing Best Practices](https://react.dev/learn/testing)
- [Accessibility Testing Guide](https://www.w3.org/WAI/ARIA/apg/) 