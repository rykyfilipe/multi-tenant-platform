/** @format */

import jwt, { Secret, SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
export const JWT_SECRET: Secret =
	process.env.JWT_SECRET ||
	(() => {
		throw new Error("JWT_SECRET environment variable is required");
	})();
export const PUBLIC_JWT_SECRET =
	process.env.PUBLIC_JWT_SECRET ||
	(() => {
		throw new Error("PUBLIC_JWT_SECRET environment variable is required");
	})();
import { Account, User, Session } from "next-auth";

import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

import { JWT } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import createPredefinedTables from "@/lib/predefinedTables";





export const authOptions = {
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID || "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
			authorization: {
				params: {
					prompt: "select_account",
					access_type: "offline",
					response_type: "code",
					scope: "openid email profile",
					// Mobile-specific parameters
					include_granted_scopes: "true",
					login_hint: "",
				},
			},
			allowDangerousEmailAccountLinking: true,
			// Enhanced configuration for mobile compatibility
			checks: ["state", "pkce"],
			client: {
				token_endpoint_auth_method: "client_secret_post",
			},
		}),
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "text", placeholder: "jsmith" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) return null;

				try {
					const user = await prisma.user.findFirst({
						where: { email: credentials.email }
					});

					if (!user || !user.password) return null;

					// Check if user is deactivated
					if (user.isActive === false) {
						console.warn(`Login attempt by deactivated user: ${user.email}`);
						return null;
					}

					const isPasswordValid = await verifyPassword(credentials.password, user.password);
					if (!isPasswordValid) return null;

					return {
						id: user.id.toString(),
						firstName: user.firstName,
						lastName: user.lastName,
						email: user.email,
						name: `${user.firstName} ${user.lastName}`,
						role: user.role,
						tenantId: user.tenantId ? user.tenantId.toString() : null,
						image: user.profileImage || undefined,
					};
				} catch (error) {
					console.error("Credentials auth error:", error);
					return null;
				}
			},
		}),
	],
	pages: {
		signIn: "/",
		signOut: "/",
		error: "/",
	},
	callbacks: {
		async redirect({ url, baseUrl}: { url: string, baseUrl: string }) {
			try {
				
				// Handle relative URLs
				if (url.startsWith("/")) {
					const redirectUrl = `${baseUrl}${url}`;
					return redirectUrl;
				}
				
				// Handle absolute URLs
				const urlObj = new URL(url);
				if (urlObj.origin === baseUrl) {
					return url;
				}

				// Handle callback URL parameter
				const callbackUrl = urlObj.searchParams.get("callbackUrl");
				if (callbackUrl) {
					if (callbackUrl.startsWith("http")) {
						return callbackUrl;
					}
					if (callbackUrl.startsWith("/")) {
						const relativeCallbackUrl = `${baseUrl}${callbackUrl}`;
						return relativeCallbackUrl;
					}
				}
				
				// Default redirect to auth-callback page
				const defaultRedirect = `${baseUrl}/auth-callback`;
				return defaultRedirect;
			} catch (error) {
				console.error("Redirect callback error:", error);
				return `${baseUrl}/auth-callback`;
			}
		},
		async signIn({ user, account }: { user: User | any, account: Account | null }) {
			if (account?.provider === "google" && user.email) {
				try {
					const existingUser = await prisma.user.findFirst({ where: { email: user.email } });
					if (!existingUser) {
						const newUser = await prisma.user.create({
							data: {
								email: user.email,
								firstName: user.name?.split(" ")[0] || "",
								lastName: user.name?.split(" ").slice(1).join(" ") || "",
								password: "",
								role: "ADMIN",
								subscriptionStatus: "active",
								subscriptionPlan: "Free",
								subscriptionCurrentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
							},
						});
						const newTenant = await prisma.tenant.create({
							data: { name: `${newUser.firstName}'s tenant`, adminId: Number(newUser.id), users: { connect: { id: Number(newUser.id) } } },
						});
						await prisma.user.update({ where: { id: newUser.id }, data: { tenantId: newTenant.id } });
						await prisma.database.create({ data: { name: "Main Database", tenantId: newTenant.id } });
					} else {
						// Check if existing user is deactivated
						if (existingUser.isActive === false) {
							console.warn(`Login attempt by deactivated user (Google): ${existingUser.email}`);
							return false;
						}
					}
				} catch (error) {
					console.error("Google OAuth signIn error:", error);
				}
			}
			
			// For credentials provider, check isActive
			if (account?.provider === "credentials" && user.email) {
				const dbUser = await prisma.user.findFirst({ where: { email: user.email } });
				if (dbUser && dbUser.isActive === false) {
					console.warn(`Login attempt by deactivated user (Credentials): ${dbUser.email}`);
					return false;
				}
			}
			
			return true;
		},
		async jwt({ token, account, user }: { token: JWT, account: Account, user: User }) {
			try {
				if (user && account) {
					if (account.provider === "google" && user.email) {
						let dbUser = await prisma.user.findFirst({ where: { email: user.email } });
						if (!dbUser) {
							const newUser = await prisma.user.create({
								data: {
									email: user.email,
									firstName: user.name?.split(" ")[0] || "",
									lastName: user.name?.split(" ").slice(1).join(" ") || "",
									password: "",
									role: "ADMIN",
									subscriptionStatus: "active",
									subscriptionPlan: "Free",
									subscriptionCurrentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
								},
							});
							const newTenant = await prisma.tenant.create({ data: { name: `${newUser.firstName}'s tenant`, adminId: Number(newUser.id), users: { connect: { id: Number(newUser.id) } } } });
							await prisma.user.update({ where: { id: newUser.id }, data: { tenantId: newTenant.id } });
							await prisma.database.create({ data: { name: "Main Database", tenantId: newTenant.id } });
							// Refetch user to get the updated tenantId
							dbUser = await prisma.user.findFirst({ where: { id: newUser.id } });
						}
						Object.assign(token, {
							id: dbUser.id.toString(),
							email: dbUser.email,
							firstName: dbUser.firstName,
							lastName: dbUser.lastName,
							role: dbUser.role,
							tenantId: dbUser.tenantId ? dbUser.tenantId.toString() : null,
							profileImage: dbUser.profileImage || undefined,
							customJWT: generateToken({ userId: dbUser.id, role: dbUser.role.toString() }, "7d"),
						});
					} else if (user.role) {
						Object.assign(token, {
							id: user.id,
							email: user.email,
							firstName: user.firstName,
							lastName: user.lastName,
							role: user.role,
							tenantId: user.tenantId,
							profileImage: (user as any).profileImage || undefined,
							customJWT: generateToken({ userId: Number(user.id), role: user.role.toString() }, "7d"),
						});
					}
				}

				if (!token.customJWT && token.id && token.role) {
					token.customJWT = generateToken({ userId: Number(token.id), role: token.role.toString() }, "7d");
				}

			if (token.id && token.role) {
				const dbUser = await prisma.user.findFirst({ 
					where: { id: parseInt(token.id as string) }, 
					select: { subscriptionStatus: true, subscriptionPlan: true, subscriptionCurrentPeriodEnd: true, profileImage: true, tenantId: true } 
				});
				if (dbUser) {
					token.subscriptionStatus = dbUser.subscriptionStatus;
					token.subscriptionPlan = dbUser.subscriptionPlan;
					token.subscriptionCurrentPeriodEnd = dbUser.subscriptionCurrentPeriodEnd;
					token.profileImage = dbUser.profileImage || undefined;
					token.tenantId = dbUser.tenantId ? dbUser.tenantId.toString() : null;
				}
			}

				if (account?.access_token) token.accessToken = account.access_token;

				return token;
			} catch (error) {
				console.error("JWT callback error:", error);
				return token;
			}
		},
		async session({ session, token }: { session: Session, token: JWT }) {
			if (token && token.role) {
				session.user = {
					id: (token.id as string) || "",
					email: (token.email as string) || "",
					firstName: (token.firstName as string) || "",
					lastName: (token.lastName as string) || "",
					role: (token.role as any) || null,
					name: token.firstName && token.lastName ? `${token.firstName} ${token.lastName}` : token.email || "",
					image: (token.profileImage as string) || undefined,
					profileImage: (token.profileImage as string) || undefined,
					tenantId: (token.tenantId as string) || null,
				};
				session.accessToken = (token.accessToken as string) || "";
				session.customJWT = (token.customJWT as string) || "";
				session.subscription = {
					status: (token.subscriptionStatus as string) || null,
					plan: (token.subscriptionPlan as string) || null,
					currentPeriodEnd: (token.subscriptionCurrentPeriodEnd as Date) || null,
				};
			}
			return session;
		},
	},
	session: { strategy: "jwt" as const, maxAge: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
	cookies: {
		sessionToken: { 
			name: process.env.NODE_ENV === "production" ? `__Secure-next-auth.session-token` : `next-auth.session-token`, 
			options: { 
				httpOnly: true, 
				sameSite: process.env.NODE_ENV === "production" ? "none" as const : "lax" as const, 
				path: "/", 
				secure: process.env.NODE_ENV === "production" || process.env.NEXTAUTH_URL?.startsWith("https"),
				domain: process.env.NODE_ENV === "production" ? undefined : "localhost",
				maxAge: 30 * 24 * 60 * 60, // 30 days
			} 
		},
		callbackUrl: { 
			name: process.env.NODE_ENV === "production" ? `__Secure-next-auth.callback-url` : `next-auth.callback-url`, 
			options: { 
				sameSite: process.env.NODE_ENV === "production" ? "none" as const : "lax" as const, 
				path: "/", 
				secure: process.env.NODE_ENV === "production" || process.env.NEXTAUTH_URL?.startsWith("https"),
				domain: process.env.NODE_ENV === "production" ? undefined : "localhost",
				maxAge: 60 * 15, // 15 minutes
			} 
		},
		csrfToken: { 
			name: process.env.NODE_ENV === "production" ? `__Secure-next-auth.csrf-token` : `next-auth.csrf-token`, 
			options: { 
				httpOnly: true, 
				sameSite: process.env.NODE_ENV === "production" ? "none" as const : "lax" as const, 
				path: "/", 
				secure: process.env.NODE_ENV === "production" || process.env.NEXTAUTH_URL?.startsWith("https"),
				domain: process.env.NODE_ENV === "production" ? undefined : "localhost",
				maxAge: 60 * 15, // 15 minutes
			} 
		},
		pkceCodeVerifier: { 
			name: process.env.NODE_ENV === "production" ? `__Secure-next-auth.pkce.code_verifier` : `next-auth.pkce.code_verifier`, 
			options: { 
				httpOnly: true, 
				sameSite: process.env.NODE_ENV === "production" ? "none" as const : "lax" as const, 
				path: "/", 
				secure: process.env.NODE_ENV === "production" || process.env.NEXTAUTH_URL?.startsWith("https"),
				maxAge: 60 * 15, // 15 minutes
			} 
		},
		state: { 
			name: process.env.NODE_ENV === "production" ? `__Secure-next-auth.state` : `next-auth.state`, 
			options: { 
				httpOnly: true, 
				sameSite: process.env.NODE_ENV === "production" ? "none" as const : "lax" as const, 
				path: "/", 
				secure: process.env.NODE_ENV === "production" || process.env.NEXTAUTH_URL?.startsWith("https"),
				maxAge: 60 * 15, // 15 minutes
			} 
		},
		nonce: { 
			name: process.env.NODE_ENV === "production" ? `__Secure-next-auth.nonce` : `next-auth.nonce`, 
			options: { 
				httpOnly: true, 
				sameSite: process.env.NODE_ENV === "production" ? "none" as const : "lax" as const, 
				path: "/", 
				secure: process.env.NODE_ENV === "production" || process.env.NEXTAUTH_URL?.startsWith("https"),
				maxAge: 60 * 15, // 15 minutes
			} 
		},
	},
	jwt: { maxAge: 30 * 24 * 60 * 60 },
	useSecureCookies: process.env.NODE_ENV === "production" || process.env.NEXTAUTH_URL?.startsWith("https"),
	secret: process.env.NEXTAUTH_SECRET,
	debug: process.env.NODE_ENV === "development",
	trustHost: true,
	adapter: undefined,
	events: {
		async signIn({ user, account }: { user: User | any, account: Account | null }) { },
		async signOut() { },
		async createUser({ user }: { user: User }) { },
		async session() { },
	},
	onError: async (error: Error, context: any) => { console.error("NextAuth error:", error, "Context:", context); },
};
interface JwtPayload {
	userId: number;
	role: string;
	iat?: number;
	exp?: number;
}

