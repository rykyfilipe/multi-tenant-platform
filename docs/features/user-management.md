# User Management & Permissions

The user management system provides comprehensive role-based access control (RBAC) with custom roles, granular permissions, and multi-tenant user management capabilities.

## Overview

The user management system enables organizations to:

- **Manage Multi-Tenant Users**: Users can belong to multiple tenants with different roles
- **Define Custom Roles**: Create tenant-specific roles with granular permissions
- **Control Data Access**: Fine-grained control over tables, columns, and operations
- **Audit User Activities**: Comprehensive logging of user actions and changes
- **Manage Invitations**: Invite users to tenants with specific roles
- **Enforce Security Policies**: Role-based security with inheritance and overrides

## Architecture Components

### 1. User Management

#### Core User Model
```typescript
// User entity with multi-tenant support
model User {
  id                           Int                   @id @default(autoincrement())
  email                        String                @unique
  firstName                    String
  lastName                     String
  password                     String?
  role                         Role                  @default(USER)
  tenantId                     Int?                  // Legacy compatibility
  activeTenantId               Int?                  // Current active tenant
  stripeCustomerId             String?
  stripeSubscriptionId        String?
  subscriptionCurrentPeriodEnd DateTime?
  subscriptionPlan             String?
  subscriptionStatus           String?
  profileImage                 String?
  isActive                     Boolean               @default(true)
  deactivatedAt                DateTime?
  deactivatedBy                Int?
  createdAt                    DateTime              @default(now())
  updatedAt                    DateTime              @updatedAt
  
  // Multi-tenant relationships
  userTenants                  UserTenant[]
  customRoles                  UserCustomRole[]
  adminOf                      Tenant?               @relation("TenantAdmin")
  memberOf                     Tenant[]              @relation("TenantUsers")
  
  // Audit and activity tracking
  auditLogs                    AuditLog[]
  userActivities               UserActivity[]
}

// Multi-tenant user relationship
model UserTenant {
  id       Int @id @default(autoincrement())
  userId   Int
  tenantId Int
  role     String              @default("USER")
  isActive Boolean             @default(true)
  joinedAt DateTime            @default(now())
  user     User                @relation(fields: [userId], references: [id])
  tenant   Tenant              @relation(fields: [tenantId], references: [id])
  
  @@unique([userId, tenantId])
}
```

### 2. Role-Based Access Control

#### Custom Role System
```typescript
// Custom role definition with granular permissions
model CustomRole {
  id          Int     @id @default(autoincrement())
  tenantId    Int
  name        String
  description String?
  permissions Json    // Granular permission matrix
  isSystem    Boolean @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  tenant      Tenant            @relation(fields: [tenantId], references: [id])
  users       UserCustomRole[]
  
  @@unique([tenantId, name])
}

// User custom role assignment
model UserCustomRole {
  id       Int        @id @default(autoincrement())
  userId   Int
  roleId   Int
  assignedAt DateTime @default(now())
  assignedBy Int?
  
  user     User       @relation(fields: [userId], references: [id])
  role     CustomRole @relation(fields: [roleId], references: [id])
  assigner User?      @relation("RoleAssigner", fields: [assignedBy], references: [id])
  
  @@unique([userId, roleId])
}
```

### 3. Permission System

#### Granular Permissions
```typescript
// Permission types for different resources
interface PermissionMatrix {
  // Database permissions
  databases: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    manage: boolean;
  };
  
  // Table permissions
  tables: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    manage: boolean;
  };
  
  // Column permissions
  columns: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    manage: boolean;
  };
  
  // Row permissions
  rows: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    manage: boolean;
  };
  
  // Dashboard permissions
  dashboards: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    manage: boolean;
  };
  
  // Widget permissions
  widgets: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    manage: boolean;
  };
  
  // Invoice permissions
  invoices: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    manage: boolean;
    approve: boolean;
    cancel: boolean;
  };
  
  // User management permissions
  users: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    manage: boolean;
    invite: boolean;
    deactivate: boolean;
  };
  
  // System permissions
  system: {
    settings: boolean;
    modules: boolean;
    integrations: boolean;
    analytics: boolean;
    audit: boolean;
  };
}
```

