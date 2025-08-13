<!-- @format -->

# YDV Public API Guide

## Overview

The YDV Public API provides secure, scalable access to your multi-tenant data
management platform. This API is designed for developers who need to integrate
external applications, mobile apps, or third-party services with your YDV
instance.

## Key Features

- **Multi-tenant Architecture**: Isolated data environments for different
  clients
- **Advanced Security**: JWT-based authentication with scope-based permissions
- **Rate Limiting**: Intelligent rate limiting with burst protection
- **Caching**: High-performance caching for improved response times
- **Real-time Data**: Live access to your data with automatic updates
- **Comprehensive Validation**: Input sanitization and type validation
- **Audit Logging**: Complete audit trail for all API operations

## Authentication

### API Tokens

All API requests require a valid API token in the Authorization header:

```http
Authorization: Bearer YOUR_API_TOKEN
```

### Token Scopes

API tokens support granular permissions through scopes:

- `tables:read` - Read access to public tables and data
- `rows:write` - Create, update, and delete rows
- `tables:write` - Create and modify tables (admin only)

### Creating API Tokens

1. Log into your YDV dashboard
2. Navigate to Public API section
3. Click "Create New Token"
4. Select required scopes
5. Set expiration (optional)
6. Copy the generated token

**Note**: API tokens are only available on Pro and Business plans.

## Rate Limiting

The API implements intelligent rate limiting to ensure fair usage:

| Endpoint Type    | Rate Limit   | Burst Limit | Block Duration |
| ---------------- | ------------ | ----------- | -------------- |
| Documentation    | 5000 req/min | 200 burst   | 2 minutes      |
| Read Operations  | 100 req/min  | 20 burst    | 10 minutes     |
| Write Operations | 50 req/min   | 10 burst    | 15 minutes     |
| Public Access    | 1000 req/min | 50 burst    | 5 minutes      |

### Rate Limit Headers

