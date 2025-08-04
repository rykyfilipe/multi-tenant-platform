/** @format */

"use client";

import { Tenant } from "@/types/tenant";
import { User } from "@/types/user";
import { useSession } from "next-auth/react";
import { createContext, useContext, useState, useEffect } from "react";

interface AppContextType {
	token: string | null;
	setToken: (token: string | null) => void;
	showAlert: (
		message: string,
		type?: "success" | "error" | "warning" | "info",
	) => void;
	hideAlert: () => void;
	alertMessage: string;
	alertType: "success" | "error" | "warning" | "info";
	isAlertVisible: boolean;
	user: any;
	setUser: (user: any) => void;
	setLoading: (x: boolean) => void;
	loading: boolean;
	tenant: Tenant | null;
	setTenant: (tenant: Tenant) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
	const { data: session } = useSession();

	const [user, setUser] = useState<User | null>(null);
	const [tenant, setTenant] = useState<Tenant | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [alertMessage, setAlertMessage] = useState("");
	const [alertType, setAlertType] = useState<
		"success" | "error" | "warning" | "info"
	>("success");
	const [isAlertVisible, setIsAlertVisible] = useState(false);

	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (session) {
			setUser({
				...session.user,
				id: Number(session.user.id),
			});

			// Debug logging
			if (process.env.NODE_ENV === "development") {
				console.log("🔍 Session Debug:", {
					hasSession: !!session,
					hasCustomJWT: !!session.customJWT,
					customJWTLength: session.customJWT?.length || 0,
					userId: session.user?.id,
				});
			}

			setToken(session.customJWT || "");
		}

		setLoading(false);
	}, [session]);

	// Configuration check (only in development)
	useEffect(() => {
		if (process.env.NODE_ENV === "development") {
			// Simple configuration check
			const issues: string[] = [];
			const warnings: string[] = [];

			if (!process.env.NEXT_PUBLIC_NEXTAUTH_SECRET) {
				issues.push("Missing NEXTAUTH_SECRET");
			}
			if (!process.env.NEXT_PUBLIC_JWT_SECRET) {
				issues.push("Missing JWT_SECRET");
			}
			if (!process.env.NEXT_PUBLIC_PUBLIC_JWT_SECRET) {
				issues.push("Missing PUBLIC_JWT_SECRET");
			}

			if (issues.length > 0) {
				console.error("❌ Configuration Issues:", issues);
			} else {
				console.log("✅ Configuration looks good!");
			}
		}
	}, []);

	useEffect(() => {
		if (!token) return;
		const fetchTenant = async () => {
			try {
				if (process.env.NODE_ENV === "development") {
					console.log("🔍 API Request Debug:", {
						hasToken: !!token,
						tokenLength: token?.length || 0,
						tokenStart: token?.substring(0, 20) + "...",
					});
				}

				const response = await fetch("/api/tenants", {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (process.env.NODE_ENV === "development") {
					console.log("🔍 API Response Debug:", {
						status: response.status,
						statusText: response.statusText,
						ok: response.ok,
					});
				}

				if (!response.ok) {
					if (process.env.NODE_ENV === "development") {
						const errorText = await response.text();
						console.error("❌ API Error:", errorText);
					}
					return;
				}

				const data = await response.json();
				setTenant(data);
			} catch (error) {
				if (process.env.NODE_ENV === "development") {
					console.error("❌ Fetch Error:", error);
				}
				showAlert("Failed to load tenant", "error");
			} finally {
				setLoading(false);
			}
		};

		if (token) {
			fetchTenant();
		}
	}, [token, user]);

	const showAlert = (
		message: string,
		type: "success" | "error" | "warning" | "info" = "success",
	) => {
		setAlertMessage(message);
		setAlertType(type);
		setIsAlertVisible(true);
		setTimeout(() => setIsAlertVisible(false), 5000);
	};

	const hideAlert = () => {
		setIsAlertVisible(false);
	};

	return (
		<AppContext.Provider
			value={{
				token,
				setToken,
				showAlert,
				hideAlert,
				alertMessage,
				alertType,
				isAlertVisible,
				user,
				setLoading,
				loading,
				setUser,
				tenant,
				setTenant,
			}}>
			{children}
		</AppContext.Provider>
	);
};

export const useApp = () => {
	const context = useContext(AppContext);
	if (!context) throw new Error("useApp must be used within AppProvider");
	return context;
};