export function generateToken(
	payload: Omit<JwtPayload, "iat" | "exp">,
	exp?: SignOptions["expiresIn"],
	JWT_KEY: Secret = JWT_SECRET,
): string {
	const options: SignOptions = {};
	if (exp) {
		options.expiresIn = exp;
	}

	return jwt.sign(payload, JWT_KEY, options);
}

export async function hashPassword(password: string): Promise<string> {
	// Enhanced bcrypt configuration with higher salt rounds for better security
	const saltRounds = 14; // Increased from 10 to 14 for better security
	return await bcrypt.hash(password, saltRounds);
}
export async function verifyPassword(
	inputPassword: string,
	hashedPassword: string,
): Promise<boolean> {
	try {
		return await bcrypt.compare(inputPassword, hashedPassword);
	} catch (error) {
		// If verification fails, return false instead of throwing
		return false;
	}
}

// Legacy auth functions removed - use NextAuth session handling instead

export function verifyToken(token: string): boolean {
	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		return !!decoded;
	} catch (error) {
		return false;
	}
}

export async function checkTableEditPermission(
	userId: number,
	tableId: number,
	tenantId: number,
): Promise<boolean> {
	// First check if user is admin - admins can edit everything
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { role: true },
	});

	if (!user) return false;
	if (user.role === "ADMIN") return true;

	// For non-admins, check table permissions
	const tablePermission = await prisma.findFirstWithCache(
		prisma.tablePermission,
		{
			where: {
				userId: userId,
				tableId: tableId,
				tenantId: tenantId,
				canEdit: true,
			},
		});

	return !!tablePermission;
}

