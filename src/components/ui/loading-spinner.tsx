/** @format */

import React from "react";

interface LoadingSpinnerProps {
	size?: "sm" | "md" | "lg";
	className?: string;
}

export function LoadingSpinner({
	size = "md",
	className = "",
}: LoadingSpinnerProps) {
	const sizeClasses = {
		sm: "h-4 w-4",
		md: "h-8 w-8",
		lg: "h-32 w-32",
	};

	return (
		<div
			className={`animate-spin rounded-full border-b-2 border-primary ${sizeClasses[size]} ${className}`}
		/>
	);
}
