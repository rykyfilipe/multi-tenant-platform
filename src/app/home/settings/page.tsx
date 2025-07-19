/** @format */
"use client";

import BasicSettings from "@/components/settings/user/BasicSettings";
import { useApp } from "@/contexts/AppContext";
import React from "react";

function Page() {
	const { user } = useApp();
	if (!user) return;
	return (
		<div className='min-h-screen </div> p-6 flex  bg-gray-50 justify-center'>
			<BasicSettings user={user} />
		</div>
	);
}

export default Page;
