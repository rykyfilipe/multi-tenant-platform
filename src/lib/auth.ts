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
import { Account, User } from "next-auth";

import GoogleProvider from "next-auth/providers/google";
import { Session } from "next-auth";
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
				},
			},
		}),
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "text", placeholder: "jsmith" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials, req) {
				if (!credentials?.email || !credentials?.password) {
					return null;
				}

				try {
					const user = await prisma.user.findFirst({
						where: {
							email: credentials.email,
						},
					});

					if (!user) {
						return null;
					}

					// Verify the password
					if (!user.password) return null;

					const isPasswordValid = await verifyPassword(
						credentials.password,
						user.password,
					);

					if (!isPasswordValid) {
						return null;
					}

					return {
						id: user.id.toString(),
						firstName: user.firstName,
						lastName: user.lastName,
						email: user.email,
						name: `${user.firstName} ${user.lastName}`,
						role: user.role,
						tenantId: user.tenantId?.toString() ?? null,
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
		async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
			// Handle relative URLs
			if (url.startsWith("/")) return `${baseUrl}${url}`;

			// Handle URLs on the same origin
			if (new URL(url).origin === baseUrl) return url;

			// For production, ensure we redirect to the dashboard after successful auth
			if (url.includes("callbackUrl")) {
				const callbackUrl = new URL(url).searchParams.get("callbackUrl");
				if (callbackUrl && callbackUrl.startsWith("/")) {
					return `${baseUrl}${callbackUrl}`;
				}
			}

			// Default fallback
			return `${baseUrl}/home/dashboard`;
		},
		async signIn({
			user,
			account,
			profile,
		}: {
			user: User;
			account: Account | null;
			profile?: any;
		}) {
			if (account?.provider === "google" && user.email) {
				try {
					const existingUser = await prisma.user.findFirst({
						where: { email: user.email },
					});

					if (!existingUser) {
						// Create new user for Google OAuth
						const newUser = await prisma.user.create({
							data: {
								email: user.email,
								firstName: user.name?.split(" ")[0] || "",
								lastName: user.name?.split(" ").slice(1).join(" ") || "",
								password: "",
								role: "ADMIN",
								subscriptionStatus: "active",
								subscriptionPlan: "Free",
								subscriptionCurrentPeriodEnd: new Date(
									Date.now() + 365 * 24 * 60 * 60 * 1000,
								),
							},
						});

						const newTenant = await prisma.tenant.create({
							data: {
								name: newUser.firstName + "'s tenant",
								adminId: Number(newUser.id),
								users: { connect: { id: Number(newUser.id) } },
							},
						});

						const newDatabase = await prisma.database.create({
							data: {
								tenantId: newTenant.id,
							},
						});

						await prisma.user.update({
							where: { id: newUser.id },
							data: { tenantId: newTenant.id },
						});
					}
				} catch (error) {
					console.error("Error creating Google OAuth user:", error);
					return false;
				}
			}
			return true;
		},
		async jwt({
			token,
			account,
			user,
		}: {
			token: JWT;
			account: Account | null;
			user?: User;
		}) {
			try {
				if (user && user.role) {
					token.id = user.id;
					token.email = user.email;
					token.firstName = user.firstName;
					token.lastName = user.lastName;
					token.role = user.role;
					token.tenantId = user.tenantId;
					token.profileImage = (user as any).profileImage || undefined;

					// Generate custom JWT for API usage
					const payload = {
						userId: Number(user.id),
						role: user.role.toString(),
					};
					token.customJWT = generateToken(payload, "7d");
				}

				if (account?.provider === "google" && token.email) {
					try {
						const dbUser = await prisma.user.findFirst({
							where: { email: token.email },
						});

						if (dbUser && dbUser.role) {
							token.id = dbUser.id.toString();
							token.firstName = dbUser.firstName;
							token.lastName = dbUser.lastName;
							token.role = dbUser.role;
							token.tenantId = dbUser.tenantId?.toString() ?? null;
							token.profileImage = dbUser.profileImage || undefined;

							// Generate custom JWT for API usage
							const payload = {
								userId: dbUser.id,
								role: dbUser.role.toString(),
							};
							token.customJWT = generateToken(payload, "7d");
						}
					} catch (error) {
						console.error("Error fetching Google user data:", error);
					}
				}

				// For subsequent calls when user is undefined but we have token data
				if (!token.customJWT && token.id && token.role) {
					try {
						const payload = {
							userId: Number(token.id),
							role: token.role.toString(),
						};
						token.customJWT = generateToken(payload, "7d");
					} catch (error) {
						console.error("Error regenerating token:", error);
					}
				}

				if (token.id && token.role) {
					try {
						const dbUser = await prisma.user.findFirst({
							where: { id: parseInt(token.id as string) },
							select: {
								subscriptionStatus: true,
								subscriptionPlan: true,
								subscriptionCurrentPeriodEnd: true,
								profileImage: true,
							},
						});

						if (dbUser) {
							token.subscriptionStatus = dbUser.subscriptionStatus;
							token.subscriptionPlan = dbUser.subscriptionPlan;
							token.subscriptionCurrentPeriodEnd =
								dbUser.subscriptionCurrentPeriodEnd;
							token.profileImage = dbUser.profileImage || undefined;
						}
					} catch (error) {
						console.error("Error fetching subscription data:", error);
					}
				}

				// Store access token from OAuth providers
				if (account?.access_token) {
					token.accessToken = account.access_token;
				}

				return token;
			} catch (error) {
				console.error("JWT callback error:", error);
				return token;
			}
		},
		async session({ session, token }: { session: Session; token: JWT }) {
			try {
				if (token && token.role) {
					session.user = {
						id: (token.id as string) || "",
						email: (token.email as string) || "",
						firstName: (token.firstName as string) || "",
						lastName: (token.lastName as string) || "",
						role: (token.role as any) || null,
						name:
							token.firstName && token.lastName
								? `${token.firstName} ${token.lastName}`
								: token.email || "",
						image: (token.profileImage as string) || undefined,
						profileImage: (token.profileImage as string) || undefined,
						tenantId: (token.tenantId as string) || null,
					};

					// Add custom JWT and access token for API usage
					session.accessToken = (token.accessToken as string) || "";
					session.customJWT = (token.customJWT as string) || "";

					session.subscription = {
						status: (token.subscriptionStatus as string) || null,
						plan: (token.subscriptionPlan as string) || null,
						currentPeriodEnd:
							(token.subscriptionCurrentPeriodEnd as Date) || null,
					};
				}

				return session;
			} catch (error) {
				console.error("Session callback error:", error);
				return session;
			}
		},
	},
	session: {
		strategy: "jwt" as const,
		maxAge: 30 * 24 * 60 * 60, // 30 days
		updateAge: 24 * 60 * 60, // 24 hours
	},
	// Cookie configuration for NextAuth v4 in App Router
	// Note: In v4, cookie names are automatically prefixed with NEXTAUTH_URL
	cookies: {
		sessionToken: {
			name: `next-auth.session-token`,
			options: {
				httpOnly: true,
				sameSite: "lax" as const,
				path: "/",
				secure: process.env.NODE_ENV === "production",
			},
		},
		callbackUrl: {
			name: `next-auth.callback-url`,
			options: {
				sameSite: "lax" as const,
				path: "/",
				secure: process.env.NODE_ENV === "production",
			},
		},
		csrfToken: {
			name: `next-auth.csrf-token`,
			options: {
				httpOnly: true,
				sameSite: "lax" as const,
				path: "/",
				secure: process.env.NODE_ENV === "production",
			},
		},
	},
	jwt: {
		maxAge: 30 * 24 * 60 * 60, // 30 days
	},
	useSecureCookies: process.env.NODE_ENV === "production",
	secret: process.env.NEXTAUTH_SECRET,
	debug: process.env.NODE_ENV === "development",
	trustHost: true,
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

export async function isAdmin(request: Request): Promise<boolean> {
	const token = request.headers.get("Authorization")?.split(" ")[1];
	if (!token) return false;

	try {
		const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
		return decoded.role === "ADMIN";
	} catch (error) {
		return false;
	}
}

export function verifyLogin(request: Request): boolean {
	const token = request.headers.get("Authorization")?.split(" ")[1];

	if (!token) {
		return false;
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET);

		return !!decoded;
	} catch (error) {
		return false;
	}
}