## Implementation Details

### 1. Permission Checking

#### Permission Service
```typescript
// Permission checking service
export class PermissionService {
  static async checkPermission(
    userId: number,
    tenantId: number,
    resource: string,
    action: string,
    resourceId?: number
  ): Promise<boolean> {
    // Get user's roles for the tenant
    const userRoles = await this.getUserRoles(userId, tenantId);
    
    // Check system role permissions
    const systemRole = await this.getSystemRole(userId, tenantId);
    if (systemRole && this.hasSystemPermission(systemRole, resource, action)) {
      return true;
    }
    
    // Check custom role permissions
    for (const role of userRoles) {
      if (await this.hasCustomPermission(role, resource, action, resourceId)) {
        return true;
      }
    }
    
    return false;
  }
  
  private static async getUserRoles(
    userId: number, 
    tenantId: number
  ): Promise<CustomRole[]> {
    return prisma.customRole.findMany({
      where: {
        tenantId,
        users: {
          some: { userId }
        }
      }
    });
  }
  
  private static async getSystemRole(
    userId: number, 
    tenantId: number
  ): Promise<string | null> {
    const userTenant = await prisma.userTenant.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId
        }
      }
    });
    
    return userTenant?.role || null;
  }
  
  private static hasSystemPermission(
    role: string, 
    resource: string, 
    action: string
  ): boolean {
    const systemPermissions = {
      ADMIN: {
        databases: ['create', 'read', 'update', 'delete', 'manage'],
        tables: ['create', 'read', 'update', 'delete', 'manage'],
        columns: ['create', 'read', 'update', 'delete', 'manage'],
        rows: ['create', 'read', 'update', 'delete', 'manage'],
        dashboards: ['create', 'read', 'update', 'delete', 'manage'],
        widgets: ['create', 'read', 'update', 'delete', 'manage'],
        invoices: ['create', 'read', 'update', 'delete', 'manage', 'approve', 'cancel'],
        users: ['create', 'read', 'update', 'delete', 'manage', 'invite', 'deactivate'],
        system: ['settings', 'modules', 'integrations', 'analytics', 'audit']
      },
      EDITOR: {
        databases: ['read', 'update'],
        tables: ['create', 'read', 'update', 'delete'],
        columns: ['create', 'read', 'update', 'delete'],
        rows: ['create', 'read', 'update', 'delete'],
        dashboards: ['create', 'read', 'update', 'delete'],
        widgets: ['create', 'read', 'update', 'delete'],
        invoices: ['create', 'read', 'update', 'approve'],
        users: ['read', 'invite'],
        system: ['analytics']
      },
      VIEWER: {
        databases: ['read'],
        tables: ['read'],
        columns: ['read'],
        rows: ['create', 'read', 'update'],
        dashboards: ['read'],
        widgets: ['read'],
        invoices: ['read'],
        users: [],
        system: []
      }
    };
    
    return systemPermissions[role]?.[resource]?.includes(action) || false;
  }
  
  private static async hasCustomPermission(
    role: CustomRole,
    resource: string,
    action: string,
    resourceId?: number
  ): Promise<boolean> {
    const permissions = role.permissions as PermissionMatrix;
    
    // Check resource-level permissions
    if (permissions[resource]?.[action]) {
      return true;
    }
    
    // Check resource-specific permissions if resourceId provided
    if (resourceId) {
      return await this.checkResourceSpecificPermission(
        role.id,
        resource,
        resourceId,
        action
      );
    }
    
    return false;
  }
}
```

### 2. User Invitation System

