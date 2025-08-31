/** @format */

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Info } from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { signIn } from "next-auth/react";

function RegisterForm({ closeForm }: { closeForm: (x: boolean) => void }) {
	const { showAlert } = useApp();
	const { t } = useLanguage();

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const role = "ADMIN";

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const response = await fetch("/api/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email,
					password,
					firstName,
					lastName,
					role,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				showAlert(data.error || t("register.registrationFailed"), "error");
			} else {
				const res = await signIn("credentials", {
					email,
					password,
					redirect: false,
				});

				if (res?.ok) {
					showAlert(t("register.accountCreated"), "success");
					closeForm(true);
					// Redirect to dashboard after successful registration and login
					window.location.href = "/home/dashboard";
				} else {
					showAlert(t("register.loginFailed"), "warning");
				}
			}
		} catch (error: any) {
			showAlert(t("register.unexpectedError"), "error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form className='flex flex-col space-y-4 mt-4' onSubmit={handleRegister}>
			<div>
				<Label>{t("register.firstName")}</Label>
				<Input
					type='text'
					placeholder={t("register.firstNamePlaceholder")}
					value={firstName}
					onChange={(e) => setFirstName(e.target.value)}
					required
				/>
			</div>
			<div>
				<Label>{t("register.lastName")}</Label>
				<Input
					type='text'
					placeholder={t("register.lastNamePlaceholder")}
					value={lastName}
					onChange={(e) => setLastName(e.target.value)}
					required
				/>
			</div>
			<div>
				<Label>{t("register.email")}</Label>
				<Input
					type='email'
					placeholder={t("register.emailPlaceholder")}
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
			</div>
			<div>
				<Label>{t("register.password")}</Label>
				<Input
					type='password'
					placeholder={t("register.passwordPlaceholder")}
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
			</div>

			<div className='flex gap-2 items-center text-sm text-muted-foreground'>
				{t("register.role")}{" "}
				<span className='font-semibold text-foreground'>ADMIN</span>
				<Popover open={open}>
					<PopoverTrigger asChild>
						<div
							onMouseEnter={() => setOpen(true)}
							onMouseLeave={() => setOpen(false)}>
							<Info className='w-4 h-4 text-muted-foreground cursor-help' />
						</div>
					</PopoverTrigger>
					<PopoverContent className='text-sm w-[260px] pointer-events-none bg-popover border-border'>
						{t("register.roleInfo")}
					</PopoverContent>
				</Popover>
			</div>

			<Button
				type='submit'
				disabled={loading}
				className='w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-sm'>
				{loading ? t("register.pleaseWait") : t("register.register")}
			</Button>
		</form>
	);
}

export default RegisterForm;
