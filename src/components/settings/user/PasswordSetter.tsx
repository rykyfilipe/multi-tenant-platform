/** @format */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";
import { User } from "@/types/user";
import { useCallback, useEffect, useState } from "react";

interface Props {
	user: User;
}

interface PasswordResponse {
	password: string | null;
}

function PasswordSetter({ user }: Props) {
	const [password, setPassword] = useState<string | null>(null);
	const [oldPassword, setOldPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isChangingPassword, setIsChangingPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { token } = useApp();

	// Validate password inputs
	const validatePasswords = () => {
		// If changing existing password, validate old password
		if (isChangingPassword && !oldPassword) {
			setError("Current password is required");
			return false;
		}

		if (!newPassword || !confirmPassword) {
			setError("Both password fields are required");
			return false;
		}
		if (newPassword.length < 6) {
			setError("Password must be at least 6 characters long");
			return false;
		}
		if (newPassword !== confirmPassword) {
			setError("Passwords do not match");
			return false;
		}
		return true;
	};

	// Memoized fetch function to prevent unnecessary re-renders
	const fetchPassword = useCallback(async () => {
		if (!token) return;

		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/account/password", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error(
					`Failed to fetch password: ${response.status} ${response.statusText}`,
				);
			}

			const data: PasswordResponse = await response.json();
			setPassword(data.password);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "An unknown error occurred";
			setError(errorMessage);
			console.error("Error fetching password:", error);
		} finally {
			setIsLoading(false);
		}
	}, [token]);

	// Fixed useEffect with proper dependency array
	useEffect(() => {
		fetchPassword();
	}, [fetchPassword]);

	const setUserPassword = useCallback(async () => {
		if (!token) {
			setError("No authentication token available");
			return;
		}

		if (!validatePasswords()) {
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const requestBody = isChangingPassword
				? { oldPassword, newPassword }
				: { password: newPassword };

			const response = await fetch("/api/account/password", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				const errorMessage =
					errorData?.message ||
					`Failed to ${isChangingPassword ? "change" : "set"} password: ${
						response.status
					} ${response.statusText}`;
				throw new Error(errorMessage);
			}

			const data: PasswordResponse = await response.json();
			setPassword(data.password);
			// Clear input fields after successful password set/change
			setOldPassword("");
			setNewPassword("");
			setConfirmPassword("");
			setIsChangingPassword(false);
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: `Failed to ${isChangingPassword ? "change" : "set"} password`;
			setError(errorMessage);
			console.error("Error setting password:", error);
		} finally {
			setIsLoading(false);
		}
	}, [token, oldPassword, newPassword, isChangingPassword, validatePasswords]);

	const handleChangePassword = () => {
		setIsChangingPassword(true);
		setOldPassword("");
		setNewPassword("");
		setConfirmPassword("");
		setError(null);
	};

	const handleCancelChange = () => {
		setIsChangingPassword(false);
		setOldPassword("");
		setNewPassword("");
		setConfirmPassword("");
		setError(null);
	};

	return (
		<div className='w-full max-w-xl'>
			<Card>
				<CardHeader>Password</CardHeader>
				<CardContent className='space-y-4'>
					{error && (
						<div className='text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200'>
							{error}
						</div>
					)}

					{isLoading ? (
						<div className='flex items-center justify-center p-4'>
							<div className='animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900'></div>
							<span className='ml-2 text-sm text-gray-600'>Loading...</span>
						</div>
					) : password && !isChangingPassword ? (
						<div className='space-y-2'>
							<p className='font-mono text-sm bg-gray-100 p-3 rounded-md border'>
								Password is set ✓
							</p>
							<Button
								variant='outline'
								size='sm'
								onClick={handleChangePassword}>
								Change Password
							</Button>
						</div>
					) : (
						<div className='space-y-4'>
							{isChangingPassword && (
								<div className='space-y-2'>
									<Label htmlFor='oldPassword'>Current Password</Label>
									<Input
										id='oldPassword'
										type='password'
										placeholder='Enter current password'
										value={oldPassword}
										onChange={(e) => {
											setOldPassword(e.target.value);
											if (error) setError(null);
										}}
										disabled={isLoading}
									/>
								</div>
							)}

							<div className='space-y-2'>
								<Label htmlFor='newPassword'>
									{isChangingPassword ? "New Password" : "Password"}
								</Label>
								<Input
									id='newPassword'
									type='password'
									placeholder={
										isChangingPassword ? "Enter new password" : "Enter password"
									}
									value={newPassword}
									onChange={(e) => {
										setNewPassword(e.target.value);
										if (error) setError(null);
									}}
									disabled={isLoading}
								/>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='confirmPassword'>Confirm Password</Label>
								<Input
									id='confirmPassword'
									type='password'
									placeholder={
										isChangingPassword
											? "Confirm new password"
											: "Confirm password"
									}
									value={confirmPassword}
									onChange={(e) => {
										setConfirmPassword(e.target.value);
										if (error) setError(null);
									}}
									disabled={isLoading}
								/>
							</div>

							<div className='flex gap-2'>
								<Button
									onClick={setUserPassword}
									disabled={
										isLoading ||
										!newPassword ||
										!confirmPassword ||
										(isChangingPassword && !oldPassword)
									}
									className='flex-1'>
									{isLoading
										? isChangingPassword
											? "Changing Password..."
											: "Setting Password..."
										: isChangingPassword
										? "Change Password"
										: "Set Password"}
								</Button>

								{isChangingPassword && (
									<Button
										variant='outline'
										onClick={handleCancelChange}
										disabled={isLoading}>
										Cancel
									</Button>
								)}
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

export default PasswordSetter;