#### Invitation Management
```typescript
// User invitation model
model Invitation {
  id          Int      @id @default(autoincrement())
  tenantId    Int
  email       String
  role        String
  customRoleId Int?
  invitedBy   Int
  token       String   @unique
  expiresAt   DateTime
  acceptedAt  DateTime?
  createdAt   DateTime @default(now())
  
  tenant      Tenant      @relation(fields: [tenantId], references: [id])
  inviter     User        @relation("Inviter", fields: [invitedBy], references: [id])
  customRole  CustomRole? @relation(fields: [customRoleId], references: [id])
}

// Invitation service
export class InvitationService {
  static async createInvitation(
    tenantId: number,
    email: string,
    role: string,
    customRoleId: number | null,
    invitedBy: number
  ): Promise<Invitation> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      // Check if user is already a member
      const existingMembership = await prisma.userTenant.findUnique({
        where: {
          userId_tenantId: {
            userId: existingUser.id,
            tenantId
          }
        }
      });
      
      if (existingMembership) {
        throw new Error('User is already a member of this tenant');
      }
    }
    
    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        tenantId,
        email,
        role,
        customRoleId,
        invitedBy,
        token,
        expiresAt
      }
    });
    
    // Send invitation email
    await EmailService.sendInvitationEmail(email, invitation.token, tenantId);
    
    return invitation;
  }
  
  static async acceptInvitation(
    token: string,
    userData: {
      firstName: string;
      lastName: string;
      password: string;
    }
  ): Promise<User> {
    // Validate invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { tenant: true, customRole: true }
    });
    
    if (!invitation) {
      throw new Error('Invalid invitation token');
    }
    
    if (invitation.expiresAt < new Date()) {
      throw new Error('Invitation has expired');
    }
    
    if (invitation.acceptedAt) {
      throw new Error('Invitation has already been accepted');
    }
    
    // Create or update user
    let user = await prisma.user.findUnique({
      where: { email: invitation.email }
    });
    
    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: invitation.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          password: await hashPassword(userData.password),
          role: 'USER'
        }
      });
    }
    
    // Add user to tenant
    await prisma.userTenant.create({
      data: {
        userId: user.id,
        tenantId: invitation.tenantId,
        role: invitation.role
      }
    });
    
    // Assign custom role if specified
    if (invitation.customRoleId) {
      await prisma.userCustomRole.create({
        data: {
          userId: user.id,
          roleId: invitation.customRoleId,
          assignedBy: invitation.invitedBy
        });
      });
    }
    
    // Mark invitation as accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() }
    });
    
    return user;
  }
}
```

### 3. Audit Logging

#### Comprehensive Audit System
```typescript
// Audit log model
model AuditLog {
  id          Int      @id @default(autoincrement())
  tenantId    Int
  userId      Int
  action      String
  resource    String
  resourceId  Int?
  oldValue    Json?
  newValue    Json?
  details     Json?
  ipAddress   String?
  userAgent   String?
  timestamp   DateTime @default(now())
  
  tenant      Tenant @relation(fields: [tenantId], references: [id])
  user        User   @relation(fields: [userId], references: [id])
}

// Audit service
export class AuditService {
  static async logAction(
    tenantId: number,
    userId: number,
    action: string,
    resource: string,
    resourceId: number | null,
    oldValue: any,
    newValue: any,
    details?: any
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action,
        resource,
        resourceId,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        details: details ? JSON.stringify(details) : null,
        ipAddress: this.getClientIP(),
        userAgent: this.getUserAgent()
      }
    });
  }
  
  static async getAuditTrail(
    tenantId: number,
    filters: {
      userId?: number;
      resource?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<AuditLog[]> {
    const where: any = { tenantId };
    
    if (filters.userId) where.userId = filters.userId;
    if (filters.resource) where.resource = filters.resource;
    if (filters.action) where.action = filters.action;
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }
    
    return prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 1000 // Limit to prevent performance issues
    });
  }
  
  private static getClientIP(): string {
    // Implementation to get client IP from request
    return '127.0.0.1'; // Placeholder
  }
  
  private static getUserAgent(): string {
    // Implementation to get user agent from request
    return 'Unknown'; // Placeholder
  }
}
```

## Advanced Features

### 1. Role Inheritance

