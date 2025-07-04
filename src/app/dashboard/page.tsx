/** @format */

"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

function Dashboard() {
	const router = useRouter();

	const logout = async () => {
		try {
			const response = await fetch("/api/logout", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error("Logout failed");
			}

			localStorage.removeItem("token");
			localStorage.removeItem("user");

			router.push("/");
		} catch (error) {
			console.error("Logout error:", error);
			alert("Logout failed. Please try again.");
		}
	};

	return (
		<div>
			<Button onClick={logout}>Logout</Button>
		</div>
	);
}

export default Dashboard;
