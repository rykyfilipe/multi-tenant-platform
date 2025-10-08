/** @format */

"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon } from "lucide-react";

interface UserAvatarProps {
	firstName?: string;
	lastName?: string;
	size?: "sm" | "md" | "lg" | "xl";
	className?: string;
}

const sizeClasses = {
	sm: "w-8 h-8 text-xs",
	md: "w-12 h-12 text-sm",
	lg: "w-16 h-16 text-lg",
	xl: "w-24 h-24 text-2xl",
};

const getInitials = (firstName?: string, lastName?: string): string => {
	if (!firstName && !lastName) return "U";
	
	const firstInitial = firstName?.charAt(0)?.toUpperCase() || "";
	const lastInitial = lastName?.charAt(0)?.toUpperCase() || "";
	
	return `${firstInitial}${lastInitial}` || "U";
};

const getAvatarColor = (firstName?: string, lastName?: string): string => {
	// Generate a consistent color based on the name
	const name = `${firstName || ""}${lastName || ""}`;
	const colors = [
		"from-blue-500 to-blue-600",
		"from-purple-500 to-purple-600",
		"from-pink-500 to-pink-600",
		"from-green-500 to-green-600",
		"from-orange-500 to-orange-600",
		"from-teal-500 to-teal-600",
		"from-indigo-500 to-indigo-600",
		"from-red-500 to-red-600",
	];
	
	// Simple hash function to pick a color
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	
	const index = Math.abs(hash) % colors.length;
	return colors[index];
};

export function UserAvatar({
	firstName,
	lastName,
	size = "md",
	className = "",
}: UserAvatarProps) {
	const initials = getInitials(firstName, lastName);
	const colorClass = getAvatarColor(firstName, lastName);

	return (
		<Avatar className={`${sizeClasses[size]} ${className}`}>
			<AvatarFallback 
				className={`bg-gradient-to-br ${colorClass} text-white font-semibold shadow-lg`}
			>
				{initials}
			</AvatarFallback>
		</Avatar>
	);
}

