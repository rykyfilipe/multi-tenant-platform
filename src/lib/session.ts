import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
  name: string;
  image?: string;
  profileImage?: string;
  tenantId?: string | null;
}

export interface Session {
  user: SessionUser;
  accessToken?: string;
  customJWT?: string;
  subscription?: {
    status: string | null;
    plan: string | null;
    currentPeriodEnd: Date | null;
  };
}

/**
 * Require authentication and optionally check for specific role
 * @param role - Optional role to check for (ADMIN, EDITOR, VIEWER)
 * @returns Session object
 * @throws Error if unauthorized or forbidden
 */
export async function requireAuth(role?: "ADMIN" | "EDITOR" | "VIEWER"): Promise<Session> {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    throw new Error("Unauthorized");
  }

  if (role && session.user.role !== role) {
    throw new Error("Forbidden");
  }

  return session as Session;
}

/**
 * Require authentication and return NextResponse for API routes
 * @param role - Optional role to check for
 * @returns Session object or NextResponse error
 */
export async function requireAuthResponse(role?: "ADMIN" | "EDITOR" | "VIEWER"): Promise<Session | NextResponse> {
  try {
    return await requireAuth(role);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * Check if user has tenant access
 * @param session - User session
 * @param tenantId - Tenant ID to check
 * @returns boolean indicating if user has access
 */
export function hasTenantAccess(session: Session, tenantId: string): boolean {
  console.log("hasTenantAccess", session.user.tenantId, tenantId, "types:", typeof session.user.tenantId, typeof tenantId);
  console.log("String comparison:", String(session.user.tenantId), "===", String(tenantId));
  console.log("Result:", String(session.user.tenantId) === String(tenantId));
  return String(session.user.tenantId) === String(tenantId);
}

/**
 * Require tenant access and return NextResponse for API routes
 * @param session - User session
 * @param tenantId - Tenant ID to check
 * @returns NextResponse error if no access, null if access granted
 */
export function requireTenantAccess(session: Session, tenantId: string): NextResponse | null {
  if (!hasTenantAccess(session, tenantId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/**
 * Check if user can perform write operations
 * @param session - User session
 * @returns boolean indicating if user can write
 */
export function canWrite(session: Session): boolean {
  return session.user.role === "ADMIN" || session.user.role === "EDITOR";
}

/**
 * Check if user can perform read operations
 * @param session - User session
 * @returns boolean indicating if user can read
 */
export function canRead(session: Session): boolean {
  return ["ADMIN", "EDITOR", "VIEWER"].includes(session.user.role);
}

/**
 * Get user ID as number from session
 * @param session - User session
 * @returns User ID as number
 */
export function getUserId(session: Session): number {
  return parseInt(session.user.id);
}

/**
 * Get tenant ID as number from session
 * @param session - User session
 * @returns Tenant ID as number or null
 */
export function getTenantId(session: Session): number | null {
  return session.user.tenantId ? parseInt(session.user.tenantId) : null;
}

/**
 * Require authentication for API routes (alias for requireAuthResponse)
 * @param role - Optional role to check for
 * @returns Session object or NextResponse error
 */
export async function requireAuthAPI(role?: "ADMIN" | "EDITOR" | "VIEWER"): Promise<Session | NextResponse> {
  return requireAuthResponse(role);
}

/**
 * Require authentication and tenant access for API routes
 * @param tenantId - Tenant ID to check access for
 * @returns Session object or NextResponse error
 */
export async function requireTenantAccessAPI(tenantId: string): Promise<Session | NextResponse> {
  try {
    // First authenticate the user
    const session = await requireAuth();
    
    // Then check tenant access
    const tenantAccessError = requireTenantAccess(session, tenantId);
    if (tenantAccessError) {
      return tenantAccessError;
    }
    
    return session;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * Require authentication with support for both NextAuth cookies and Bearer tokens
 * @param request - NextRequest object
 * @returns Session object or NextResponse error
 */
export async function requireAuthFlexible(request: NextRequest): Promise<Session | NextResponse> {
  try {
    // First try NextAuth session (cookie-based)
    const sessionResult = await requireAuthResponse();
    if (sessionResult instanceof NextResponse) {
      return sessionResult;
    }
    
    // If it's a Session object, return it
    if (sessionResult && typeof sessionResult === 'object' && 'user' in sessionResult) {
      return sessionResult as Session;
    }
    
    // If NextAuth fails, try Bearer token authentication
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        // Import JWT verification from auth.ts
        const { verifyToken, getUserFromRequest } = await import('@/lib/auth');
        
        if (verifyToken(token)) {
          const userResult = await getUserFromRequest(request);
          if (userResult instanceof Response) {
            return userResult;
          }
          
          // Convert to Session format
          const session: Session = {
            user: {
              id: userResult.userId.toString(),
              email: '', // Will be filled from database
              firstName: '',
              lastName: '',
              role: userResult.role as any,
              name: '',
              tenantId: null, // Will be filled from database
            },
            customJWT: token,
          };
          
          // Get full user data from database
          const { default: prisma } = await import('@/lib/prisma');
          const dbUser = await prisma.user.findUnique({
            where: { id: userResult.userId },
            select: {
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              tenantId: true,
              profileImage: true,
            }
          });
          
          if (dbUser) {
            session.user = {
              id: userResult.userId.toString(),
              email: dbUser.email,
              firstName: dbUser.firstName,
              lastName: dbUser.lastName,
              role: dbUser.role as any,
              name: `${dbUser.firstName} ${dbUser.lastName}`,
              tenantId: dbUser.tenantId?.toString() || null,
              image: dbUser.profileImage || undefined,
              profileImage: dbUser.profileImage || undefined,
            };
          }
          
          return session;
        }
      } catch (tokenError) {
        console.error('Bearer token verification failed:', tokenError);
      }
    }
    
    // If both methods fail, return unauthorized
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}