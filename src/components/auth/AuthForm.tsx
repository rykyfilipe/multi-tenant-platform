/** @format */

"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import OAuthGoogleLogin from "./OuthGoogle";

function AuthForm({ closeForm }: { closeForm: (x: boolean) => void }) {
	const [tab, setTab] = useState("login");

	return (
		<div>
			<h2 className='text-2xl font-bold text-center mb-6'>
				{tab === "login" ? "Welcome back" : "Create an account"}
			</h2>

			<Tabs value={tab} onValueChange={setTab} defaultValue='login'>
				<TabsList className='grid grid-cols-2 mb-6 bg-slate-100 p-1 rounded-lg'>
					<TabsTrigger
						value='login'
						className='data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg text-gray-700 font-medium'>
						Login
					</TabsTrigger>
					<TabsTrigger
						value='register'
						className='data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg text-gray-700 font-medium'>
						Register
					</TabsTrigger>
				</TabsList>

				<OAuthGoogleLogin />

				<TabsContent value='login'>
					<LoginForm />
				</TabsContent>

				<TabsContent value='register'>
					<RegisterForm />
				</TabsContent>
			</Tabs>
		</div>
	);
}

export default AuthForm;