#### Hierarchical Role System
```typescript
// Role inheritance service
export class RoleInheritanceService {
  static async getEffectivePermissions(
    userId: number,
    tenantId: number
  ): Promise<PermissionMatrix> {
    const userRoles = await this.getUserRoles(userId, tenantId);
    const systemRole = await this.getSystemRole(userId, tenantId);
    
    // Start with system role permissions
    let effectivePermissions = this.getSystemRolePermissions(systemRole);
    
    // Apply custom role permissions (override system permissions)
    for (const role of userRoles) {
      const rolePermissions = role.permissions as PermissionMatrix;
      effectivePermissions = this.mergePermissions(
        effectivePermissions,
        rolePermissions
      );
    }
    
    return effectivePermissions;
  }
  
  private static mergePermissions(
    base: PermissionMatrix,
    override: PermissionMatrix
  ): PermissionMatrix {
    const merged = { ...base };
    
    for (const resource in override) {
      if (!merged[resource]) {
        merged[resource] = {};
      }
      
      for (const action in override[resource]) {
        merged[resource][action] = override[resource][action];
      }
    }
    
    return merged;
  }
}
```

### 2. Resource-Specific Permissions

#### Granular Resource Access
```typescript
// Resource-specific permission model
model ResourcePermission {
  id         Int      @id @default(autoincrement())
  tenantId   Int
  userId     Int?
  roleId     Int?
  resource   String
  resourceId Int
  permissions Json    // Specific permissions for this resource
  createdAt  DateTime @default(now())
  
  tenant     Tenant      @relation(fields: [tenantId], references: [id])
  user       User?       @relation(fields: [userId], references: [id])
  role       CustomRole? @relation(fields: [roleId], references: [id])
  
  @@unique([tenantId, resource, resourceId, userId, roleId])
}

// Resource permission service
export class ResourcePermissionService {
  static async setResourcePermission(
    tenantId: number,
    resource: string,
    resourceId: number,
    permissions: any,
    userId?: number,
    roleId?: number
  ): Promise<void> {
    await prisma.resourcePermission.upsert({
      where: {
        tenantId_resource_resourceId_userId_roleId: {
          tenantId,
          resource,
          resourceId,
          userId: userId || 0,
          roleId: roleId || 0
        }
      },
      update: { permissions },
      create: {
        tenantId,
        resource,
        resourceId,
        permissions,
        userId,
        roleId
      }
    });
  }
  
  static async getResourcePermission(
    tenantId: number,
    resource: string,
    resourceId: number,
    userId: number
  ): Promise<any> {
    // Check user-specific permissions first
    const userPermission = await prisma.resourcePermission.findFirst({
      where: {
        tenantId,
        resource,
        resourceId,
        userId
      }
    });
    
    if (userPermission) {
      return userPermission.permissions;
    }
    
    // Check role-based permissions
    const userRoles = await prisma.userCustomRole.findMany({
      where: { userId },
      include: { role: true }
    });
    
    for (const userRole of userRoles) {
      const rolePermission = await prisma.resourcePermission.findFirst({
        where: {
          tenantId,
          resource,
          resourceId,
          roleId: userRole.roleId
        }
      });
      
      if (rolePermission) {
        return rolePermission.permissions;
      }
    }
    
    return null;
  }
}
```

## Common Issues & Solutions

### 1. Permission Denied Errors

**Problem**: Users getting permission denied for actions they should be able to perform
**Solution**:
- Implement comprehensive permission checking
- Add permission debugging tools
- Create permission testing utilities

### 2. Role Assignment Issues

**Problem**: Users not getting correct roles after invitation acceptance
**Solution**:
- Validate role assignments during invitation
- Implement role verification after user creation
- Add role assignment audit logging

### 3. Performance Issues

**Problem**: Permission checking causing performance bottlenecks
**Solution**:
- Implement permission caching
- Optimize database queries
- Use background permission updates

## Future Enhancements

### 1. Advanced Security
- **Multi-Factor Authentication**: Enhanced security with MFA
- **Session Management**: Advanced session control and monitoring
- **IP Restrictions**: Location-based access control

### 2. Advanced Permissions
- **Time-Based Permissions**: Permissions that expire or activate at specific times
- **Conditional Permissions**: Permissions based on data conditions
- **Delegation**: Temporary permission delegation between users

### 3. Compliance Features
- **GDPR Compliance**: Data protection and privacy controls
- **SOX Compliance**: Financial data access controls
- **Audit Reporting**: Comprehensive compliance reporting
