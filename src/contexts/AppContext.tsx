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

			// Debug logging removed for production

			setToken(session.customJWT || "");
		}

		setLoading(false);
	}, [session]);

	// Configuration validation
	useEffect(() => {
		const requiredEnvVars = [
			"NEXTAUTH_SECRET",
			"JWT_SECRET",
			"PUBLIC_JWT_SECRET",
		];

		const missingVars = requiredEnvVars.filter(
			(varName) => !process.env[varName],
		);

		if (missingVars.length > 0) {
			console.error("Missing required environment variables:", missingVars);
		}
	}, []);

	useEffect(() => {
		if (!token) return;
		const fetchTenant = async () => {
			try {
				const response = await fetch("/api/tenants", {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (!response.ok) {
					return;
				}

				const data = await response.json();
				setTenant(data);
			} catch (error) {
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
