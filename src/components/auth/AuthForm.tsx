/** @format */

// AuthForm.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { useApp } from "@/contexts/AppContext";
import OAuthGoogleLogin from "./OuthGoogle";

function AuthForm() {
	const { setToken, setUser } = useApp();
	useEffect(() => {
		setToken(null);
		setUser(null);
	}, [setToken, setUser]);
	const [tab, setTab] = useState("login");

	return (
		<div className='flex items-center justify-center h-screen bg-gray-100'>
			<Tabs
				value={tab}
				onValueChange={setTab}
				defaultValue='login'
				className='w-96'>
				<TabsList className='grid w-full grid-cols-2 mb-4'>
					<TabsTrigger value='login'>Login</TabsTrigger>
					<TabsTrigger value='register'>Register</TabsTrigger>
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
