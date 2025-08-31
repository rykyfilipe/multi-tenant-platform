/** @format */
"use client";

import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, X, AlertCircle, Info } from "lucide-react";
import { useEffect, useState } from "react";

function AlertMessage() {
	const { alertMessage, alertType, isAlertVisible, hideAlert } = useApp();
	const [isAnimating, setIsAnimating] = useState(false);
	const [progress, setProgress] = useState(100);

	useEffect(() => {
		if (isAlertVisible) {
			setIsAnimating(true);
			setProgress(100);

			// Animate progress bar
			const progressInterval = setInterval(() => {
				setProgress((prev) => {
					if (prev <= 0) {
						clearInterval(progressInterval);
						return 0;
					}
					return prev - 2; // Decrease by 2% every 100ms (5 seconds total)
				});
			}, 100);

			return () => clearInterval(progressInterval);
		} else {
			setIsAnimating(false);
		}
	}, [isAlertVisible]);

	const getAlertConfig = (type: "success" | "error" | "warning" | "info") => {
		switch (type) {
			case "success":
				return {
					icon: CheckCircle,
					bgColor: "bg-emerald-50 border-emerald-200",
					textColor: "text-emerald-800",
					iconColor: "text-emerald-600",
					progressColor: "bg-emerald-500",
				};
			case "error":
				return {
					icon: XCircle,
					bgColor: "bg-red-50 border-red-200",
					textColor: "text-red-800",
					iconColor: "text-red-600",
					progressColor: "bg-red-500",
				};
			case "warning":
				return {
					icon: AlertCircle,
					bgColor: "bg-amber-50 border-amber-200",
					textColor: "text-amber-800",
					iconColor: "text-amber-600",
					progressColor: "bg-amber-500",
				};
			case "info":
				return {
					icon: Info,
					bgColor: "bg-blue-50 border-blue-200",
					textColor: "text-blue-800",
					iconColor: "text-blue-600",
					progressColor: "bg-blue-500",
				};
			default:
				return {
					icon: Info,
					bgColor: "bg-blue-50 border-blue-200",
					textColor: "text-blue-800",
					iconColor: "text-blue-600",
					progressColor: "bg-blue-500",
				};
		}
	};

	const config = getAlertConfig(alertType);
	const IconComponent = config.icon;

	if (!isAlertVisible) return null;

	return (
		<div
			className={cn(
				"fixed bottom-6 right-6 z-[9999] max-w-sm w-full",
				"transform transition-all duration-300 ease-out",
				isAnimating
					? "translate-y-0 opacity-100 scale-100"
					: "translate-y-2 opacity-0 scale-95",
			)}>
			<div
				className={cn(
					"relative overflow-hidden rounded-xl border shadow-lg backdrop-blur-sm",
					config.bgColor,
				)}>
				{/* Progress Bar */}
				<div className='absolute top-0 left-0 h-1 bg-gray-200 w-full'>
					<div
						className={cn(
							"h-full transition-all duration-100 ease-linear",
							config.progressColor,
						)}
						style={{ width: `${progress}%` }}
					/>
				</div>

				{/* Content */}
				<div className='flex items-start gap-3 p-4'>
					<div className='flex-shrink-0'>
						<IconComponent className={cn("w-5 h-5", config.iconColor)} />
					</div>
					<div className='flex-1 min-w-0'>
						<p className={cn("text-sm font-medium", config.textColor)}>
							{alertMessage}
						</p>
					</div>
					<div className='flex-shrink-0'>
						<button
							onClick={() => {
								setIsAnimating(false);
								setTimeout(() => {
									hideAlert();
								}, 300);
							}}
							className={cn(
								"p-1 rounded-md transition-colors hover:bg-black/5",
								config.textColor,
							)}>
							<X className='w-4 h-4' />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default AlertMessage;
