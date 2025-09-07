# Database Connection Retry Solution

## Problem
The application was experiencing frequent `08006` errors (connection closed by upstream database) which caused API requests to fail intermittently.

## Solution Implemented

### 1. Enhanced Prisma Client with Automatic Retry Logic
- **File**: `src/lib/prisma.ts`
- **Features**:
  - Automatic retry logic for all database operations
  - Exponential backoff with jitter
  - Automatic reconnection on connection failures
  - Comprehensive error detection for connection issues

### 2. Database Error Handler
- **File**: `src/lib/database-error-handler.ts`
- **Features**:
  - Centralized error handling for database connection issues
  - Automatic error response generation
  - Background reconnection attempts

### 3. Automatic Script for Applying Retry Logic
- **File**: `src/scripts/apply-database-retry.ts`
- **Usage**: `npm run apply-retry`
- **Features**:
  - Automatically wraps all Prisma operations with retry logic
  - Adds error handling to catch blocks
  - Updates imports to include retry utilities

## How It Works

### Retry Logic
1. **Detection**: Identifies connection errors by error codes and messages
2. **Retry**: Attempts operation up to 5 times with exponential backoff
3. **Reconnection**: Automatically disconnects and reconnects on connection failures
4. **Fallback**: Returns user-friendly error message if all retries fail

### Error Codes Handled
- `P2021` - Table does not exist
- `P2024` - Connection pool timeout
- `08006` - Connection closed by upstream database
- `P1001` - Can't reach database server
- `P1002` - Database server timeout
- `P1008` - Operations timed out
- `P1017` - Server closed connection
- Network errors: `ECONNRESET`, `ETIMEDOUT`, `ENOTFOUND`, `ECONNREFUSED`

### Configuration
- **Max Retries**: 5 attempts
- **Base Delay**: 500ms
- **Max Delay**: 10 seconds
- **Jitter**: Random 0-1000ms added to prevent thundering herd

## Usage

### For New API Routes
```typescript
import prisma, { withRetry } from "@/lib/prisma";
import { handleDatabaseError } from "@/lib/database-error-handler";

// Wrap Prisma operations
const users = await withRetry(() => prisma.user.findMany());

// Add error handling
try {
  // ... your code
} catch (error) {
  const dbErrorResponse = handleDatabaseError(error, 'your-context');
  if (dbErrorResponse) {
    return dbErrorResponse;
  }
  // ... other error handling
}
```

### For Existing API Routes
Run the automatic script to update all existing routes:
```bash
npm run apply-retry
```

### Manual Reconnection
If needed, you can force a reconnection:
```typescript
import { forceReconnect } from "@/lib/prisma";
await forceReconnect();
```

## Benefits

1. **Resilience**: Application continues working during temporary database issues
2. **User Experience**: Users see friendly error messages instead of crashes
3. **Automatic Recovery**: System automatically recovers from connection issues
4. **Comprehensive Coverage**: All database operations are protected
5. **Easy Maintenance**: Centralized error handling and retry logic

## Monitoring

The system logs all retry attempts and reconnection attempts:
- Retry attempts are logged with attempt number and delay
- Reconnection attempts are logged with success/failure status
- All logs include context information for debugging

## Testing

To test the retry logic:
1. Simulate database connection issues
2. Monitor logs for retry attempts
3. Verify automatic recovery
4. Check user-facing error messages

## Future Improvements

1. **Metrics**: Add metrics for retry success rates
2. **Circuit Breaker**: Implement circuit breaker pattern for repeated failures
3. **Health Checks**: Add database health check endpoints
4. **Alerting**: Set up alerts for repeated connection failures
