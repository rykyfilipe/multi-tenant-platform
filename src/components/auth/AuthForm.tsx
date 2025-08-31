/** @format */

"use client";

import {
	PremiumTabs,
	PremiumTabsContent,
	PremiumTabsList,
	PremiumTabsTrigger,
} from "@/components/ui/premium-tabs";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ForgotPasswordForm from "./ForgotPasswordForm";
import OAuthGoogleLogin from "./OuthGoogle";

function AuthForm({ closeForm }: { closeForm: (x: boolean) => void }) {
	const { t } = useLanguage();
	const [tab, setTab] = useState("login");
	const [showForgotPassword, setShowForgotPassword] = useState(false);

	const showLoginForm = () => {
		setShowForgotPassword(false);
		setTab("login");
	};

	if (showForgotPassword) {
		return (
			<div>
				<h2 className='text-2xl font-bold text-center mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent'>
					{t("auth.forgotPassword")}
				</h2>
				<ForgotPasswordForm
					closeForm={closeForm}
					showLoginForm={showLoginForm}
				/>
			</div>
		);
	}

	return (
		<div>
			<h2 className='text-2xl font-bold text-center mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent'>
				{tab === "login" ? t("auth.welcomeBack") : t("auth.createAccount")}
			</h2>

			<PremiumTabs value={tab} onValueChange={setTab} defaultValue='login'>
				<PremiumTabsList variant='pills' className='grid grid-cols-2 mb-8'>
					<PremiumTabsTrigger
						value='login'
						variant='pills'
						className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-muted/50 data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted data-[state=inactive]:hover:text-foreground'>
						{t("auth.login")}
					</PremiumTabsTrigger>
					<PremiumTabsTrigger
						value='register'
						variant='pills'
						className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-muted/50 data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted data-[state=inactive]:hover:text-foreground'>
						{t("auth.register")}
					</PremiumTabsTrigger>
				</PremiumTabsList>

				<PremiumTabsContent value='login'>
					<LoginForm
						closeForm={closeForm}
						showForgotPassword={() => setShowForgotPassword(true)}
					/>
				</PremiumTabsContent>

				<PremiumTabsContent value='register'>
					<RegisterForm closeForm={closeForm} />
				</PremiumTabsContent>
			</PremiumTabs>

			{/* OAuth Section */}
			<div className='mt-6'>
				<div className='relative'>
					<div className='absolute inset-0 flex items-center'>
						<span className='w-full border-t border-border' />
					</div>
					<div className='relative flex justify-center text-xs uppercase'>
						<span className='bg-card px-2 text-muted-foreground'>
							{t("auth.orContinueWith")}
						</span>
					</div>
				</div>

				<div className='mt-6'>
					<OAuthGoogleLogin closeForm={closeForm} />
				</div>
			</div>
		</div>
	);
}

export default AuthForm;
