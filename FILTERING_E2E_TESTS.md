# End-to-End Tests for Filtering System

This document provides comprehensive testing instructions for the filtering system, including both automated tests and manual testing procedures.

## Test Environment Setup

1. **Database Setup**: Ensure you have a test database with sample data
2. **API Endpoint**: `GET /api/tenants/[tenantId]/databases/[databaseId]/tables/[tableId]/rows`
3. **Authentication**: Include proper authentication headers

## Test Data Requirements

Create a test table with the following columns and sample data:

### Sample Table Structure
```sql
-- Text columns
name (text): "John Doe", "Jane Smith", "Bob Johnson", "Alice Brown"
email (text): "john@example.com", "jane@example.com", "bob@example.com", "alice@example.com"

-- Number columns  
age (number): 25, 30, 35, 40
salary (number): 50000, 60000, 70000, 80000

-- Date columns
birth_date (date): "1990-01-15", "1985-05-20", "1980-12-10", "1975-08-25"
created_at (datetime): "2023-01-01T10:00:00Z", "2023-02-15T14:30:00Z", "2023-03-20T09:15:00Z", "2023-04-10T16:45:00Z"

-- Boolean columns
is_active (boolean): true, false, true, false

-- JSON columns
metadata (json): {"department": "IT", "level": "senior"}, {"department": "HR", "level": "junior"}, {"department": "Finance", "level": "manager"}, {"department": "IT", "level": "director"}
```

## Test Cases

### 1. Text Operators

#### 1.1 Contains Operator
```json
{
  "filters": [
    {
      "columnId": 1,
      "columnName": "name",
      "columnType": "text",
      "operator": "contains",
      "value": "John"
    }
  ]
}
```
**Expected**: Returns rows where name contains "John"

#### 1.2 Starts With Operator
```json
{
  "filters": [
    {
      "columnId": 1,
      "columnName": "name",
      "columnType": "text",
      "operator": "starts_with",
      "value": "Jane"
    }
  ]
}
```
**Expected**: Returns rows where name starts with "Jane"

#### 1.3 Ends With Operator
```json
{
  "filters": [
    {
      "columnId": 1,
      "columnName": "name",
      "columnType": "text",
      "operator": "ends_with",
      "value": "Smith"
    }
  ]
}
```
**Expected**: Returns rows where name ends with "Smith"

#### 1.4 Equals Operator
```json
{
  "filters": [
    {
      "columnId": 1,
      "columnName": "name",
      "columnType": "text",
      "operator": "equals",
      "value": "John Doe"
    }
  ]
}
```
**Expected**: Returns exact match for "John Doe"

#### 1.5 Not Equals Operator
```json
{
  "filters": [
    {
      "columnId": 1,
      "columnName": "name",
      "columnType": "text",
      "operator": "not_equals",
      "value": "John Doe"
    }
  ]
}
```
**Expected**: Returns all rows except "John Doe"

#### 1.6 Regex Operator
```json
{
  "filters": [
    {
      "columnId": 1,
      "columnName": "name",
      "columnType": "text",
      "operator": "regex",
      "value": "^J.*"
    }
  ]
}
```
**Expected**: Returns rows where name starts with "J"

### 2. Number Operators

#### 2.1 Greater Than Operator
```json
{
  "filters": [
    {
      "columnId": 3,
      "columnName": "age",
      "columnType": "number",
      "operator": "greater_than",
      "value": 30
    }
  ]
}
```
**Expected**: Returns rows where age > 30

#### 2.2 Less Than Operator
```json
{
  "filters": [
    {
      "columnId": 3,
      "columnName": "age",
      "columnType": "number",
      "operator": "less_than",
      "value": 35
    }
  ]
}
```
**Expected**: Returns rows where age < 35

#### 2.3 Greater Than or Equal Operator
```json
{
  "filters": [
    {
      "columnId": 3,
      "columnName": "age",
      "columnType": "number",
      "operator": "greater_than_or_equal",
      "value": 30
    }
  ]
}
```
**Expected**: Returns rows where age >= 30

#### 2.4 Less Than or Equal Operator
```json
{
  "filters": [
    {
      "columnId": 3,
      "columnName": "age",
      "columnType": "number",
      "operator": "less_than_or_equal",
      "value": 35
    }
  ]
}
```
**Expected**: Returns rows where age <= 35

#### 2.5 Between Operator
```json
{
  "filters": [
    {
      "columnId": 3,
      "columnName": "age",
      "columnType": "number",
      "operator": "between",
      "value": 25,
      "secondValue": 35
    }
  ]
}
```
**Expected**: Returns rows where age is between 25 and 35

#### 2.6 Not Between Operator
```json
{
  "filters": [
    {
      "columnId": 3,
      "columnName": "age",
      "columnType": "number",
      "operator": "not_between",
      "value": 25,
      "secondValue": 35
    }
  ]
}
```
**Expected**: Returns rows where age is NOT between 25 and 35

### 3. Date Operators