/**
 * Check if user has permission to edit a specific column
 * Admins have all permissions, other users are checked based on column permissions
 */
export async function checkColumnEditPermission(
	userId: number,
	columnId: number,
	tableId: number,
	tenantId: number,
): Promise<boolean> {
	// First check if user is admin - admins can edit everything
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { role: true },
	});

	if (!user) return false;
	if (user.role === "ADMIN") return true;

	// For non-admins, check column permissions first, then fallback to table permissions
	const columnPermission = await prisma.columnPermission.findFirst({
		where: {
			userId: userId,
			columnId: columnId,
			tenantId: tenantId,
			canEdit: true,
		},
	});

	if (columnPermission) return true;

	// Fallback: check table permissions
	return await checkTableEditPermission(userId, tableId, tenantId);
}

/**
 * Check if user can perform write operations based on role
 * VIEWER can only read, EDITOR and ADMIN can write
 */
export function canUserWrite(userRole: string): boolean {
	return userRole === "ADMIN" || userRole === "EDITOR";
}

/**
 * Check if user can read data based on role
 * All authenticated users can read
 */
export function canUserRead(userRole: string): boolean {
	return userRole === "ADMIN" || userRole === "EDITOR" || userRole === "VIEWER";
}

// Legacy validatePublicApiAccess function removed - use NextAuth session handling instead