All responses include rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 2025-01-01T12:01:00.000Z
X-RateLimit-BurstLimit: 20
X-RateLimit-BurstRemaining: 15
```

## Endpoints

### 1. List Public Tables

```http
GET /api/public/tables
```

**Authentication**: Required  
**Scopes**: `tables:read`

Returns a list of all public tables accessible to the authenticated user.

**Response Example**:

```json
{
	"data": [
		{
			"id": 1,
			"name": "Products",
			"description": "Product catalog",
			"isPublic": true,
			"createdAt": "2025-01-01T00:00:00Z",
			"databaseId": 1,
			"_count": {
				"columns": 5,
				"rows": 100
			}
		}
	],
	"metadata": {
		"totalTables": 1,
		"tenantId": 1
	},
	"timestamp": "2025-01-01T12:00:00.000Z"
}
```

### 2. Get Table Details

```http
GET /api/public/tables/{tableId}?page=1&pageSize=25
```

**Authentication**: Required  
**Scopes**: `tables:read`

**Path Parameters**:

- `tableId` - Numeric ID of the table

**Query Parameters**:

- `page` - Page number (default: 1, max: 1000)
- `pageSize` - Items per page (default: 25, max: 100)

Returns detailed table information including schema, data, and pagination.

**Response Example**:

```json
{
	"data": {
		"id": 1,
		"name": "Products",
		"description": "Product catalog",
		"databaseId": 1,
		"columns": [
			{
				"id": 1,
				"name": "name",
				"type": "string",
				"required": true,
				"primary": false,
				"order": 0
			}
		],
		"rows": [
			{
				"id": 1,
				"createdAt": "2025-01-01T00:00:00Z",
				"name": "Sample Product"
			}
		],
		"pagination": {
			"page": 1,
			"pageSize": 25,
			"totalRows": 100,
			"totalPages": 4,
			"hasNextPage": true,
			"hasPreviousPage": false
		}
	},
	"timestamp": "2025-01-01T12:00:00.000Z"
}
```

### 3. Create Row

```http
POST /api/public/tables/{tableId}/rows
```

**Authentication**: Required  
**Scopes**: `rows:write`

**Path Parameters**:

- `tableId` - Numeric ID of the table

**Request Body**: JSON object with column names as keys and values matching
column types.

**Response Example**:

```json
{
	"data": {
		"name": "New Product",
		"price": 29.99,
		"category": "Electronics"
	},
	"timestamp": "2025-01-01T12:00:00.000Z"
}
```

### 4. Update Row

```http
PATCH /api/public/tables/{tableId}/rows/{rowId}
```

**Authentication**: Required  
**Scopes**: `rows:write`

**Path Parameters**:

- `tableId` - Numeric ID of the table
- `rowId` - Numeric ID of the row

**Request Body**: JSON object with column names as keys and new values.

### 5. Delete Row

```http
DELETE /api/public/tables/{tableId}/rows/{rowId}
```

**Authentication**: Required  
**Scopes**: `rows:write`

**Path Parameters**:

- `tableId` - Numeric ID of the table
- `rowId` - Numeric ID of the row

### 6. API Documentation

```http
GET /api/public/docs
```

**Authentication**: Optional

Returns comprehensive API documentation including examples, data types, and best
practices.

## Data Types

The API supports the following data types:

| Type          | Description       | Validation                      |
| ------------- | ----------------- | ------------------------------- |
| `string`      | Text data         | Max 10KB, required if specified |
| `text`        | Long text data    | Max 10KB, required if specified |
| `number`      | Numeric data      | Integers and decimals           |
| `boolean`     | True/false values | Boolean validation              |
| `date`        | Date values       | ISO 8601 format                 |
| `reference`   | Table references  | Numeric ID validation           |
| `customArray` | Predefined values | Must match allowed options      |

## Error Handling

All API errors follow a consistent format:

```json
{
	"error": "Human-readable error message",
	"timestamp": "2025-01-01T12:00:00.000Z",
	"details": {
		"additional": "error information"
	}
}
```

### Common HTTP Status Codes

| Status | Description                                      |
| ------ | ------------------------------------------------ |
| 200    | Success                                          |
| 201    | Created                                          |
| 400    | Bad Request - Invalid parameters or data         |
| 401    | Unauthorized - Missing or invalid authentication |
| 403    | Forbidden - Insufficient permissions             |
| 404    | Not Found - Resource doesn't exist               |
| 413    | Payload Too Large - Request exceeds size limits  |
| 429    | Too Many Requests - Rate limit exceeded          |
| 500    | Internal Server Error - Server-side error        |

## Security Features

### Input Sanitization

- Automatic sanitization of all input data
- Protection against SQL injection and XSS attacks
- Maximum request size limits (10MB)
- JSON depth and array length restrictions

### Security Headers

All responses include security headers:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Audit Logging

All API operations are logged for security monitoring:

- Authentication attempts
- Data access patterns
- Permission violations
- Rate limit violations

## Performance Optimization

### Caching

The API implements intelligent caching:

- Table schemas: 15 minutes
- Public tables list: 5 minutes
- User permissions: 2 minutes
- Row data: 2 minutes (shorter for dynamic data)

### Response Optimization

- Parallel database queries where possible
- Efficient data transformation
- Pagination for large datasets
- Optimized column mapping

## Best Practices

### 1. Error Handling

Always implement proper error handling in your applications:

```javascript
try {
	const response = await fetch("/api/public/tables/1");
	if (!response.ok) {
		const error = await response.json();
		console.error("API Error:", error);
		return;
	}
	const data = await response.json();
} catch (error) {
	console.error("Request failed:", error);
}
```

### 2. Rate Limiting

Monitor rate limit headers and implement backoff strategies:

```javascript
const remaining = response.headers.get("X-RateLimit-Remaining");
const resetTime = response.headers.get("X-RateLimit-Reset");

if (parseInt(remaining) < 10) {
	// Implement backoff strategy
	const delay = new Date(resetTime) - new Date();
	await new Promise((resolve) => setTimeout(resolve, delay));
}
```

### 3. Caching

Implement client-side caching for frequently accessed data:

```javascript
const cacheKey = `table_${tableId}_${page}_${pageSize}`;
const cached = localStorage.getItem(cacheKey);

if (cached) {
	const { data, timestamp } = JSON.parse(cached);
	if (Date.now() - timestamp < 5 * 60 * 1000) {
		// 5 minutes
		return data;
	}
}