#### 3.1 Today Operator
```json
{
  "filters": [
    {
      "columnId": 5,
      "columnName": "created_at",
      "columnType": "datetime",
      "operator": "today",
      "value": null
    }
  ]
}
```
**Expected**: Returns rows created today

#### 3.2 Yesterday Operator
```json
{
  "filters": [
    {
      "columnId": 5,
      "columnName": "created_at",
      "columnType": "datetime",
      "operator": "yesterday",
      "value": null
    }
  ]
}
```
**Expected**: Returns rows created yesterday

#### 3.3 This Week Operator
```json
{
  "filters": [
    {
      "columnId": 5,
      "columnName": "created_at",
      "columnType": "datetime",
      "operator": "this_week",
      "value": null
    }
  ]
}
```
**Expected**: Returns rows created this week

#### 3.4 Last Week Operator
```json
{
  "filters": [
    {
      "columnId": 5,
      "columnName": "created_at",
      "columnType": "datetime",
      "operator": "last_week",
      "value": null
    }
  ]
}
```
**Expected**: Returns rows created last week

#### 3.5 This Month Operator
```json
{
  "filters": [
    {
      "columnId": 5,
      "columnName": "created_at",
      "columnType": "datetime",
      "operator": "this_month",
      "value": null
    }
  ]
}
```
**Expected**: Returns rows created this month

#### 3.6 Last Month Operator
```json
{
  "filters": [
    {
      "columnId": 5,
      "columnName": "created_at",
      "columnType": "datetime",
      "operator": "last_month",
      "value": null
    }
  ]
}
```
**Expected**: Returns rows created last month

#### 3.7 This Year Operator
```json
{
  "filters": [
    {
      "columnId": 5,
      "columnName": "created_at",
      "columnType": "datetime",
      "operator": "this_year",
      "value": null
    }
  ]
}
```
**Expected**: Returns rows created this year

#### 3.8 Last Year Operator
```json
{
  "filters": [
    {
      "columnId": 5,
      "columnName": "created_at",
      "columnType": "datetime",
      "operator": "last_year",
      "value": null
    }
  ]
}
```
**Expected**: Returns rows created last year

#### 3.9 Before Operator
```json
{
  "filters": [
    {
      "columnId": 5,
      "columnName": "created_at",
      "columnType": "datetime",
      "operator": "before",
      "value": "2023-03-01T00:00:00Z"
    }
  ]
}
```
**Expected**: Returns rows created before March 1, 2023

#### 3.10 After Operator
```json
{
  "filters": [
    {
      "columnId": 5,
      "columnName": "created_at",
      "columnType": "datetime",
      "operator": "after",
      "value": "2023-02-01T00:00:00Z"
    }
  ]
}
```
**Expected**: Returns rows created after February 1, 2023

### 4. Boolean Operators

#### 4.1 Equals True
```json
{
  "filters": [
    {
      "columnId": 7,
      "columnName": "is_active",
      "columnType": "boolean",
      "operator": "equals",
      "value": true
    }
  ]
}
```
**Expected**: Returns rows where is_active is true

#### 4.2 Equals False
```json
{
  "filters": [
    {
      "columnId": 7,
      "columnName": "is_active",
      "columnType": "boolean",
      "operator": "equals",
      "value": false
    }
  ]
}
```
**Expected**: Returns rows where is_active is false

### 5. Empty Value Operators

#### 5.1 Is Empty Operator
```json
{
  "filters": [
    {
      "columnId": 1,
      "columnName": "name",
      "columnType": "text",
      "operator": "is_empty",
      "value": null
    }
  ]
}
```
**Expected**: Returns rows where name is empty/null

#### 5.2 Is Not Empty Operator
```json
{
  "filters": [
    {
      "columnId": 1,
      "columnName": "name",
      "columnType": "text",
      "operator": "is_not_empty",
      "value": null
    }
  ]
}
```
**Expected**: Returns rows where name is not empty/null

### 6. JSON Operators

#### 6.1 Contains Operator (JSON)
```json
{
  "filters": [
    {
      "columnId": 8,
      "columnName": "metadata",
      "columnType": "json",
      "operator": "contains",
      "value": {"department": "IT"}
    }
  ]
}
```
**Expected**: Returns rows where metadata contains department "IT"

#### 6.2 Not Contains Operator (JSON)
```json
{
  "filters": [
    {
      "columnId": 8,
      "columnName": "metadata",
      "columnType": "json",
      "operator": "not_contains",
      "value": {"department": "IT"}
    }
  ]
}
```
**Expected**: Returns rows where metadata does not contain department "IT"

### 7. Multiple Filters

#### 7.1 AND Logic
```json
{
  "filters": [
    {
      "columnId": 1,
      "columnName": "name",
      "columnType": "text",
      "operator": "contains",
      "value": "John"
    },
    {
      "columnId": 3,
      "columnName": "age",
      "columnType": "number",
      "operator": "greater_than",
      "value": 25
    }
  ]
}
```
**Expected**: Returns rows where name contains "John" AND age > 25

### 8. Global Search

#### 8.1 Global Search Test
```json
{
  "globalSearch": "John"
}
```
**Expected**: Returns rows where any text field contains "John"