export function getUserId(
	request: Request,
	JWT_KEY: Secret = JWT_SECRET,
): number | null {
	const token = request.headers.get("Authorization")?.split(" ")[1];
	if (!token) return null;

	try {
		const decoded = jwt.verify(token, JWT_KEY) as { userId: number };
		return decoded.userId;
	} catch (error) {
		return null;
	}
}
export function getUserRole(
	request: Request,
	JWT_KEY: Secret = JWT_SECRET,
): string | null {
	const token = request.headers.get("Authorization")?.split(" ")[1];
	if (!token) return null;

	try {
		const decoded = jwt.verify(token, JWT_KEY) as { role: string };
		return decoded.role;
	} catch (error) {
		return null;
	}
}
export async function getUserFromRequest(
	request: Request,
): Promise<{ userId: number; role: string } | Response> {
	if (!verifyLogin(request)) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const userId = getUserId(request);
	const role = getUserRole(request);

	if (!userId || !role) {
		return new Response(JSON.stringify({ error: "Invalid token" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	return { userId, role };
}

export async function checkUserTenantAccess(userId: number, tenantId: number) {
	const isMember = await prisma.user.findFirst({
		where: {
			id: userId,
			tenantId: tenantId,
		},
	});

	return !!isMember;
}

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
	const tablePermission = await prisma.tablePermission.findFirst({
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

/**
 * Validate JWT token and extract user info for public API
 */
export async function validatePublicApiAccess(request: Request) {
	const authHeader = request.headers.get("authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return {
			isValid: false,
			error: "Missing or invalid authorization header",
			status: 401,
		};
	}

	const token = authHeader.substring(7);

	// Extract user info from JWT
	const userId = getUserId(request, PUBLIC_JWT_SECRET);
	const role = getUserRole(request, PUBLIC_JWT_SECRET);

	if (!userId || !role) {
		return {
			isValid: false,
			error: "Invalid token data",
			status: 401,
		};
	}

	// Get user tenant info
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { tenantId: true, role: true },
	});

	if (!user || !user.tenantId) {
		return {
			isValid: false,
			error: "User not associated with any tenant",
			status: 403,
		};
	}

	return {
		isValid: true,
		userId,
		role: user.role,
		tenantId: user.tenantId,
	};
}