// Fetch from API and cache
const response = await fetch(
	`/api/public/tables/${tableId}?page=${page}&pageSize=${pageSize}`,
);
const data = await response.json();
localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
```

### 4. Data Validation

Validate data before sending to the API:

```javascript
function validateRowData(data, columns) {
	const errors = [];

	for (const column of columns) {
		if (column.required && !data[column.name]) {
			errors.push(`Missing required field: ${column.name}`);
		}

		if (data[column.name] !== undefined) {
			// Type validation
			if (column.type === "number" && isNaN(data[column.name])) {
				errors.push(`${column.name} must be a number`);
			}

			if (column.type === "date" && isNaN(Date.parse(data[column.name]))) {
				errors.push(`${column.name} must be a valid date`);
			}
		}
	}

	return errors;
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
class YDVAPI {
	private baseUrl: string;
	private token: string;

	constructor(baseUrl: string, token: string) {
		this.baseUrl = baseUrl;
		this.token = token;
	}

	private async request(endpoint: string, options: RequestInit = {}) {
		const response = await fetch(`${this.baseUrl}${endpoint}`, {
			...options,
			headers: {
				Authorization: `Bearer ${this.token}`,
				"Content-Type": "application/json",
				...options.headers,
			},
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "API request failed");
		}

		return response.json();
	}

	async getTables() {
		return this.request("/tables");
	}

	async getTable(tableId: number, page = 1, pageSize = 25) {
		return this.request(`/tables/${tableId}?page=${page}&pageSize=${pageSize}`);
	}

	async createRow(tableId: number, data: any) {
		return this.request(`/tables/${tableId}/rows`, {
			method: "POST",
			body: JSON.stringify(data),
		});
	}

	async updateRow(tableId: number, rowId: number, data: any) {
		return this.request(`/tables/${tableId}/rows/${rowId}`, {
			method: "PATCH",
			body: JSON.stringify(data),
		});
	}

	async deleteRow(tableId: number, rowId: number) {
		return this.request(`/tables/${tableId}/rows/${rowId}`, {
			method: "DELETE",
		});
	}
}

// Usage
const api = new YDVAPI("https://your-domain.com/api/public", "your-token");

// Get all tables
const tables = await api.getTables();

// Create a new product
const newProduct = await api.createRow(1, {
	name: "New Product",
	price: 29.99,
	category: "Electronics",
});
```

### Python

```python
import requests
from typing import Dict, Any, Optional

class YDVAPI:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url.rstrip('/')
        self.token = token
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        })

    def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"
        response = self.session.request(method, url, **kwargs)

        if not response.ok:
            error = response.json()
            raise Exception(error.get('error', 'API request failed'))

        return response.json()

    def get_tables(self) -> Dict[str, Any]:
        return self._request('GET', '/tables')

    def get_table(self, table_id: int, page: int = 1, page_size: int = 25) -> Dict[str, Any]:
        params = {'page': page, 'pageSize': page_size}
        return self._request('GET', f'/tables/{table_id}', params=params)

    def create_row(self, table_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', f'/tables/{table_id}/rows', json=data)

    def update_row(self, table_id: int, row_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('PATCH', f'/tables/{table_id}/rows/{row_id}', json=data)

    def delete_row(self, table_id: int, row_id: int) -> Dict[str, Any]:
        return self._request('DELETE', f'/tables/{table_id}/rows/{row_id}')

# Usage
api = YDVAPI('https://your-domain.com/api/public', 'your-token')

# Get all tables
tables = api.get_tables()

# Create a new product
new_product = api.create_row(1, {
    'name': 'New Product',
    'price': 29.99,
    'category': 'Electronics'
})
```

## Support

- **Documentation**: `/docs/api`
- **Help Center**: `/docs/help`
- **Contact**: `/#contact`
- **Status Page**: `/docs/status`

## Changelog

### Version 1.0.0 (Current)

- Initial public API release
- Multi-tenant support
- Advanced security features
- Comprehensive rate limiting
- Enhanced caching system
- Full CRUD operations
- Audit logging
- Input validation and sanitization

## License

This API is part of the YDV platform. Usage is subject to your subscription
terms and conditions.
