/** @format */
"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Camera, Upload, X, Download } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";

interface ProfileImageUploadProps {
	userId: string;
	currentImage?: string;
	userName: string;
	onImageUpdate: (imageUrl: string) => void;
}

export function ProfileImageUpload({
	userId,
	currentImage,
	userName,
	onImageUpdate,
}: ProfileImageUploadProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	const handleFileSelect = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (file) {
				// Validate file type
				if (!file.type.startsWith("image/")) {
					alert("Please select an image file");
					return;
				}

				// Validate file size (max 5MB)
				if (file.size > 5 * 1024 * 1024) {
					alert("File size must be less than 5MB");
					return;
				}

				setSelectedFile(file);
				const reader = new FileReader();
				reader.onload = (e) => {
					setPreviewUrl(e.target?.result as string);
				};
				reader.readAsDataURL(file);
			}
		},
		[],
	);

	const handleUpload = async () => {
		if (!selectedFile) return;

		setIsUploading(true);
		setUploadProgress(0);

		try {
			// Simulate upload progress
			const progressInterval = setInterval(() => {
				setUploadProgress((prev) => {
					if (prev >= 90) {
						clearInterval(progressInterval);
						return 90;
					}
					return prev + 10;
				});
			}, 100);

			// Create FormData
			const formData = new FormData();
			formData.append("image", selectedFile);
			formData.append("userId", userId);

			// Upload to your API endpoint
			const response = await fetch("/api/users/profile-image", {
				method: "POST",
				body: formData,
			});

			clearInterval(progressInterval);
			setUploadProgress(100);

			if (response.ok) {
				const data = await response.json();
				onImageUpdate(data.imageUrl);
				setSelectedFile(null);
				setPreviewUrl(null);

				// Reset file input
				if (fileInputRef.current) {
					fileInputRef.current.value = "";
				}
			} else {
				throw new Error("Upload failed");
			}
		} catch (error) {
			console.error("Upload error:", error);
			alert("Failed to upload image. Please try again.");
		} finally {
			setIsUploading(false);
			setUploadProgress(0);
		}
	};

	const handleRemoveImage = () => {
		setSelectedFile(null);
		setPreviewUrl(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const triggerFileInput = () => {
		fileInputRef.current?.click();
	};

	return (
		<div className='space-y-6'>
			{/* Current Profile Section */}
			<Card className='border-border/20 bg-card/50 backdrop-blur-sm'>
				<CardHeader>
					<CardTitle className='text-lg flex items-center gap-2'>
						<Camera className='w-5 h-5' />
						Profile Image
					</CardTitle>
				</CardHeader>
				<CardContent className='space-y-6'>
					{/* Current Image Display */}
					<div className='flex items-center gap-4'>
						<Avatar className='w-20 h-20 ring-2 ring-primary/10'>
							<AvatarImage
								src={currentImage || previewUrl || undefined}
								alt={userName}
							/>
							<AvatarFallback className='bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-semibold text-xl'>
								{getInitials(userName)}
							</AvatarFallback>
						</Avatar>
						<div className='flex-1'>
							<h3 className='font-semibold text-foreground'>{userName}</h3>
							<p className='text-sm text-muted-foreground'>
								{currentImage
									? "Profile image uploaded"
									: "No profile image set"}
							</p>
						</div>
					</div>

					{/* Upload Section */}
					<div className='space-y-4'>
						<div className='flex items-center gap-2'>
							<Label htmlFor='profile-image' className='text-sm font-medium'>
								Upload New Image
							</Label>
							<Badge variant='secondary' className='text-xs'>
								Max 5MB
							</Badge>
						</div>

						<div className='flex items-center gap-3'>
							<Input
								ref={fileInputRef}
								id='profile-image'
								type='file'
								accept='image/*'
								onChange={handleFileSelect}
								className='hidden'
							/>
							<Button
								onClick={triggerFileInput}
								variant='outline'
								className='flex items-center gap-2'
								disabled={isUploading}>
								<Upload className='w-4 h-4' />
								Choose Image
							</Button>
							{selectedFile && (
								<Button
									onClick={handleRemoveImage}
									variant='ghost'
									size='sm'
									className='text-muted-foreground hover:text-destructive'>
									<X className='w-4 h-4' />
								</Button>
							)}
						</div>

						{selectedFile && (
							<div className='text-sm text-muted-foreground'>
								Selected: {selectedFile.name} (
								{(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
							</div>
						)}
					</div>

					{/* Upload Progress */}
					{isUploading && (
						<div className='space-y-2'>
							<div className='flex items-center justify-between text-sm'>
								<span>Uploading...</span>
								<span>{uploadProgress}%</span>
							</div>
							<div className='w-full bg-muted rounded-full h-2'>
								<div
									className='bg-primary h-2 rounded-full transition-all duration-300'
									style={{ width: `${uploadProgress}%` }}
								/>
							</div>
						</div>
					)}

					{/* Upload Button */}
					{selectedFile && !isUploading && (
						<Button
							onClick={handleUpload}
							className='w-full'
							disabled={isUploading}>
							<Upload className='w-4 h-4 mr-2' />
							Upload Image
						</Button>
					)}
				</CardContent>
			</Card>

			{/* Image Preview Sandbox */}
			{previewUrl && (
				<Card className='border-border/20 bg-card/50 backdrop-blur-sm'>
					<CardHeader>
						<CardTitle className='text-lg flex items-center gap-2'>
							<Download className='w-5 h-5' />
							Image Preview
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							{/* Preview in different contexts */}
							<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
								{/* Profile Card Preview */}
								<div className='space-y-2'>
									<h4 className='text-sm font-medium text-muted-foreground'>
										Profile Card
									</h4>
									<div className='p-4 border border-border/20 rounded-lg bg-card/30'>
										<div className='flex items-center gap-3'>
											<Avatar className='w-12 h-12'>
												<AvatarImage src={previewUrl} alt='Preview' />
												<AvatarFallback className='bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-semibold'>
													{getInitials(userName)}
												</AvatarFallback>
											</Avatar>
											<div>
												<div className='font-medium text-sm'>{userName}</div>
												<div className='text-xs text-muted-foreground'>
													Team Member
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Avatar Preview */}
								<div className='space-y-2'>
									<h4 className='text-sm font-medium text-muted-foreground'>
										Avatar
									</h4>
									<div className='p-4 border border-border/20 rounded-lg bg-card/30 flex justify-center'>
										<Avatar className='w-16 h-16'>
											<AvatarImage src={previewUrl} alt='Preview' />
											<AvatarFallback className='bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-semibold text-lg'>
												{getInitials(userName)}
											</AvatarFallback>
										</Avatar>
									</div>
								</div>

								{/* Thumbnail Preview */}
								<div className='space-y-2'>
									<h4 className='text-sm font-medium text-muted-foreground'>
										Thumbnail
									</h4>
									<div className='p-4 border border-border/20 rounded-lg bg-card/30 flex justify-center'>
										<Avatar className='w-8 h-8'>
											<AvatarImage src={previewUrl} alt='Preview' />
											<AvatarFallback className='bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-semibold text-xs'>
												{getInitials(userName)}
											</AvatarFallback>
										</Avatar>
									</div>
								</div>
							</div>

							{/* Original Image */}
							<div className='space-y-2'>
								<h4 className='text-sm font-medium text-muted-foreground'>
									Original Image
								</h4>
								<div className='border border-border/20 rounded-lg overflow-hidden'>
									<img
										src={previewUrl}
										alt='Original preview'
										className='w-full h-48 object-cover'
									/>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
