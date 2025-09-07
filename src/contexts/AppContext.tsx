/** @format */

"use client";

import { Tenant } from "@/types/tenant";
import { User } from "@/types/user";
import { useSession } from "next-auth/react";
import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from "react";

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
	user: User | null;
	setUser: (user: User | null) => void;
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
		if (session?.user) {
			try {
				// Only update if user data has actually changed
				const newUserId = Number(session.user.id);
				const newToken = session.customJWT || "";

				if (user?.id !== newUserId || token !== newToken) {
					const updatedUser = {
						...session.user,
						id: newUserId,
					};
					setUser(updatedUser);
					setToken(newToken);
				}
			} catch (error) {
				console.error("Error setting session data:", error);
			}
		} else {
			if (user || token) {
				setUser(null);
				setToken(null);
			}
		}

		setLoading(false);
	}, [session?.user?.id, session?.customJWT, user?.id, token]); // Add user and token to prevent stale closures

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
			// Missing required environment variables
		}
	}, []);

	const fetchTenant = useCallback(async () => {
		if (!token) {
			setLoading(false);
			return;
		}

		// Prevent duplicate requests
		if (tenant && tenant.adminId) {
			setLoading(false);
			return;
		}

		try {
			const response = await fetch("/api/tenants", {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				setLoading(false);
				return;
			}

			const data = await response.json();
			// Only update if data has actually changed
			if (!tenant || tenant.id !== data.id) {
				setTenant(data);
			}
		} catch (error) {
			console.error("Error fetching tenant:", error);
		} finally {
			setLoading(false);
		}
	}, [token]); // Remove tenant?.id dependency to prevent infinite loops

	useEffect(() => {
		if (token && !tenant) {
			fetchTenant();
		} else if (!token && tenant) {
			setTenant(null);
			setLoading(false);
		} else if (!token) {
			setLoading(false);
		}
	}, [token, tenant, fetchTenant]);

	const showAlert = (
		message: string,
		type: "success" | "error" | "warning" | "info" = "success",
	) => {
		console.log("=== SHOW ALERT DEBUG ===");
		console.log("Message:", message);
		console.log("Type:", type);
		console.log("Current alert state:", { alertMessage, alertType, isAlertVisible });
		
		setAlertMessage(message);
		setAlertType(type);
		setIsAlertVisible(true);
		
		console.log("Alert state after setting:", { message, type, visible: true });
		
		setTimeout(() => {
			console.log("Auto-hiding alert after 5 seconds");
			setIsAlertVisible(false);
		}, 5000);
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
