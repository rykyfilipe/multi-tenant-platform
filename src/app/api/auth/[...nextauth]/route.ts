/** @format */

import NextAuth, { Account, User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import type { Adapter } from "next-auth/adapters";
import { JWT } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { generateToken, JWT_SECRET } from "@/lib/auth";

const authOptions = {
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
				console.log(credentials);

				const user = await prisma.user.findUnique({
					where: {
						email: credentials.email,
					},
				});

				if (!user) {
					return null;
				}
				console.log(user);

				// Verify the password
				if (!user.password) return null;

				const isPasswordValid = await verifyPassword(
					credentials.password,
					user.password,
				);

				console.log(isPasswordValid);

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
				};
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
			// Initial sign-in handling (user is available)
			if (user) {
				console.log("Initial sign-in user:", user);
				token.id = user.id;
				token.email = user.email;
				token.firstName = user.firstName;
				token.lastName = user.lastName;
				token.role = user.role;
				token.tenantId = user.tenantId;

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
						console.log("Found Google user in DB:", dbUser);
						token.id = dbUser.id.toString();
						token.firstName = dbUser.firstName;
						token.lastName = dbUser.lastName;
						token.role = dbUser.role;
						token.tenantId = dbUser.tenantId?.toString() ?? null;

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
					console.log("Regenerated customJWT:", token.customJWT);
				} catch (error) {
					console.error("Error regenerating token:", error);
				}
			}

			// Store access token from OAuth providers
			if (account?.access_token) {
				token.accessToken = account.access_token;
			}

			return token;
		},
		async session({ session, token }: { session: Session; token: JWT }) {
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
				};
				session.accessToken = (token.accessToken as string) || "";
				session.customJWT = (token.customJWT as string) || "";

				console.log("Token customJWT in session:", token.customJWT);
				console.log("Session customJWT:", session.customJWT);
			}

			console.log("Final Session:", session);
			return session;
		},
	},

	session: {
		strategy: "jwt" as const, // Explicitly use JWT strategy
	},
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
