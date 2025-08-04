<!-- @format -->

# Delete Account Features - Implementation Guide

## Overview

The system now supports complete account deletion for both regular users and
admin users, with proper cascade deletion for all associated data.

## Features Implemented

### 1. **Admin Account Deletion with Cascade Delete**

- ✅ Admin users can now delete their accounts
- ✅ When an admin deletes their account, the entire tenant is deleted
- ✅ All associated data is automatically deleted through cascade relationships:
  - Databases
  - Tables
  - Rows
  - Cells
  - API Tokens
  - Table Permissions
  - Column Permissions
  - User Sessions
  - OAuth Accounts

### 2. **Regular User Account Deletion**

- ✅ Regular users can delete their accounts
- ✅ Only user-specific data is deleted
- ✅ Tenant and other users remain unaffected

### 3. **Enhanced UI/UX**

- ✅ Warning message for admin users about tenant deletion
- ✅ Different success messages for admin vs regular users
- ✅ Clear confirmation dialog with specific warnings

## Database Schema Updates

### Cascade Delete Relationships

All relationships now have proper cascade delete configured:

```prisma
// Tenant Admin relationship
admin   User   @relation("TenantAdmin", fields: [adminId], references: [id], onDelete: Cascade)

// User-Tenant relationship
tenant   Tenant? @relation("TenantUsers", fields: [tenantId], references: [id], onDelete: Cascade)

// Database relationships
tenant   Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
database   Database @relation(fields: [databaseId], references: [id], onDelete: Cascade)

// Table relationships
table         Table   @relation(fields: [tableId], references: [id], onDelete: Cascade)

// Row and Cell relationships
table     Table    @relation(fields: [tableId], references: [id], onDelete: Cascade)
row    Row    @relation(fields: [rowId], references: [id], onDelete: Cascade)
column Column @relation(fields: [columnId], references: [id], onDelete: Cascade)

// Permission relationships
user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
table   Table @relation(fields: [tableId], references: [id], onDelete: Cascade)
tenant   Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

// API Token relationships
user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

// OAuth relationships
user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
```

## API Endpoint Updates

### DELETE `/api/tenants/[tenantId]/users/[userId]`

**New Logic:**

1. **Self-Deletion (User deleting their own account):**

   - If user is ADMIN and has a tenant → Delete entire tenant (cascade delete)
   - If user is regular → Delete only the user

2. **Admin deleting another user:**

   - If deleting another ADMIN → Delete entire tenant
   - If deleting regular user → Delete only the user

3. **Regular user deleting another user:**
   - Delete only the user (tenant remains intact)

## UI Components Updated

### DeleteAccountButton Component

- ✅ Added `user` prop to check user role
- ✅ Enhanced warning message for admin users
- ✅ Clear indication of what will be deleted

### BasicSettings Component

- ✅ Updated to pass user prop to DeleteAccountButton
- ✅ Different success messages for admin vs regular users

## Security Considerations

### Data Integrity

- ✅ All cascade relationships are properly configured
- ✅ No orphaned data left in the database
- ✅ Proper transaction handling for complex deletions

### Authorization

- ✅ Users can only delete accounts in their tenant
- ✅ Admin users can delete any user in their tenant
- ✅ Self-deletion is always allowed

### Audit Trail

- ✅ All deletions are logged through Prisma
- ✅ No data recovery possible after deletion (by design)

## Usage Examples

### Admin User Deletion

```typescript
// When admin clicks "Delete Account"
// 1. Shows warning about tenant deletion
// 2. Confirms deletion
// 3. Deletes entire tenant and all data
// 4. Shows success message: "Account and tenant deleted successfully"
```

### Regular User Deletion

```typescript
// When regular user clicks "Delete Account"
// 1. Shows standard deletion warning
// 2. Confirms deletion
// 3. Deletes only user data
// 4. Shows success message: "Account deleted successfully"
```

## Migration Required

To apply the database schema changes:

```bash
npx prisma migrate dev --name add_cascade_delete_for_tenant_admin
```

This will:

- Add `onDelete: Cascade` to Tenant admin relationship
- Add `onDelete: SetNull` to Column reference relationship
- Ensure all cascade deletions work properly

## Testing Recommendations

1. **Test Admin Self-Deletion:**

   - Create admin user with tenant
   - Add some data (databases, tables, rows)
   - Delete admin account
   - Verify all data is deleted

2. **Test Regular User Deletion:**

   - Create regular user in tenant
   - Delete user account
   - Verify tenant and other users remain

3. **Test Admin Deleting Other Admin:**

   - Create two admin users in same tenant
   - Have one admin delete the other
   - Verify entire tenant is deleted

4. **Test Data Integrity:**
   - Verify no orphaned records in database
   - Check all foreign key constraints are satisfied

## Error Handling

The system handles various error scenarios:

- ✅ User not found
- ✅ Unauthorized access
- ✅ Database constraint violations
- ✅ Network errors during deletion

All errors are properly logged and user-friendly messages are displayed.
