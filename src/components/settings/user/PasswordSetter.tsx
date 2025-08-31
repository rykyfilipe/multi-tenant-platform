/** @format */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
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
	const { t } = useLanguage();

	// Validate password inputs
	const validatePasswords = () => {
		// If changing existing password, validate old password
		if (isChangingPassword && !oldPassword) {
			setError(t("settings.password.currentPasswordRequired"));
			return false;
		}

		if (!newPassword || !confirmPassword) {
			setError(t("settings.password.bothFieldsRequired"));
			return false;
		}
		if (newPassword.length < 6) {
			setError(t("settings.password.passwordRequirements"));
			return false;
		}
		if (newPassword !== confirmPassword) {
			setError(t("settings.password.passwordsDoNotMatch"));
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
	}, []);

	const setUserPassword = useCallback(async () => {
		if (!token) {
			setError(t("settings.password.noAuthToken"));
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
				`${isChangingPassword ? t("settings.password.failedToChange") : t("settings.password.failedToSet")}: ${
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
					: isChangingPassword ? t("settings.password.failedToChange") : t("settings.password.failedToSet");
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
		<div className='space-y-6'>
			{error && (
				<div className='text-destructive text-sm bg-destructive/10 p-4 rounded-lg border border-destructive/20 flex items-center gap-2'>
					<svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
						<path
							fillRule='evenodd'
							d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
							clipRule='evenodd'
						/>
					</svg>
					{error}
				</div>
			)}

			{isLoading ? (
				<div className='flex items-center justify-center p-8'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
					<span className='ml-3 text-sm text-muted-foreground'>{t("settings.password.loading")}</span>
				</div>
			) : password && !isChangingPassword ? (
				<div className='space-y-4'>
					<div className='p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg'>
						<div className='flex items-center gap-2'>
							<svg
								className='w-5 h-5 text-green-600 dark:text-green-400'
								fill='currentColor'
								viewBox='0 0 20 20'>
								<path
									fillRule='evenodd'
									d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
									clipRule='evenodd'
								/>
							</svg>
							<span className='text-sm font-medium text-green-800 dark:text-green-200'>
								{t("settings.password.passwordIsSet")}
							</span>
						</div>
						<p className='text-xs text-green-600 dark:text-green-400 mt-1'>
							{t("settings.password.accountProtected")}
						</p>
					</div>
					<Button
						variant='outline'
						onClick={handleChangePassword}
						className='w-full'>
						{t("settings.password.changePassword")}
					</Button>
				</div>
			) : (
				<div className='space-y-6'>
					{isChangingPassword && (
						<div className='space-y-2'>
							<Label
								htmlFor='oldPassword'
								className='text-sm font-medium text-foreground'>
								{t("settings.password.currentPassword")}
							</Label>
							<Input
								id='oldPassword'
								type='password'
								placeholder={t("settings.password.enterCurrentPassword")}
								value={oldPassword}
								onChange={(e) => {
									setOldPassword(e.target.value);
									if (error) setError(null);
								}}
								disabled={isLoading}
								className='w-full'
							/>
						</div>
					)}

					<div className='space-y-2'>
						<Label
							htmlFor='newPassword'
							className='text-sm font-medium text-foreground'>
							{isChangingPassword ? t("settings.password.newPassword") : t("settings.password.password")}
						</Label>
						<Input
							id='newPassword'
							type='password'
							placeholder={
								isChangingPassword ? t("settings.password.enterNewPassword") : t("settings.password.enterPassword")
							}
							value={newPassword}
							onChange={(e) => {
								setNewPassword(e.target.value);
								if (error) setError(null);
							}}
							disabled={isLoading}
							className='w-full'
						/>
						<p className='text-xs text-muted-foreground'>
							{t("settings.password.passwordRequirements")}
						</p>
					</div>

					<div className='space-y-2'>
						<Label
							htmlFor='confirmPassword'
							className='text-sm font-medium text-foreground'>
							{t("settings.password.confirmPassword")}
						</Label>
						<Input
							id='confirmPassword'
							type='password'
							placeholder={
								isChangingPassword ? t("settings.password.confirmNewPassword") : t("settings.password.confirmPasswordPlaceholder")
							}
							value={confirmPassword}
							onChange={(e) => {
								setConfirmPassword(e.target.value);
								if (error) setError(null);
							}}
							disabled={isLoading}
							className='w-full'
						/>
					</div>

					<div className='flex gap-3 pt-4'>
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
									? t("settings.password.changingPassword")
									: t("settings.password.settingPassword")
								: isChangingPassword
								? t("settings.password.changePassword")
								: t("settings.password.setPassword")}
						</Button>

						{isChangingPassword && (
							<Button
								variant='outline'
								onClick={handleCancelChange}
								disabled={isLoading}
								className='flex-1'>
								{t("settings.password.cancel")}
							</Button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

export default PasswordSetter;
