/** @format */

import { DefaultJWT } from "next-auth/jwt";

// Define the Role type
export type Role = "ADMIN" | "EDITOR" | "VIEWER";

declare module "next-auth" {
	/**
	 * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
	 */
	interface Session {
		user: {
			id: string;
			email: string;
			firstName: string;
			lastName: string;
			role: Role;
			name: string;
			image?: string;
			profileImage?: string;
			tenantId?: string | null;
		};
		accessToken?: string;
		customJWT?: string;
		subscription?: {
			status: string | null;
			plan: string | null;
			currentPeriodEnd: Date | null;
		};
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
