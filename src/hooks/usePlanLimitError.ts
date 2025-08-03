/** @format */

import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/navigation";

interface PlanLimitError {
	error: string;
	limit: number;
	current: number;
	plan: string;
}

export const usePlanLimitError = () => {
	const { showAlert } = useApp();
	const router = useRouter();

	const handlePlanLimitError = (error: PlanLimitError) => {
		// Afișăm mesajul de eroare
		showAlert(error.error, "error");

		// Dacă utilizatorul este pe planul Starter, îl redirecționăm la pagina de upgrade
		if (error.plan && error.limit <= 1) {
			// Delay pentru a permite utilizatorului să vadă mesajul de eroare
			setTimeout(() => {
				router.push("/");
			}, 2000);
		}
	};

	const handleApiError = (response: Response) => {
		if (response.status === 403) {
			response.json().then((data) => {
				if (data.plan && data.limit !== undefined) {
					handlePlanLimitError(data);
				} else {
					showAlert(data.error || "Access denied", "error");
				}
			}).catch(() => {
				showAlert("Access denied", "error");
			});
		} else {
			response.json().then((data) => {
				showAlert(data.error || "An error occurred", "error");
			}).catch(() => {
				showAlert("An error occurred", "error");
			});
		}
	};

	return {
		handlePlanLimitError,
		handleApiError,
	};
}; 