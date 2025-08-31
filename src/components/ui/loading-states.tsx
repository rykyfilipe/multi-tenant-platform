/** @format */

import React from "react";
import {
	Loader2,
	Database,
	Sparkles,
	Users,
	Settings,
	Key,
	Building2,
	Table2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

// Generic loading states
export const GenericLoadingState: React.FC<{ message?: string }> = ({
	message,
}) => {
	const { t } = useLanguage();
	return (
		<div className='flex items-center justify-center py-16'>
			<div className='text-center'>
				<div className='inline-flex items-center justify-center w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4'>
					<span className='sr-only'>{t("loading.loading")}</span>
				</div>
				<p className='text-lg text-muted-foreground font-medium'>
					{message || t("loading.loading")}
				</p>
			</div>
		</div>
	);
};

export const ElegantLoadingState: React.FC<{ message?: string }> = ({
	message,
}) => {
	const { t } = useLanguage();
	return (
		<div className='text-center py-20'>
			<div className='max-w-md mx-auto'>
				{/* Sparkles animation */}
				<div className='relative mb-8'>
					<div className='absolute -top-2 -left-2'>
						<Sparkles className='w-6 h-6 text-yellow-400 animate-pulse' />
					</div>
					<div className='absolute -top-2 -right-2'>
						<Sparkles
							className='w-4 h-4 text-blue-400 animate-pulse'
							style={{ animationDelay: "0.5s" }}
						/>
					</div>
					<div className='absolute -bottom-2 -left-4'>
						<Sparkles
							className='w-5 h-5 text-purple-400 animate-pulse'
							style={{ animationDelay: "1s" }}
						/>
					</div>
					<div className='absolute -bottom-2 -right-4'>
						<Sparkles
							className='w-5 h-5 text-green-400 animate-pulse'
							style={{ animationDelay: "1.5s" }}
						/>
					</div>

					{/* Main loader */}
					<div className='w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-lg'>
						<Loader2 className='w-10 h-10 text-white animate-spin' />
					</div>
				</div>

				{/* Text */}
				<h3 className='text-xl font-semibold text-foreground mb-2'>
					{message || t("loading.loadingYourData")}
				</h3>
				<p className='text-muted-foreground'>{t("loading.pleaseWait")}</p>
			</div>
		</div>
	);
};

// Database specific loading states
export const DatabaseLoadingState: React.FC = () => {
	const { t } = useLanguage();
	return (
		<div className='text-center py-20'>
			<div className='max-w-lg mx-auto'>
				{/* Database icon with pulse effect */}
				<div className='relative w-24 h-24 mx-auto mb-8'>
					<div className='absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-2xl opacity-20 animate-pulse'></div>
					<div className='relative w-full h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg'>
						<Database className='w-12 h-12 text-white' />
					</div>
				</div>

				{/* Loading text */}
				<h3 className='text-2xl font-bold text-foreground mb-4'>
					{t("loading.preparingWorkspace")}
				</h3>
				<p className='text-muted-foreground text-lg mb-8'>
					{t("loading.settingUpDatabase")}
				</p>

				{/* Animated progress bar */}
				<div className='w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden'>
					<div
						className='h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse'
						style={{ width: "60%" }}></div>
				</div>
			</div>
		</div>
	);
};

// Users specific loading state
export const UsersLoadingState: React.FC = () => {
	const { t } = useLanguage();
	return (
		<div className='text-center py-20'>
			<div className='max-w-lg mx-auto'>
				{/* Users icon with pulse effect */}
				<div className='relative w-24 h-24 mx-auto mb-8'>
					<div className='absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-600 rounded-2xl opacity-20 animate-pulse'></div>
					<div className='relative w-full h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg'>
						<Users className='w-12 h-12 text-white' />
					</div>
				</div>

				{/* Loading text */}
				<h3 className='text-2xl font-bold text-foreground mb-4'>
					{t("loading.loadingUsers")}
				</h3>
				<p className='text-muted-foreground text-lg mb-8'>
					{t("loading.fetchingUserInfo")}
				</p>

				{/* Animated progress bar */}
				<div className='w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden'>
					<div
						className='h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full animate-pulse'
						style={{ width: "70%" }}></div>
				</div>
			</div>
		</div>
	);
};

// Settings specific loading state
export const SettingsLoadingState: React.FC = () => {
	const { t } = useLanguage();
	return (
		<div className='text-center py-20'>
			<div className='max-w-lg mx-auto'>
				{/* Settings icon with pulse effect */}
				<div className='relative w-24 h-24 mx-auto mb-8'>
					<div className='absolute inset-0 bg-gradient-to-r from-orange-400 to-red-600 rounded-2xl opacity-20 animate-pulse'></div>
					<div className='relative w-full h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg'>
						<Settings className='w-12 h-12 text-white' />
					</div>
				</div>

				{/* Loading text */}
				<h3 className='text-2xl font-bold text-foreground mb-4'>
					{t("loading.loadingSettings")}
				</h3>
				<p className='text-muted-foreground text-lg mb-8'>
					{t("loading.preparingConfiguration")}
				</p>

				{/* Animated progress bar */}
				<div className='w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden'>
					<div
						className='h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full animate-pulse'
						style={{ width: "80%" }}></div>
				</div>
			</div>
		</div>
	);
};

// Tenant/Organization specific loading state
export const TenantLoadingState: React.FC = () => {
	const { t } = useLanguage();
	return (
		<div className='text-center py-20'>
			<div className='max-w-lg mx-auto'>
				{/* Tenant icon with pulse effect */}
				<div className='relative w-24 h-24 mx-auto mb-8'>
					<div className='absolute inset-0 bg-gradient-to-r from-indigo-400 to-blue-600 rounded-2xl opacity-20 animate-pulse'></div>
					<div className='relative w-full h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg'>
						<Building2 className='w-12 h-12 text-white' />
					</div>
				</div>

				{/* Loading text */}
				<h3 className='text-2xl font-bold text-foreground mb-4'>
					{t("loading.loadingOrganization")}
				</h3>
				<p className='text-muted-foreground text-lg mb-8'>
					{t("loading.fetchingOrgDetails")}
				</p>

				{/* Animated progress bar */}
				<div className='w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden'>
					<div
						className='h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full animate-pulse'
						style={{ width: "65%" }}></div>
				</div>
			</div>
		</div>
	);
};

// Table specific loading state
export const TableLoadingState: React.FC = () => {
	const { t } = useLanguage();
	return (
		<div className='text-center py-20'>
			<div className='max-w-lg mx-auto'>
				{/* Table icon with pulse effect */}
				<div className='relative w-24 h-24 mx-auto mb-8'>
					<div className='absolute inset-0 bg-gradient-to-r from-cyan-400 to-teal-600 rounded-2xl opacity-20 animate-pulse'></div>
					<div className='relative w-full h-full bg-gradient-to-r from-cyan-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg'>
						<Table2 className='w-12 h-12 text-white' />
					</div>
				</div>

				{/* Loading text */}
				<h3 className='text-2xl font-bold text-foreground mb-4'>
					{t("loading.loadingTableData")}
				</h3>
				<p className='text-muted-foreground text-lg mb-8'>
					{t("loading.fetchingColumnsRows")}
				</p>

				{/* Animated progress bar */}
				<div className='w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden'>
					<div
						className='h-full bg-gradient-to-r from-cyan-500 to-teal-600 rounded-full animate-pulse'
						style={{ width: "75%" }}></div>
				</div>
			</div>
		</div>
	);
};

// Skeleton loading states for cards
export const CardSkeleton: React.FC = () => {
	return (
		<Card className='shadow-md hover:shadow-lg transition-shadow rounded-2xl animate-pulse'>
			<CardContent className='p-6'>
				<div className='w-full flex items-center justify-between'>
					<div className='h-7 bg-gray-200 rounded-md w-40'></div>
					<div className='w-10 h-10 bg-gray-200 rounded-md'></div>
				</div>
			</CardContent>
		</Card>
	);
};

export const CardGridSkeleton: React.FC<{ count?: number }> = ({
	count = 3,
}) => {
	return (
		<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
			{Array.from({ length: count }).map((_, i) => (
				<CardSkeleton key={i} />
			))}
		</div>
	);
};

// Button loading state
export const ButtonLoadingState: React.FC<{ text?: string }> = ({ text }) => {
	const { t } = useLanguage();
	return (
		<div className='flex items-center justify-center gap-2'>
			<Loader2 className='w-4 h-4 animate-spin' />
			<span>{text || t("loading.loading")}</span>
		</div>
	);
};
