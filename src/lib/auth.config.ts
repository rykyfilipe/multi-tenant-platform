/** @format */

import type { NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword } from "./auth";
import prisma, { DEFAULT_CACHE_STRATEGIES } from "@/lib/prisma";

export const authConfig = {
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
					const user = await prisma.findFirstWithCache(
						prisma.user,
						{
							where: {
								email: credentials.email,
							},
						},
						DEFAULT_CACHE_STRATEGIES.user,
					);

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
		redirect({ url, baseUrl }) {
			// Allows relative callback URLs
			if (url.startsWith("/")) return `${baseUrl}${url}`;
			// Allows callback URLs on the same origin
			else if (new URL(url).origin === baseUrl) return url;
			return baseUrl;
		},
		signIn({ user, account, profile }) {
			if (account?.provider === "google" && user.email) {
				// For Google OAuth, we'll handle user creation in the JWT callback
				// to avoid async operations in the signIn callback
				return true;
			}
			return true;
		},
		async jwt({ token, account, user }) {
			try {
				if (user && (user as any).role) {
					token.id = user.id;
					token.email = user.email;
					token.firstName = (user as any).firstName;
					token.lastName = (user as any).lastName;
					token.role = (user as any).role;
					token.tenantId = (user as any).tenantId;
					token.profileImage = (user as any).profileImage || undefined;
				}

				if (account?.provider === "google" && token.email) {
					try {
						const dbUser = await prisma.findFirstWithCache(
							prisma.user,
							{ where: { email: token.email } },
							DEFAULT_CACHE_STRATEGIES.user,
						);

						if (dbUser && dbUser.role) {
							token.id = dbUser.id.toString();
							token.firstName = dbUser.firstName;
							token.lastName = dbUser.lastName;
							token.role = dbUser.role;
							token.tenantId = dbUser.tenantId?.toString() ?? null;
							token.profileImage = dbUser.profileImage || undefined;
						} else {
							// Create new user for Google OAuth if it doesn't exist
							try {
								const newUser = await prisma.user.create({
									data: {
										email: token.email,
										firstName: (user as any)?.name?.split(" ")[0] || "",
										lastName:
											(user as any)?.name?.split(" ").slice(1).join(" ") || "",
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

								await prisma.database.create({
									data: {
										tenantId: newTenant.id,
									},
								});

								await prisma.user.update({
									where: { id: newUser.id },
									data: { tenantId: newTenant.id },
								});

								// Update token with new user data
								token.id = newUser.id.toString();
								token.firstName = newUser.firstName;
								token.lastName = newUser.lastName;
								token.role = newUser.role;
								token.tenantId = newTenant.id.toString();
							} catch (createError) {
								console.error("Error creating Google OAuth user:", createError);
							}
						}
					} catch (error) {
						console.error("Error fetching Google user data:", error);
					}
				}

				return token;
			} catch (error) {
				console.error("JWT callback error:", error);
				return token;
			}
		},
		async session({ session, token }) {
			try {
				if (token && (token as any).role) {
					session.user = {
						id: (token.id as string) || "",
						email: (token.email as string) || "",
						firstName: ((token as any).firstName as string) || "",
						lastName: ((token as any).lastName as string) || "",
						role: ((token as any).role as any) || null,
						name:
							(token as any).firstName && (token as any).lastName
								? `${(token as any).firstName} ${(token as any).lastName}`
								: token.email || "",
						image: ((token as any).profileImage as string) || undefined,
						tenantId: ((token as any).tenantId as string) || null,
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
		strategy: "jwt",
		maxAge: 30 * 24 * 60 * 60, // 30 days
		updateAge: 24 * 60 * 60, // 24 hours
	},
	trustHost: true,
} satisfies NextAuthConfig;
