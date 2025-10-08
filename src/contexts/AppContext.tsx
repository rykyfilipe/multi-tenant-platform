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
	useMemo,
	ReactNode,
} from "react";

// Split contexts to avoid unnecessary re-renders
interface AlertContextType {
	showAlert: (
		message: string,
		type?: "success" | "error" | "warning" | "info",
	) => void;
	hideAlert: () => void;
	alertMessage: string;
	alertType: "success" | "error" | "warning" | "info";
	isAlertVisible: boolean;
}

interface AuthContextType {
	token: string | null;
	user: User | null;
	loading: boolean;
}

interface TenantContextType {
	tenant: Tenant | null;
	setTenant: (tenant: Tenant | null) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TenantContext = createContext<TenantContextType | undefined>(undefined);

// Alert Provider - Isolated to prevent unnecessary re-renders
export const AlertProvider = ({ children }: { children: ReactNode }) => {
	const [alertMessage, setAlertMessage] = useState("");
	const [alertType, setAlertType] = useState<
		"success" | "error" | "warning" | "info"
	>("success");
	const [isAlertVisible, setIsAlertVisible] = useState(false);

	const showAlert = useCallback(
		(
			message: string,
			type: "success" | "error" | "warning" | "info" = "success",
		) => {
			setAlertMessage(message);
			setAlertType(type);
			setIsAlertVisible(true);
			setTimeout(() => setIsAlertVisible(false), 5000);
		},
		[],
	);

	const hideAlert = useCallback(() => {
		setIsAlertVisible(false);
	}, []);

	const value = useMemo(
		() => ({
			showAlert,
			hideAlert,
			alertMessage,
			alertType,
			isAlertVisible,
		}),
		[showAlert, hideAlert, alertMessage, alertType, isAlertVisible],
	);

	return (
		<AlertContext.Provider value={value}>{children}</AlertContext.Provider>
	);
};

// Auth Provider - Handles session and user data
export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const { data: session } = useSession();
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (session) {
			try {
				const newUserId = Number(session.user.id);
				const newToken = session.customJWT || "";

				// Only update if data has changed
				if (user?.id !== newUserId || token !== newToken) {
					const updatedUser = {
						...session.user,
						id: newUserId,
						role: session.user.role as import("@/types/user").Role,
					};
					setUser(updatedUser as User);
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
	}, [session?.user?.id, session?.customJWT, user?.id, token]);

	const value = useMemo(
		() => ({
			token,
			user,
			loading,
		}),
		[token, user, loading],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Tenant Provider - Handles tenant data with optimized fetching
export const TenantProvider = ({ children }: { children: ReactNode }) => {
	const { token } = useAuth();
	const [tenant, setTenant] = useState<Tenant | null>(null);
	const [hasFetched, setHasFetched] = useState(false);

	const fetchTenant = useCallback(async () => {
		if (!token) return;

		try {
			const response = await fetch("/api/tenants", {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) return;

			const data = await response.json();
			setTenant(data);
			setHasFetched(true);
		} catch (error) {
			console.error("Error fetching tenant:", error);
			setHasFetched(true);
		}
	}, [token]);

	useEffect(() => {
		if (token && !hasFetched) {
			fetchTenant();
		} else if (!token && (tenant || hasFetched)) {
			setTenant(null);
			setHasFetched(false);
		}
	}, [token, hasFetched, fetchTenant, tenant]);

	const value = useMemo(
		() => ({
			tenant,
			setTenant,
		}),
		[tenant],
	);

	return (
		<TenantContext.Provider value={value}>{children}</TenantContext.Provider>
	);
};

// Combined Provider
export const AppProvider = ({ children }: { children: ReactNode }) => {
	return (
		<AlertProvider>
			<AuthProvider>
				<TenantProvider>{children}</TenantProvider>
			</AuthProvider>
		</AlertProvider>
	);
};

// Hooks
export const useAlert = () => {
	const context = useContext(AlertContext);
	if (!context) throw new Error("useAlert must be used within AlertProvider");
	return context;
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth must be used within AuthProvider");
	return context;
};

export const useTenant = () => {
	const context = useContext(TenantContext);
	if (!context) throw new Error("useTenant must be used within TenantProvider");
	return context;
};

// Combined hook for backwards compatibility
export const useOptimizedApp = () => {
	const alert = useAlert();
	const auth = useAuth();
	const tenant = useTenant();

	return {
		...alert,
		...auth,
		...tenant,
		// Legacy compatibility
		setLoading: () => {}, // No-op since loading is handled internally
	};
};

// Alias for backward compatibility
export const useApp = useOptimizedApp;
