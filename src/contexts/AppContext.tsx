/** @format */

"use client";

import { User } from "@/types/user";
import { createContext, useContext, useState, useEffect } from "react";

interface AppContextType {
	token: string | null;
	setToken: (token: string | null) => void;
	showAlert: (message: string, type?: "success" | "error") => void;
	alertMessage: string;
	alertType: "success" | "error";
	isAlertVisible: boolean;
	user: any;
	setUser: (user: any) => void;
	setLoading: (x: boolean) => void;
	loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [alertMessage, setAlertMessage] = useState("");
	const [alertType, setAlertType] = useState<"success" | "error">("success");
	const [isAlertVisible, setIsAlertVisible] = useState(false);

	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const storedToken = localStorage.getItem("token");
		const storedUser = localStorage.getItem("user");

		if (storedToken) setToken(storedToken);
		if (storedUser) setUser(JSON.parse(storedUser));

		setLoading(false);
	}, []);

	const showAlert = (
		message: string,
		type: "success" | "error" = "success",
	) => {
		setAlertMessage(message);
		setAlertType(type);
		setIsAlertVisible(true);
		setTimeout(() => setIsAlertVisible(false), 5000);
	};

	return (
		<AppContext.Provider
			value={{
				token,
				setToken,
				showAlert,
				alertMessage,
				alertType,
				isAlertVisible,
				user,
				setLoading,
				loading,
				setUser,
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
