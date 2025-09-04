# Analytics Testing Suite

This directory contains comprehensive tests for the analytics system of the multi-tenant platform.

## 📁 Test Structure

```
tests/
├── unit/analytics/                    # Unit tests for individual components
│   ├── KPICard.test.tsx              # KPI Card component tests
│   ├── AnalyticsDashboard.test.tsx   # Main dashboard component tests
│   ├── useProcessedAnalyticsData.test.ts # Data processing hook tests
│   ├── chart-components.test.tsx     # Chart components tests
│   ├── data-processing.test.ts       # Data processing functions tests
│   ├── useDashboardData.test.ts      # Dashboard data hook tests
│   ├── chart-colors.test.ts          # Chart color utilities tests
│   └── advanced-analytics.test.ts    # Advanced analytics features tests
├── integration/analytics/             # Integration tests
│   ├── real-data-api.test.ts         # Real-time data API tests
│   └── analytics-system.test.ts      # Complete system integration tests
└── run-analytics-tests.ts            # Test runner script
```

## 🚀 Running Tests

### All Analytics Tests
```bash
npm run test:analytics
```

### With Coverage
```bash
npm run test:analytics:coverage
```

### Unit Tests Only
```bash
npm run test:analytics:unit
```

### Integration Tests Only
```bash
npm run test:analytics:integration
```

### Specific Test File
```bash
npm run test:analytics:file KPICard.test.tsx
```

## 📋 Test Categories

### Unit Tests

#### Component Tests
- **KPICard.test.tsx**: Tests for the KPI card component including:
  - Rendering with different props
  - Number formatting (K, M suffixes)
  - Trend indicators (increase/decrease/neutral)
  - Color themes
  - Animation delays

#### Hook Tests
- **useProcessedAnalyticsData.test.ts**: Tests for the main data processing hook:
  - Data processing pipeline
  - KPI calculations
  - Growth calculations
  - Distribution processing
  - Time series data generation
  - Performance metrics
  - Health score calculations
  - Error handling

- **useDashboardData.test.ts**: Tests for the dashboard data hook:
  - Data fetching
  - Loading states
  - Error handling
  - Token and tenant validation
  - Data refetching

#### Utility Tests
- **chart-colors.test.ts**: Tests for chart color utilities:
  - Color generation
  - Gradient generation
  - Status colors
  - Color consistency
  - Performance

- **data-processing.test.ts**: Tests for data processing functions:
  - KPI calculations
  - Growth calculations
  - Distribution calculations
  - Rankings processing
  - Time series data processing
  - Performance metrics processing
  - Health score calculations
  - Edge cases

- **advanced-analytics.test.ts**: Tests for advanced analytics features:
  - Metric types and enums
  - Insight generation
  - Trend calculations
  - Dashboard management
  - Data export
  - Error handling

### Integration Tests

#### API Tests
- **real-data-api.test.ts**: Tests for the real-time data API:
  - Authentication and authorization
  - Data fetching
  - Error handling
  - Data processing
  - Performance metrics

#### System Tests
- **analytics-system.test.ts**: Complete system integration tests:
  - End-to-end data flow
  - Component integration
  - Loading states
  - Error states
  - Empty data handling

## 🧪 Test Features

### Mocking Strategy
- **Components**: Mocked with simple div elements for testing
- **Hooks**: Mocked with jest.fn() for controlled testing
- **APIs**: Mocked with jest.fn() and mock responses
- **External Libraries**: Mocked (framer-motion, recharts)

### Test Data
- **Mock Data**: Comprehensive mock data for all analytics scenarios
- **Edge Cases**: Tests for empty data, null values, malformed data
- **Performance**: Tests for large datasets and performance metrics

### Coverage
- **Unit Tests**: 100% coverage for individual components and functions
- **Integration Tests**: End-to-end coverage for complete workflows
- **Error Handling**: Comprehensive error scenario testing

## 📊 Test Metrics

### Coverage Targets
- **Statements**: >95%
- **Branches**: >90%
- **Functions**: >95%
- **Lines**: >95%

### Performance Targets
- **Unit Tests**: <100ms per test file
- **Integration Tests**: <500ms per test file
- **Total Suite**: <30s

## 🔧 Test Configuration

### Jest Configuration
```javascript
{
  "testEnvironment": "jsdom",
  "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"],
  "moduleNameMapping": {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  "collectCoverageFrom": [
    "src/components/analytics/**/*.{ts,tsx}",
    "src/hooks/useProcessedAnalyticsData.ts",
    "src/hooks/useDashboardData.ts",
    "src/lib/chart-colors.ts",
    "src/lib/advanced-analytics.ts"
  ]
}
```

### Test Scripts
- **run-analytics-tests.ts**: Main test runner with options for different test types
- **Jest**: Used for actual test execution
- **tsx**: Used for running TypeScript test files

## 🐛 Debugging Tests

### Running Individual Tests
```bash
# Run specific test file
npm run test:analytics:file KPICard.test.tsx

# Run with verbose output
npx jest KPICard.test.tsx --verbose

# Run with watch mode
npx jest KPICard.test.tsx --watch
```

### Debug Mode
```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Coverage Reports
```bash
# Generate coverage report
npm run test:analytics:coverage

# View coverage report
open coverage/lcov-report/index.html
```

## 📝 Writing New Tests

### Test File Structure
```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  });

  it('should render correctly', () => {
    // Test implementation
  });

  it('should handle edge cases', () => {
    // Edge case testing
  });
});
```

### Best Practices
1. **Descriptive Test Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Structure tests with clear sections
3. **Mock External Dependencies**: Mock all external dependencies
4. **Test Edge Cases**: Include tests for edge cases and error scenarios
5. **Clean Up**: Clean up after each test
6. **Coverage**: Aim for high test coverage

### Test Data
- Use realistic test data that matches production scenarios
- Include edge cases (empty data, null values, large datasets)
- Test both positive and negative scenarios

## 🚨 Common Issues

### Mock Issues
- Ensure all external dependencies are properly mocked
- Check that mock functions return expected values
- Verify mock cleanup between tests

### Async Testing
- Use `waitFor` for async operations
- Properly handle promises in tests
- Test both success and error scenarios

### Component Testing
- Mock all child components
- Test props and state changes
- Verify event handlers

## 📈 Continuous Integration

### GitHub Actions
```yaml
- name: Run Analytics Tests
  run: npm run test:analytics:coverage
```

### Pre-commit Hooks
```bash
# Run analytics tests before commit
npm run test:analytics
```

## 🔄 Maintenance

### Regular Updates
- Update tests when components change
- Add tests for new features
- Remove obsolete tests
- Update mock data to match current API

### Performance Monitoring
- Monitor test execution time
- Optimize slow tests
- Remove redundant tests
- Update test data as needed

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
