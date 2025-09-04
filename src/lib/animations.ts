/** @format */

import { Variants } from "framer-motion";

// Animații comune pentru aplicație
export const fadeInUp: Variants = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -20 },
};

export const fadeInDown: Variants = {
	initial: { opacity: 0, y: -20 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: 20 },
};

export const fadeInLeft: Variants = {
	initial: { opacity: 0, x: -20 },
	animate: { opacity: 1, x: 0 },
	exit: { opacity: 0, x: 20 },
};

export const fadeInRight: Variants = {
	initial: { opacity: 0, x: 20 },
	animate: { opacity: 1, x: 0 },
	exit: { opacity: 0, x: -20 },
};

export const scaleIn: Variants = {
	initial: { opacity: 0, scale: 0.8 },
	animate: { opacity: 1, scale: 1 },
	exit: { opacity: 0, scale: 0.8 },
};

export const slideInFromBottom: Variants = {
	initial: { opacity: 0, y: 100 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: 100 },
};

export const staggerContainer: Variants = {
	animate: {
		transition: {
			staggerChildren: 0.1,
		},
	},
};

export const staggerItem: Variants = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
};

// Animații pentru hover
export const hoverScale = {
	whileHover: { scale: 1.05 },
	whileTap: { scale: 0.95 },
};

export const hoverRotate = {
	whileHover: { rotate: 5 },
	transition: { duration: 0.2 },
};

export const hoverLift = {
	whileHover: { y: -5 },
	transition: { duration: 0.2 },
};

// Animații pentru loading
export const spinAnimation = {
	animate: { rotate: 360 },
	transition: { duration: 1, repeat: Infinity, ease: "linear" as const },
};

export const pulseAnimation = {
	animate: { scale: [1, 1.1, 1] },
	transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
};

// Animații pentru page transitions
export const pageTransition = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -20 },
	transition: { duration: 0.3, ease: "easeOut" },
};

// Animații pentru modals
export const modalAnimation = {
	initial: { opacity: 0, scale: 0.8, y: 20 },
	animate: { opacity: 1, scale: 1, y: 0 },
	exit: { opacity: 0, scale: 0.8, y: 20 },
	transition: { duration: 0.2, ease: "easeOut" },
};

// Animații pentru dropdowns
export const dropdownAnimation = {
	initial: { opacity: 0, y: -10, scale: 0.95 },
	animate: { opacity: 1, y: 0, scale: 1 },
	exit: { opacity: 0, y: -10, scale: 0.95 },
	transition: { duration: 0.15, ease: "easeOut" },
};

// Animații pentru tooltips
export const tooltipAnimation = {
	initial: { opacity: 0, scale: 0.8 },
	animate: { opacity: 1, scale: 1 },
	exit: { opacity: 0, scale: 0.8 },
	transition: { duration: 0.1, ease: "easeOut" },
};

// Animații pentru table rows
export const tableRowAnimation = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -20 },
	transition: { duration: 0.3 },
};

// Animații pentru cards
export const cardAnimation = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	whileHover: { y: -2 },
	transition: { duration: 0.4, ease: "easeOut" },
};

// Animații pentru buttons
export const buttonAnimation = {
	whileHover: { scale: 1.02 },
	whileTap: { scale: 0.98 },
	transition: { duration: 0.2, ease: "easeOut" },
};

// Animații pentru icons
export const iconAnimation = {
	whileHover: { scale: 1.1, rotate: 5 },
	whileTap: { scale: 0.9 },
	transition: { duration: 0.2 },
};