## Postman Collection

Create a Postman collection with the following structure:

### Environment Variables
- `baseUrl`: Your API base URL
- `tenantId`: Test tenant ID
- `databaseId`: Test database ID
- `tableId`: Test table ID
- `authToken`: Authentication token

### Collection Structure
```
Filtering System Tests
├── Setup
│   ├── Create Test Table
│   └── Insert Test Data
├── Text Operators
│   ├── Contains
│   ├── Starts With
│   ├── Ends With
│   ├── Equals
│   ├── Not Equals
│   └── Regex
├── Number Operators
│   ├── Greater Than
│   ├── Less Than
│   ├── Greater Than or Equal
│   ├── Less Than or Equal
│   ├── Between
│   └── Not Between
├── Date Operators
│   ├── Today
│   ├── Yesterday
│   ├── This Week
│   ├── Last Week
│   ├── This Month
│   ├── Last Month
│   ├── This Year
│   ├── Last Year
│   ├── Before
│   └── After
├── Boolean Operators
│   ├── Equals True
│   └── Equals False
├── Empty Value Operators
│   ├── Is Empty
│   └── Is Not Empty
├── JSON Operators
│   ├── Contains
│   └── Not Contains
├── Multiple Filters
│   └── AND Logic
└── Global Search
    └── Global Search Test
```

## Automated Test Script

Create a test script that can be run with `npm test`:

```javascript
// tests/e2e/filtering.test.js
describe('Filtering System E2E Tests', () => {
  let testTableId;
  let testData;

  beforeAll(async () => {
    // Setup test table and data
    testTableId = await createTestTable();
    testData = await insertTestData(testTableId);
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData(testTableId);
  });

  describe('Text Operators', () => {
    test('contains operator should return matching rows', async () => {
      const response = await request(app)
        .get(`/api/tenants/${tenantId}/databases/${databaseId}/tables/${testTableId}/rows`)
        .query({
          filters: JSON.stringify([{
            columnId: 1,
            columnName: 'name',
            columnType: 'text',
            operator: 'contains',
            value: 'John'
          }])
        });

      expect(response.status).toBe(200);
      expect(response.body.rows).toHaveLength(1);
      expect(response.body.rows[0].name).toContain('John');
    });

    // Add more text operator tests...
  });

  // Add more test suites for other operator types...
});
```

## Manual Testing Checklist

### Frontend UI Testing
- [ ] Operators without input (today, yesterday, is_empty, etc.) do not show input fields
- [ ] Operators with input show appropriate input fields based on column type
- [ ] Date operators show date picker for date columns
- [ ] Number operators show number input for number columns
- [ ] Text operators show text input for text columns
- [ ] Boolean operators show dropdown for boolean columns
- [ ] JSON operators show JSON input for JSON columns
- [ ] Multiple filters can be added and removed
- [ ] Filter results update in real-time
- [ ] Clear all filters button works
- [ ] Global search works across all text fields

### Backend API Testing
- [ ] All operators return correct results
- [ ] Invalid operators are rejected with proper error messages
- [ ] Invalid column types are rejected
- [ ] Invalid values are rejected with proper validation messages
- [ ] Multiple filters work with AND logic
- [ ] Global search works correctly
- [ ] Pagination works with filters
- [ ] Sorting works with filters

### Performance Testing
- [ ] Large datasets filter quickly (< 1 second)
- [ ] Complex queries with multiple filters perform well
- [ ] Global search on large datasets is responsive
- [ ] Memory usage remains reasonable during filtering

## Error Handling Tests

### Invalid Input Tests
- [ ] Empty filter array
- [ ] Invalid column ID
- [ ] Invalid operator for column type
- [ ] Missing required values for operators that need them
- [ ] Invalid date formats
- [ ] Invalid number formats
- [ ] Invalid JSON formats
- [ ] SQL injection attempts
- [ ] XSS attempts in filter values

### Edge Cases
- [ ] Very large filter values
- [ ] Special characters in filter values
- [ ] Unicode characters in filter values
- [ ] Empty strings vs null values
- [ ] Date boundaries (start/end of day, month, year)
- [ ] Timezone handling for date filters

## Success Criteria

All tests should pass with the following criteria:
1. **Functionality**: All operators work as expected
2. **Performance**: Queries complete within acceptable time limits
3. **Security**: No SQL injection or XSS vulnerabilities
4. **Usability**: UI is intuitive and responsive
5. **Reliability**: System handles edge cases gracefully
6. **Consistency**: Frontend and backend behavior is synchronized

## Troubleshooting

### Common Issues
1. **Date filters not working**: Check timezone handling and date format
2. **Number filters returning wrong results**: Check value coercion and type casting
3. **Text filters case sensitivity**: Verify ILIKE vs LIKE usage
4. **JSON filters not working**: Check JSONB operator usage and value formatting
5. **Performance issues**: Check database indexes and query optimization

### Debug Tools
- Database query logs
- API request/response logs
- Frontend console logs
- Network tab in browser dev tools
- Database query execution plans
