/** @format */

"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
	Upload,
	X,
	User,
	Camera,
	CheckCircle,
	AlertCircle,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";

interface UserProfileImageUploadProps {
	userId: number;
	currentImage?: string | null;
	userName: string;
	onImageUpdate?: (imageUrl: string) => void;
}

export function UserProfileImageUpload({
	userId,
	currentImage,
	userName,
	onImageUpdate,
}: UserProfileImageUploadProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(
		currentImage || null,
	);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const { showAlert, token } = useApp();

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith("image/")) {
			setError("Please select a valid image file");
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			setError("Image size must be less than 5MB");
			return;
		}

		setSelectedFile(file);
		setError("");

		// Create preview URL
		const reader = new FileReader();
		reader.onload = (e) => {
			setPreviewUrl(e.target?.result as string);
		};
		reader.readAsDataURL(file);
	};

	const handleUpload = async () => {
		if (!selectedFile) return;

		setUploading(true);
		setError("");

		try {
			// Create FormData
			const formData = new FormData();
			formData.append("image", selectedFile);
			formData.append("userId", userId.toString());

			// Upload to Cloudinary
			const response = await fetch("/api/users/profile-image", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to upload image");
			}

			const data = await response.json();
			setSuccess(true);
			setSelectedFile(null);
			setPreviewUrl(data.imageUrl);

			// Call the callback if provided
			if (onImageUpdate) {
				onImageUpdate(data.imageUrl);
			}

			showAlert("Profile image updated successfully!", "success");

			// Reset success state after 3 seconds
			setTimeout(() => {
				setSuccess(false);
			}, 3000);
		} catch (err: any) {
			setError(err.message || "Failed to upload image");
			showAlert(err.message || "Failed to upload image", "error");
		} finally {
			setUploading(false);
		}
	};

	const handleRemoveImage = async () => {
		setUploading(true);
		setError("");

		try {
			const response = await fetch("/api/users/profile-image", {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ userId }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to remove image");
			}

			setPreviewUrl(null);
			setSelectedFile(null);
			setSuccess(true);

			// Call the callback if provided
			if (onImageUpdate) {
				onImageUpdate("");
			}

			showAlert("Profile image removed successfully!", "success");

			// Reset success state after 3 seconds
			setTimeout(() => {
				setSuccess(false);
			}, 3000);
		} catch (err: any) {
			setError(err.message || "Failed to remove image");
			showAlert(err.message || "Failed to remove image", "error");
		} finally {
			setUploading(false);
		}
	};

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	return (
		<Card className='w-full max-w-md'>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Camera className='w-5 h-5' />
					Profile Image
				</CardTitle>
			</CardHeader>
			<CardContent className='space-y-6'>
				{/* Current Image Display */}
				<div className='flex flex-col items-center space-y-4'>
					<div className='relative'>
						<Avatar className='w-24 h-24 ring-4 ring-primary/10'>
							<AvatarImage
								src={previewUrl || undefined}
								alt={userName}
								className='object-cover'
							/>
							<AvatarFallback className='bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-semibold text-xl'>
								{getInitials(userName)}
							</AvatarFallback>
						</Avatar>
						{previewUrl && (
							<Button
								variant='destructive'
								size='sm'
								className='absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full'
								onClick={handleRemoveImage}
								disabled={uploading}>
								<X className='w-3 h-3' />
							</Button>
						)}
					</div>
					<div className='text-center'>
						<p className='text-sm font-medium text-foreground'>{userName}</p>
						<p className='text-xs text-muted-foreground'>Profile Image</p>
					</div>
				</div>

				{/* File Upload Section */}
				<div className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='profile-image'>Upload New Image</Label>
						<Input
							id='profile-image'
							type='file'
							accept='image/*'
							onChange={handleFileSelect}
							ref={fileInputRef}
							className='cursor-pointer'
						/>
						<p className='text-xs text-muted-foreground'>
							Supported formats: JPG, PNG, GIF. Max size: 5MB
						</p>
					</div>

					{/* Upload Button */}
					{selectedFile && (
						<Button
							onClick={handleUpload}
							disabled={uploading}
							className='w-full'>
							{uploading ? (
								<>
									<div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
									Uploading...
								</>
							) : (
								<>
									<Upload className='w-4 h-4 mr-2' />
									Upload Image
								</>
							)}
						</Button>
					)}

					{/* Success Message */}
					{success && (
						<Alert className='border-green-200 bg-green-50'>
							<CheckCircle className='w-4 h-4 text-green-600' />
							<AlertDescription className='text-green-800'>
								Profile image updated successfully!
							</AlertDescription>
						</Alert>
					)}

					{/* Error Message */}
					{error && (
						<Alert variant='destructive'>
							<AlertCircle className='w-4 h-4' />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
				</div>

				{/* Image Preview */}
				{selectedFile && previewUrl && (
					<div className='space-y-2'>
						<Label>Preview</Label>
						<div className='relative'>
							<img
								src={previewUrl}
								alt='Preview'
								className='w-full h-32 object-cover rounded-lg border'
							/>
							<Badge
								variant='secondary'
								className='absolute top-2 right-2 bg-black/50 text-white'>
								{selectedFile.name}
							</Badge>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
