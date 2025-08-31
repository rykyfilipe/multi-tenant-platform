/** @format */

"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Check } from "lucide-react";
import { Button } from "../ui/button";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
	currentLogoUrl?: string;
	onLogoChange: (logoUrl: string) => void;
	disabled?: boolean;
}

function LogoUpload({ currentLogoUrl, onLogoChange, disabled = false }: Props) {
	const { t } = useLanguage();
	const { showAlert, token } = useApp();
	const [isUploading, setIsUploading] = useState(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(
		currentLogoUrl || null,
	);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileSelect = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith("image/")) {
			showAlert(t("tenant.logoUpload.selectValidImage"), "error");
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			showAlert(t("tenant.logoUpload.imageSizeLimit"), "error");
			return;
		}

		setIsUploading(true);

		try {
			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				setPreviewUrl(e.target?.result as string);
			};
			reader.readAsDataURL(file);

			// Upload to server
			const formData = new FormData();
			formData.append("logo", file);

			if (!token) {
				showAlert(t("tenant.logoUpload.authRequired"), "error");
				return;
			}

			const response = await fetch("/api/upload/logo", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			});

			if (!response.ok) {
				throw new Error(t("tenant.logoUpload.uploadFailed"));
			}

			const result = await response.json();

			if (result.success && result.logoUrl) {
				onLogoChange(result.logoUrl);
				showAlert(t("tenant.logoUpload.uploadSuccess"), "success");
			} else {
				throw new Error(t("tenant.logoUpload.uploadResponseInvalid"));
			}
		} catch (error) {
			console.error("Logo upload error:", error);
			showAlert(t("tenant.logoUpload.failedToUpload"), "error");
			setPreviewUrl(currentLogoUrl || null);
		} finally {
			setIsUploading(false);
		}
	};

	const handleRemoveLogo = () => {
		setPreviewUrl(null);
		onLogoChange("");
		showAlert(t("tenant.logoUpload.logoRemoved"), "info");
	};

	const handleClickUpload = () => {
		if (!disabled && fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	return (
		<div className='space-y-4'>
			{/* Current Logo Display */}
			{previewUrl && (
				<div className='relative group'>
					<div className='w-32 h-32 mx-auto border-2 border-border rounded-lg overflow-hidden bg-muted flex items-center justify-center'>
						<img
							src={previewUrl}
							alt='Organization Logo'
							className='w-full h-full object-contain'
						/>
					</div>

					{/* Remove button overlay */}
					<Button
						type='button'
						variant='destructive'
						size='sm'
						onClick={handleRemoveLogo}
						disabled={disabled}
						className='absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity'>
						<X className='w-3 h-3' />
					</Button>
				</div>
			)}

			{/* Upload Area */}
			{!previewUrl && (
				<div
					className={`
            w-32 h-32 mx-auto border-2 border-dashed rounded-lg
            flex flex-col items-center justify-center cursor-pointer
            transition-all duration-200
            ${
							disabled
								? "border-muted-foreground/30 bg-muted/20 cursor-not-allowed"
								: "border-border hover:border-primary hover:bg-primary/5"
						}
          `}
					onClick={handleClickUpload}>
					<ImageIcon
						className={`w-8 h-8 mb-2 ${
							disabled ? "text-muted-foreground/50" : "text-muted-foreground"
						}`}
					/>
					<span
						className={`text-xs text-center px-2 ${
							disabled ? "text-muted-foreground/50" : "text-muted-foreground"
						}`}>
						{t("tenant.logo")}
					</span>
				</div>
			)}

			{/* Upload Button */}
			<div className='flex flex-col items-center gap-2'>
				<Button
					type='button'
					variant='outline'
					size='sm'
					onClick={handleClickUpload}
					disabled={disabled || isUploading}
					className='flex items-center gap-2'>
					{isUploading ? (
						<>
							<div className='w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin' />
							{t("tenant.logoUpload.uploading")}
						</>
					) : previewUrl ? (
						<>
							<Upload className='w-4 h-4' />
							{t("tenant.logoUpload.changeLogo")}
						</>
					) : (
						<>
							<Upload className='w-4 h-4' />
							{t("tenant.logoUpload.uploadLogo")}
						</>
					)}
				</Button>

				{previewUrl && (
					<div className='flex items-center gap-1 text-xs text-green-600 dark:text-green-400'>
						<Check className='w-3 h-3' />
						{t("tenant.logoUpload.logoUploaded")}
					</div>
				)}

				<p className='text-xs text-muted-foreground text-center max-w-xs'>
					{t("tenant.logoUpload.recommendations")}
				</p>
			</div>

			{/* Hidden file input */}
			<input
				ref={fileInputRef}
				type='file'
				accept='image/*'
				onChange={handleFileSelect}
				className='hidden'
				disabled={disabled}
			/>
		</div>
	);
}

export default LogoUpload;
