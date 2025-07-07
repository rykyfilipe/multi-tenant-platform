/** @format */

"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface AppContextType {
	token: string | null;
	setToken: (token: string | null) => void;
	showAlert: (message: string, type?: "success" | "error") => void;
	alertMessage: string;
	alertType: "success" | "error";
	isAlertVisible: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
	const [token, setToken] = useState<string | null>(null);
	const [alertMessage, setAlertMessage] = useState("");
	const [alertType, setAlertType] = useState<"success" | "error">("success");
	const [isAlertVisible, setIsAlertVisible] = useState(false);

	useEffect(() => {
		const storedToken = localStorage.getItem("token");
		if (storedToken) setToken(storedToken);
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
