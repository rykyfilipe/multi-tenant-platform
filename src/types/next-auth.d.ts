/** @format */

import NextAuth, { DefaultUser } from "next-auth";
import { User } from "./user";
import { JWT as DefaultJWT } from "next-auth/jwt";
import { ApiToken } from "@/generated/prisma";

declare module "next-auth" {
	/**
	 * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
	 */
	interface Session {
		user: User;
		accessToken?: string;
		customJWT?: string;
		subscription?: {
			status: string | null;
			plan: string | null;
			currentPeriodEnd: Date | null;
		};
	}

	interface Account {
		id: number;
		userId: number;
		provider: string;
		providerAccountId: string;
		refresh_token: string | null;
		access_token: string | null;
		expires_at: number | null;
		token_type: string | null;
		scope: string | null;
		id_token: string | null;
		session_state: string | null;
	}

	interface User {
		id: string;
		email: string;
		firstName: string;
		lastName: string;
		role: Role;
		tenantId?: string | null;
		image?: string;
		profileImage?: string;
	}
}

declare module "next-auth/jwt" {
	interface JWT extends DefaultJWT {
		id?: string;
		firstName?: string;
		lastName?: string;
		role?: Role;
		tenantId?: string | null;
		profileImage?: string;
		accessToken?: string;
		customJWT?: string;
		subscriptionStatus?: string | null;
		subscriptionPlan?: string | null;
		subscriptionCurrentPeriodEnd?: Date | null;
	}
}
