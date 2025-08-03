/** @format */
"use client";

import BasicSettings from "@/components/settings/user/BasicSettings";
import PasswordSetter from "@/components/settings/user/PasswordSetter";
import SubscriptionCard from "@/components/subscription/SubscriptionCard";
import { useApp } from "@/contexts/AppContext";
import { useSubscription } from "@/hooks/useSubscription";
import React from "react";

function Page() {
	const { user } = useApp();
	const { subscription, loading: subscriptionLoading } = useSubscription();

	if (!user) return null;
	if (!subscription) return null;

	return (
		<div className='min-h-screen p-6 flex bg-gray-50 justify-start flex-col items-center gap-6'>
			<BasicSettings user={user} />
			<PasswordSetter user={user} />
			{!subscriptionLoading && (
				<SubscriptionCard
					subscription={subscription}
					onManageSubscription={() => {}}
				/>
			)}
		</div>
	);
}

export default Page;
