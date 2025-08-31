/** @format */

"use client";

import { X } from "lucide-react";
import AuthForm from "./AuthForm";

interface Props {
	onClose: () => void;
}

export default function AuthModal({ onClose }: Props) {
	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn'>
			<div className='relative w-full max-w-md bg-card rounded-2xl shadow-2xl p-6 sm:p-8 border border-border'>
				{/* Close Button */}
				<button
					onClick={onClose}
					className='absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors'>
					<X className='w-6 h-6' />
				</button>

				{/* Auth Form */}
				<AuthForm closeForm={() => onClose()} />
			</div>
		</div>
	);
}