// Additional auth utility functions for testing compatibility
export async function isAdmin(request: Request): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.role === 'ADMIN';
  } catch {
    return false;
  }
}

export function verifyLogin(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  return verifyToken(token);
}

export function getUserId(request: Request, secret?: Secret): number | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, secret || JWT_SECRET) as any;
    return decoded.userId || decoded.id;
  } catch {
    return null;
  }
}

export function getUserRole(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.role;
  } catch {
    return null;
  }
}

export async function getUserFromRequest(request: Request): Promise<{ userId: number; role: string } | Response> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { userId: decoded.userId || decoded.id, role: decoded.role };
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
}

export async function checkUserTenantAccess(userId: number, tenantId: number): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true }
    });
    
    return user?.tenantId === tenantId;
  } catch {
    return false;
  }
}

export async function validatePublicApiAccess(request: Request): Promise<{
  isValid: boolean;
  userId?: number;
  tenantId?: number;
  role?: string;
  error?: string;
}> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { isValid: false, error: 'Missing authorization header' };
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return { isValid: false, error: 'Invalid authorization format' };
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId || decoded.id;
    const role = decoded.role;
    
    // Check if user has tenant access (direct relationship in schema)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true }
    });
    
    if (!user || !user.tenantId) {
      return { isValid: false, error: 'User not found or no tenant access' };
    }
    
    return {
      isValid: true,
      userId,
      tenantId: user.tenantId,
      role,
    };
  } catch {
    return { isValid: false, error: 'Invalid token' };
  }
}
