# ANAF e-Factura Integration

This document describes the complete ANAF e-Factura integration system implemented according to the official ANAF documentation: [Oauth procedura inregistrare aplicatii portal ANAF](https://static.anaf.ro/static/10/Anaf/Informatii_R/API/Oauth_procedura_inregistrare_aplicatii_portal_ANAF.pdf)

## Overview

The ANAF integration system provides:
- OAuth 2.0 authentication with ANAF Identity Provider
- JWT token management with proper expiry handling
- Rate limiting (1000 requests per minute)
- Complete e-Factura API integration
- Complete e-Transport API integration
- TestOauth service for connectivity testing

## Architecture

### Components

1. **ANAFOAuthService** - Handles OAuth 2.0 flow
2. **ANAFJWTTokenService** - Manages JWT tokens and validation
3. **ANAFAPIService** - Implements all ANAF API services
4. **ANAFRateLimiter** - Enforces rate limiting
5. **API Endpoints** - RESTful endpoints for testing and integration

### Token Management

- **Access Token**: 129600 minutes (90 days) validity
- **Refresh Token**: 525600 minutes (365 days) validity
- **Token Issuance Interval**: 60 seconds
- **Automatic refresh**: Tokens are automatically refreshed when needed

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# ANAF e-Factura Configuration
ANAF_CLIENT_ID="your-anaf-client-id"
ANAF_CLIENT_SECRET="your-anaf-client-secret"
ANAF_REDIRECT_URI="https://yourdomain.com/api/anaf/callback"
ANAF_ENVIRONMENT="sandbox" # or "production"
ANAF_BASE_URL="https://api.anaf.ro/test/FCTEL/rest" # for sandbox
ANAF_JWT_SECRET="your-anaf-jwt-secret-key-here"
```

### ANAF Portal Registration

1. Register your application at [ANAF Portal](https://logincert.anaf.ro/)
2. Get your `client_id` and `client_secret`
3. Configure redirect URI: `https://yourdomain.com/api/anaf/callback`
4. Request access to e-Factura and e-Transport services

## API Endpoints

### Authentication

#### Get Authorization URL
```http
GET /api/anaf/auth-url
```

Returns the ANAF OAuth authorization URL.

#### OAuth Callback
```http
GET /api/anaf/callback?code=...&state=...
```

Handles the OAuth callback and exchanges code for tokens.

### Testing

#### Test Connectivity
```http
GET /api/anaf/test-connectivity
```

Tests both basic and authenticated connectivity to ANAF services.

#### Test e-Factura
```http
POST /api/anaf/test-efactura
Content-Type: application/json

{
  "invoiceData": "<xml>...</xml>",
  "environment": "test"
}
```

#### Test e-Transport
```http
POST /api/anaf/test-etransport
Content-Type: application/json

{
  "action": "upload|status|list|download",
  "documentData": "<xml>...</xml>",
  "cif": "12345678",
  "uploadId": "upload-id",
  "documentId": "doc-id",
  "days": 7,
  "environment": "test"
}
```

## Usage Examples

### Basic OAuth Flow

```typescript
import { ANAFOAuthService } from '@/lib/anaf/oauth-service';

// Get authorization URL
const authUrl = await ANAFOAuthService.getAuthUrl(userId, tenantId);

// After user authorizes, exchange code for token
const tokenData = await ANAFOAuthService.exchangeCodeForToken(code, userId, tenantId);

// Check if user is authenticated
const isAuthenticated = await ANAFOAuthService.isAuthenticated(userId, tenantId);

// Get valid access token (refreshes if needed)
const accessToken = await ANAFOAuthService.getValidAccessToken(userId, tenantId);
```

### Testing Connectivity

```typescript
import { ANAFAPIService } from '@/lib/anaf/anaf-api-service';

// Test basic connectivity
const basicTest = await ANAFAPIService.testConnectivity('My App Test');

// Test authenticated connectivity
const authTest = await ANAFAPIService.testAuthenticatedConnectivity(
  userId, 
  tenantId, 
  'My App Authenticated Test'
);
```

### e-Factura Integration

```typescript
import { ANAFAPIService } from '@/lib/anaf/anaf-api-service';

// Submit invoice to e-Factura
const result = await ANAFAPIService.submitInvoice(
  userId,
  tenantId,
  invoiceXmlData,
  'test' // or 'production'
);

if (result.success) {
  console.log('Invoice submitted:', result.submissionId);
} else {
  console.error('Submission failed:', result.error);
}
```

### e-Transport Integration

```typescript
import { ANAFAPIService } from '@/lib/anaf/anaf-api-service';

// Upload document
const uploadResult = await ANAFAPIService.uploadToETransport(
  userId,
  tenantId,
  documentXmlData,
  '12345678', // CIF
  'test'
);

// Check status
const statusResult = await ANAFAPIService.checkETransportStatus(
  userId,
  tenantId,
  uploadResult.uploadId,
  'test'
);

// Get document list
const listResult = await ANAFAPIService.getETransportList(
  userId,
  tenantId,
  7, // days
  '12345678', // CIF
  'test'
);

// Download document
const downloadResult = await ANAFAPIService.downloadETransportDocument(
  userId,
  tenantId,
  'document-id',
  'test'
);
```

## Error Handling

The system handles all ANAF error codes as per official documentation:

- **403 Forbidden**: Request neautorizat la URL-urile aferente serviciului web de factură
- **429 Too Many Requests**: Limita maximă de apeluri depășită (1000 apeluri pe minut)
- **200 OK**: Autentificarea și autorizarea s-au realizat cu succes

### OAuth Error Codes

- `invalid_client`: Invalid client credentials
- `invalid_grant`: Invalid authorization code or refresh token
- `unauthorized_client`: Client not authorized for this grant type
- `invalid_scope`: Invalid scope requested
- `access_denied`: Access denied by user or ANAF
- `unsupported_response_type`: Unsupported response type
- `server_error`: ANAF server error
- `temporarily_unavailable`: ANAF service temporarily unavailable

## Rate Limiting

The system implements rate limiting according to ANAF specifications:
- **Limit**: 1000 requests per minute
- **Window**: 60 seconds
- **Error**: 429 Too Many Requests when limit exceeded
- **Retry-After**: Header indicates when to retry

## Security

### Token Security
- Tokens are stored securely in the database
- JWT tokens are validated before use
- Automatic token refresh prevents expiration
- Tokens are revoked when user logs out

### Rate Limiting
- Per-user rate limiting prevents abuse
- Automatic cleanup of expired rate limit entries
- Configurable limits per ANAF specifications

### Error Handling
- Comprehensive error logging
- User-friendly error messages
- Proper HTTP status codes
- Security-conscious error responses

## Testing

### Test Environment
- Use `ANAF_ENVIRONMENT=sandbox`
- Test with `ANAF_BASE_URL=https://api.anaf.ro/test/FCTEL/rest`
- All test endpoints are available

### Production Environment
- Use `ANAF_ENVIRONMENT=production`
- Use `ANAF_BASE_URL=https://api.anaf.ro/prod/FCTEL/rest`
- Ensure proper ANAF registration and approval

## Monitoring

### Logging
- All API calls are logged with timestamps
- Error details are captured for debugging
- Rate limiting events are tracked
- Token refresh operations are logged

### Metrics
- Request counts per user/tenant
- Rate limiting statistics
- Token refresh frequency
- API response times

## Troubleshooting

### Common Issues

1. **Invalid client credentials**
   - Check `ANAF_CLIENT_ID` and `ANAF_CLIENT_SECRET`
   - Verify ANAF portal registration

2. **Rate limit exceeded**
   - Wait for rate limit window to reset
   - Implement exponential backoff
   - Consider request batching

3. **Token expired**
   - System automatically refreshes tokens
   - Check token validity periods
   - Verify JWT secret configuration

4. **Network errors**
   - Check ANAF service availability
   - Verify firewall/proxy settings
   - Test with TestOauth endpoint

### Debug Endpoints

- `GET /api/anaf/test-connectivity` - Test basic connectivity
- `POST /api/anaf/test-efactura` - Test e-Factura integration
- `POST /api/anaf/test-etransport` - Test e-Transport integration

## Compliance

This implementation is fully compliant with:
- ANAF OAuth 2.0 specification
- ANAF e-Factura API documentation
- ANAF e-Transport API documentation
- Romanian e-invoicing regulations
- EN 16931 standard compliance

## Support

For technical support:
- ANAF Support: [Formular de contact](https://www.anaf.ro/ro/web/guest/contact)
- Category: "Asistență tehnică servicii informatice"
- Subcategory: "OAUTH"
