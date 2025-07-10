/** @format */
"use client";

import { useApp } from "@/contexts/AppContext";
import { Alert, AlertTitle } from "./ui/alert";
import { cn } from "@/lib/utils";

function AlertMessage() {
	const { alertMessage, alertType, isAlertVisible } = useApp();

	return (
		<>
			{isAlertVisible && (
				<div
					className={cn(
						"fixed top-4 right-4 p-2 rounded-md shadow-md z-[9999]",
						alertType === "error"
							? "bg-red-100 text-red-700"
							: "bg-green-100 text-green-700",
					)}>
					<Alert className='w-auto'>
						<AlertTitle>{alertMessage}</AlertTitle>
					</Alert>
				</div>
			)}
		</>
	);
}

export default AlertMessage;
