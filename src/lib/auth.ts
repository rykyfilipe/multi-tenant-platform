/** @format */

import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { NextResponse } from "next/server";
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
					const user = await prisma.user.findUnique({
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
					console.error("Error in authorize:", error);
					return null;
				}
			},
		}),
	],
	callbacks: {
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
				// Check if user exists in database, create if not
				try {
					const existingUser = await prisma.user.findUnique({
						where: { email: user.email },
					});

					if (!existingUser) {
						// Create new user for Google OAuth
						const newUser = await prisma.user.create({
							data: {
								email: user.email,
								firstName: user.name?.split(" ")[0] || "",
								lastName: user.name?.split(" ").slice(1).join(" ") || "",
								password: "", // OAuth users don't need password
								role: "ADMIN", // Set default role
								subscriptionStatus: "active",
								subscriptionPlan: "Starter",
								subscriptionCurrentPeriodEnd: new Date(
									Date.now() + 365 * 24 * 60 * 60 * 1000,
								), // 1 year from now
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
					}
				} catch (error) {
					console.error("Error creating/checking user:", error);
					return false; // Prevent sign in on error
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
				// Initial sign-in handling (user is available)
				if (user) {
					token.id = user.id;
					token.email = user.email;
					token.firstName = user.firstName;
					token.lastName = user.lastName;
					token.role = user.role;
					token.tenantId = user.tenantId;
					token.profileImage = (user as any).profileImage || undefined;

					const payload = {
						userId: Number(user.id),
						role: user.role,
					};

					token.customJWT = generateToken(payload, "7d");
				}

				// For Google OAuth users
				if (account?.provider === "google" && token.email) {
					try {
						const dbUser = await prisma.user.findUnique({
							where: { email: token.email },
						});

						if (dbUser) {
							token.id = dbUser.id.toString();
							token.firstName = dbUser.firstName;
							token.lastName = dbUser.lastName;
							token.role = dbUser.role;
							token.tenantId = dbUser.tenantId?.toString() ?? null;
							token.profileImage = dbUser.profileImage || undefined;

							const payload = {
								userId: dbUser.id,
								role: dbUser.role,
							};

							token.customJWT = generateToken(payload, "7d");
						}
					} catch (error) {
						console.error("Error fetching Google user data:", error);
					}
				}

				// For subsequent calls when user is undefined but we have token data
				if (!token.customJWT && token.id) {
					try {
						const payload = {
							userId: Number(token.id),
							role: token.role,
						};

						token.customJWT = generateToken(payload, "7d");
					} catch (error) {
						console.error("Error regenerating token:", error);
					}
				}

				// Fetch subscription data for all cases
				if (token.id) {
					try {
						const dbUser = await prisma.user.findUnique({
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
				console.error("Error in JWT callback:", error);
				return token;
			}
		},
		async session({ session, token }: { session: Session; token: JWT }) {
			try {
				// Add user data from token to session
				if (token) {
					session.user = {
						id: (token.id as string) || token.sub || "",
						email: (token.email as string) || "",
						firstName: (token.firstName as string) || "",
						lastName: (token.lastName as string) || "",
						role: (token.role as any) || null,
						name:
							token.firstName && token.lastName
								? `${token.firstName} ${token.lastName}`
								: token.name || token.email || "",
						image: (token.profileImage as string) || undefined,
						profileImage: (token.profileImage as string) || undefined,
						tenantId: (token.tenantId as string) || null,
					};
					session.accessToken = (token.accessToken as string) || "";
					session.customJWT = (token.customJWT as string) || "";

					// Add subscription data to session
					session.subscription = {
						status: (token.subscriptionStatus as string) || null,
						plan: (token.subscriptionPlan as string) || null,
						currentPeriodEnd:
							(token.subscriptionCurrentPeriodEnd as Date) || null,
					};
				}

				return session;
			} catch (error) {
				console.error("Error in session callback:", error);
				return session;
			}
		},
	},

	session: {
		strategy: "jwt" as const, // Explicitly use JWT strategy
		maxAge: 7 * 24 * 60 * 60, // 7 days
		updateAge: 7 * 24 * 60 * 60, // 7 days - same as maxAge to prevent frequent updates
	},

	debug: process.env.NODE_ENV === "development",

	pages: {
		signIn: "/",
		error: "/",
	},
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
	const salt = await bcrypt.genSalt(10);
	return bcrypt.hash(password, salt);
}
export async function verifyPassword(
	inputPassword: string,
	hashedPassword: string,
): Promise<boolean> {
	return bcrypt.compare(inputPassword, hashedPassword);
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

	// Token verification logging removed for security

	if (!token) {
		if (process.env.NODE_ENV === "development") {
			// No token found
		}
		return false;
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		if (process.env.NODE_ENV === "development") {
			// Token verified successfully
		}
		return !!decoded;
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			// Token verification failed
		}
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
): Promise<{ userId: number; role: string } | NextResponse> {
	if (!verifyLogin(request)) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userId = getUserId(request);
	const role = getUserRole(request);

	if (!userId || !role) {
		return NextResponse.json({ error: "Invalid token" }, { status: 401 });
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

export async function verifyPublicToken(request: Request): Promise<any> {
	const token = request.headers.get("Authorization")?.split(" ")[1];
	if (!token) return false;

	try {
		const storedToken: any = await prisma.apiToken.findFirst({
			where: { tokenHash: token },
			select: { id: true, userId: true, scopes: true, expiresAt: true },
		});
		if (!storedToken) return false;
		return true;
	} catch (error) {
		return false;
	}
}

export async function getPublicUserFromRequest(
	request: Request,
): Promise<{ userId: number; role: string } | NextResponse> {
	const isValid = await verifyPublicToken(request);
	if (!isValid) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userId = getUserId(request, PUBLIC_JWT_SECRET);
	const role = getUserRole(request, PUBLIC_JWT_SECRET);

	if (!userId || !role) {
		return NextResponse.json({ error: "Invalid token" }, { status: 401 });
	}

	return { userId, role };
}
