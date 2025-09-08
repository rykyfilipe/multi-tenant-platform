/** @format */

"use client";

import { ReactNode, useRef, useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface AbsoluteDropdownProps {
	children: ReactNode;
	isOpen: boolean;
	onClose: () => void;
	triggerRef: React.RefObject<HTMLElement>;
	className?: string;
	placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
	offset?: number;
}

export function AbsoluteDropdown({
	children,
	isOpen,
	onClose,
	triggerRef,
	className,
	placement = "bottom-start",
	offset = 4,
}: AbsoluteDropdownProps) {
	const dropdownRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const [isVisible, setIsVisible] = useState(false);

	const calculatePosition = useCallback(() => {
		if (!triggerRef.current || !isOpen) return;

		const triggerRect = triggerRef.current.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const dropdownWidth = 300; // Default width, will be adjusted after render
		const dropdownHeight = 200; // Default height, will be adjusted after render

		let top = 0;
		let left = 0;

		// Calculate horizontal position
		if (placement.includes("start")) {
			left = triggerRect.left;
		} else {
			left = triggerRect.right - dropdownWidth;
		}

		// Ensure dropdown doesn't go off-screen horizontally
		if (left < 8) {
			left = 8;
		} else if (left + dropdownWidth > viewportWidth - 8) {
			left = viewportWidth - dropdownWidth - 8;
		}

		// Calculate vertical position
		if (placement.startsWith("bottom")) {
			top = triggerRect.bottom + offset;
		} else {
			top = triggerRect.top - dropdownHeight - offset;
		}

		// If dropdown would go off-screen at the bottom, try to position it above
		if (placement.startsWith("bottom") && top + dropdownHeight > viewportHeight - 8) {
			top = triggerRect.top - dropdownHeight - offset;
		}

		// If dropdown would go off-screen at the top, try to position it below
		if (placement.startsWith("top") && top < 8) {
			top = triggerRect.bottom + offset;
		}

		// Final check to ensure dropdown is within viewport
		top = Math.max(8, Math.min(top, viewportHeight - dropdownHeight - 8));

		setPosition({ top, left });
		setIsVisible(true);
	}, [triggerRef, isOpen, placement, offset]);

	// Recalculate position when dropdown opens or window resizes
	useEffect(() => {
		if (isOpen) {
			calculatePosition();
		} else {
			setIsVisible(false);
		}
	}, [isOpen, calculatePosition]);

	// Handle window resize
	useEffect(() => {
		if (!isOpen) return;

		const handleResize = () => {
			calculatePosition();
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [isOpen, calculatePosition]);

	// Handle click outside to close dropdown
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node) &&
				triggerRef.current &&
				!triggerRef.current.contains(event.target as Node)
			) {
				onClose();
			}
		};

		// Add a small delay to prevent immediate closing when opening
		const timeoutId = setTimeout(() => {
			document.addEventListener("mousedown", handleClickOutside);
		}, 100);

		return () => {
			clearTimeout(timeoutId);
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen, onClose, triggerRef]);

	// Handle escape key
	useEffect(() => {
		if (!isOpen) return;

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [isOpen, onClose]);

	if (!isOpen || !isVisible) return null;

	return createPortal(
		<div
			ref={dropdownRef}
			className={cn(
				"fixed z-[9999] bg-popover border border-border rounded-md shadow-2xl",
				className
			)}
			style={{
				top: `${position.top}px`,
				left: `${position.left}px`,
			}}>
			{children}
		</div>,
		document.body
	);
}
