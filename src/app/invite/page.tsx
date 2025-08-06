/** @format */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Database, Users, Shield, Calendar } from "lucide-react";
import { signIn } from "next-auth/react";

interface Invitation {
	email: string;
	firstName: string;
	lastName: string;
	role: string;
	tenantName: string;
	expiresAt: string;
}

function InvitePageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [invitation, setInvitation] = useState<Invitation | null>(null);
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		if (!token) {
			setError("Invalid invitation link. Please check your email.");
			return;
		}

		// Validate invitation token
		fetch(`/api/invite?token=${token}`)
			.then((res) => res.json())
			.then((data) => {
				if (data.error) {
					setError(data.error);
				} else {
					setInvitation(data.invitation);
				}
			})
			.catch(() => {
				setError("Failed to validate invitation. Please try again.");
			});
	}, [token]);

	const handleAcceptInvitation = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			setLoading(false);
			return;
		}

		if (password.length < 8) {
			setError("Password must be at least 8 characters long");
			setLoading(false);
			return;
		}

		try {
			const response = await fetch("/api/invite", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					token,
					password,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || "Failed to accept invitation");
			} else {
				setSuccess(true);
				// Auto-login after successful account creation
				setTimeout(() => {
					signIn("credentials", {
						email: invitation?.email,
						password,
						redirect: true,
						callbackUrl: "/home/dashboard",
					});
				}, 2000);
			}
		} catch (error) {
			setError("An unexpected error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	if (error && !invitation) {
		return (
			<div className='min-h-screen bg-background flex items-center justify-center p-4'>
				<Card className='w-full max-w-md'>
					<CardHeader className='text-center'>
						<CardTitle className='text-red-600'>Invitation Error</CardTitle>
						<CardDescription>{error}</CardDescription>
					</CardHeader>
					<CardContent>
						<Button onClick={() => router.push("/")} className='w-full'>
							Go to Home
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (success) {
		return (
			<div className='min-h-screen bg-background flex items-center justify-center p-4'>
				<Card className='w-full max-w-md'>
					<CardHeader className='text-center'>
						<div className='mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4'>
							<Database className='w-6 h-6 text-green-600' />
						</div>
						<CardTitle className='text-green-600'>Welcome to YDV!</CardTitle>
						<CardDescription>
							Your account has been created successfully. You will be redirected
							to the dashboard shortly.
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	if (!invitation) {
		return (
			<div className='min-h-screen bg-background flex items-center justify-center p-4'>
				<Card className='w-full max-w-md'>
					<CardHeader className='text-center'>
						<CardTitle>Validating Invitation...</CardTitle>
						<CardDescription>
							Please wait while we verify your invitation.
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-background flex items-center justify-center p-4'>
			<Card className='w-full max-w-md'>
				<CardHeader className='text-center'>
					<div className='mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4'>
						<Database className='w-6 h-6 text-primary' />
					</div>
					<CardTitle>Accept Invitation</CardTitle>
					<CardDescription>
						Complete your account setup to join {invitation.tenantName}
					</CardDescription>
				</CardHeader>

				<CardContent className='space-y-6'>
					{/* Invitation Details */}
					<div className='space-y-3'>
						<div className='flex items-center justify-between'>
							<span className='text-sm text-muted-foreground'>Name:</span>
							<span className='text-sm font-medium'>
								{invitation.firstName} {invitation.lastName}
							</span>
						</div>
						<div className='flex items-center justify-between'>
							<span className='text-sm text-muted-foreground'>Email:</span>
							<span className='text-sm font-medium'>{invitation.email}</span>
						</div>
						<div className='flex items-center justify-between'>
							<span className='text-sm text-muted-foreground'>Role:</span>
							<Badge variant='outline' className='text-xs'>
								{invitation.role}
							</Badge>
						</div>
						<div className='flex items-center justify-between'>
							<span className='text-sm text-muted-foreground'>
								Organization:
							</span>
							<span className='text-sm font-medium'>
								{invitation.tenantName}
							</span>
						</div>
						<div className='flex items-center justify-between'>
							<span className='text-sm text-muted-foreground'>Expires:</span>
							<span className='text-sm font-medium'>
								{new Date(invitation.expiresAt).toLocaleDateString()}
							</span>
						</div>
					</div>

					{/* Password Form */}
					<form onSubmit={handleAcceptInvitation} className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='password'>Create Password</Label>
							<Input
								id='password'
								type='password'
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder='Enter your password'
								required
								minLength={8}
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='confirmPassword'>Confirm Password</Label>
							<Input
								id='confirmPassword'
								type='password'
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder='Confirm your password'
								required
								minLength={8}
							/>
						</div>

						{error && (
							<Alert variant='destructive'>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<Button type='submit' className='w-full' disabled={loading}>
							{loading ? "Creating Account..." : "Accept Invitation"}
						</Button>
					</form>

					<div className='text-center text-xs text-muted-foreground'>
						By accepting this invitation, you agree to our{" "}
						<a href='/docs/terms' className='text-primary hover:underline'>
							Terms of Service
						</a>{" "}
						and{" "}
						<a href='/docs/privacy' className='text-primary hover:underline'>
							Privacy Policy
						</a>
						.
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function LoadingFallback() {
	return (
		<div className='min-h-screen bg-background flex items-center justify-center p-4'>
			<Card className='w-full max-w-md'>
				<CardHeader className='text-center'>
					<CardTitle>Loading...</CardTitle>
					<CardDescription>
						Please wait while we load the invitation page.
					</CardDescription>
				</CardHeader>
			</Card>
		</div>
	);
}

export default function InvitePage() {
	return (
		<Suspense fallback={<LoadingFallback />}>
			<InvitePageContent />
		</Suspense>
	);
}
