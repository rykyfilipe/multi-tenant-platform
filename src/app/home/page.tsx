/** @format */

"use client";

import React, { useState, useEffect } from "react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
	ResponsiveContainer,
	Area,
	AreaChart,
} from "recharts";
import {
	Database,
	Users,
	Activity,
	TrendingUp,
	Plus,
	Settings,
	Bell,
	Search,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

const weeklyData = [
	{ day: "Mon", tokens: 12, users: 45 },
	{ day: "Tue", tokens: 19, users: 52 },
	{ day: "Wed", tokens: 8, users: 38 },
	{ day: "Thu", tokens: 25, users: 67 },
	{ day: "Fri", tokens: 22, users: 61 },
	{ day: "Sat", tokens: 15, users: 43 },
	{ day: "Sun", tokens: 9, users: 32 },
];

const monthlyGrowth = [
	{ month: "Jan", value: 400 },
	{ month: "Feb", value: 600 },
	{ month: "Mar", value: 800 },
	{ month: "Apr", value: 1200 },
	{ month: "May", value: 1600 },
	{ month: "Jun", value: 2100 },
];

function Page() {
	const [currentTime, setCurrentTime] = useState(new Date());
	const [animatedStats, setAnimatedStats] = useState({
		tokens: 0,
		users: 0,
		tables: 0,
	});

	useEffect(() => {
		const timer = setInterval(() => setCurrentTime(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => {
			setAnimatedStats({ tokens: 1847, users: 324, tables: 67 });
		}, 500);
		return () => clearTimeout(timer);
	}, []);

	return (
		<div className='max-w-7xl mx-auto p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
			{/* Header */}
			<div className=' bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50'>
				<div className='px-8 py-4'>
					<div className='flex flex-wrap items-center justify-between'>
						<div className='flex items-center space-x-4 flex-wrap'>
							<div className='w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center'>
								<Database className='w-5 h-5 text-white' />
							</div>
							<div>
								<h1 className='text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent'>
									Dashboard
								</h1>
								<p className='text-sm text-gray-500'>
									{currentTime.toLocaleDateString("ro-RO", {
										weekday: "long",
										year: "numeric",
										month: "long",
										day: "numeric",
									})}
								</p>
							</div>
						</div>
						<div className='flex items-center space-x-3 flex-wrap'>
							<div className='relative'>
								<Search className='w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
								<input
									type='text'
									placeholder='Caută...'
									className='pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
								/>
							</div>
							<button className='p-2 hover:bg-gray-100 rounded-xl transition-colors'>
								<Bell className='w-5 h-5 text-gray-600' />
							</button>
							<button className='p-2 hover:bg-gray-100 rounded-xl transition-colors'>
								<Settings className='w-5 h-5 text-gray-600' />
							</button>
						</div>
					</div>
				</div>
			</div>

			<div className='p-8'>
				{/* Welcome Section */}
				<div className='mb-12'>
					<div className='bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden'>
						<div className='absolute inset-0 bg-gradient-to-r from-white/10 to-transparent'></div>
						<div className='relative z-10'>
							<h2 className='text-3xl font-bold mb-2'>
								Bine ai venit înapoi! 👋
							</h2>
							<p className='text-blue-100 text-lg mb-6'>
								Acesta este un placeholder pentru dashboard. Datele și
								funcționalitățile reale vor fi implementate în curând.
							</p>
							<div className='bg-yellow-400/20 backdrop-blur-sm px-4 py-2 rounded-xl mb-4 flex items-center space-x-2'>
								<div className='w-2 h-2 bg-yellow-400 rounded-full animate-pulse'></div>
								<span className='text-yellow-100 text-sm font-medium'>
									Status: Placeholder - În dezvoltare
								</span>
							</div>
							<button className='bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 flex items-center space-x-2'>
								<Plus className='w-5 h-5' />
								<span>Pregătire pentru lansare</span>
							</button>
						</div>
						<div className='absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-xl'></div>
						<div className='absolute -left-8 -bottom-8 w-40 h-40 bg-white/5 rounded-full blur-2xl'></div>
					</div>
				</div>

				{/* Stats Grid */}
				<div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
					<div className='bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:shadow-xl transition-all duration-300 group'>
						<div className='flex items-center justify-between mb-4'>
							<div className='p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl group-hover:scale-110 transition-transform'>
								<Activity className='w-6 h-6 text-white' />
							</div>
							<span className='text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full'>
								+12%
							</span>
						</div>
						<p className='text-sm text-gray-500 mb-1'>
							Total Tokens (placeholder)
						</p>
						<p className='text-3xl font-bold text-gray-900 transition-all duration-1000'>
							{animatedStats.tokens.toLocaleString()}
						</p>
					</div>

					<div className='bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:shadow-xl transition-all duration-300 group'>
						<div className='flex items-center justify-between mb-4'>
							<div className='p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl group-hover:scale-110 transition-transform'>
								<Users className='w-6 h-6 text-white' />
							</div>
							<span className='text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full'>
								+8%
							</span>
						</div>
						<p className='text-sm text-gray-500 mb-1'>
							Utilizatori activi (demo)
						</p>
						<p className='text-3xl font-bold text-gray-900 transition-all duration-1000'>
							{animatedStats.users.toLocaleString()}
						</p>
					</div>

					<div className='bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:shadow-xl transition-all duration-300 group'>
						<div className='flex items-center justify-between mb-4'>
							<div className='p-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl group-hover:scale-110 transition-transform'>
								<Database className='w-6 h-6 text-white' />
							</div>
							<span className='text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full'>
								+15%
							</span>
						</div>
						<p className='text-sm text-gray-500 mb-1'>Tabele create (test)</p>
						<p className='text-3xl font-bold text-gray-900 transition-all duration-1000'>
							{animatedStats.tables.toLocaleString()}
						</p>
					</div>
				</div>

				{/* Charts Grid */}
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
					{/* Weekly Activity */}
					<div className='bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20'>
						<div className='flex items-center justify-between mb-6'>
							<h3 className='text-xl font-bold text-gray-900'>
								Activitate săptămânală
							</h3>
							<TrendingUp className='w-5 h-5 text-green-600' />
						</div>
						<ResponsiveContainer width='100%' height={280}>
							<BarChart data={weeklyData}>
								<CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' />
								<XAxis dataKey='day' stroke='#64748b' fontSize={12} />
								<YAxis stroke='#64748b' fontSize={12} />
								<Tooltip
									contentStyle={{
										backgroundColor: "rgba(255, 255, 255, 0.95)",
										border: "none",
										borderRadius: "12px",
										boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
									}}
								/>
								<Bar
									dataKey='tokens'
									fill='url(#colorTokens)'
									radius={[4, 4, 0, 0]}
								/>
								<defs>
									<linearGradient id='colorTokens' x1='0' y1='0' x2='0' y2='1'>
										<stop offset='5%' stopColor='#3b82f6' stopOpacity={0.9} />
										<stop offset='95%' stopColor='#1d4ed8' stopOpacity={0.7} />
									</linearGradient>
								</defs>
							</BarChart>
						</ResponsiveContainer>
					</div>

					{/* Monthly Growth */}
					<div className='bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20'>
						<div className='flex items-center justify-between mb-6'>
							<h3 className='text-xl font-bold text-gray-900'>
								Creștere lunară
							</h3>
							<div className='flex items-center space-x-2 text-green-600'>
								<TrendingUp className='w-4 h-4' />
								<span className='text-sm font-semibold'>+24%</span>
							</div>
						</div>
						<ResponsiveContainer width='100%' height={280}>
							<AreaChart data={monthlyGrowth}>
								<CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' />
								<XAxis dataKey='month' stroke='#64748b' fontSize={12} />
								<YAxis stroke='#64748b' fontSize={12} />
								<Tooltip
									contentStyle={{
										backgroundColor: "rgba(255, 255, 255, 0.95)",
										border: "none",
										borderRadius: "12px",
										boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
									}}
								/>
								<Area
									type='monotone'
									dataKey='value'
									stroke='#8b5cf6'
									fill='url(#colorGrowth)'
									strokeWidth={3}
								/>
								<defs>
									<linearGradient id='colorGrowth' x1='0' y1='0' x2='0' y2='1'>
										<stop offset='5%' stopColor='#8b5cf6' stopOpacity={0.3} />
										<stop offset='95%' stopColor='#8b5cf6' stopOpacity={0.05} />
									</linearGradient>
								</defs>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* Quick Actions */}
				<div className='bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20'>
					<h3 className='text-xl font-bold text-gray-900 mb-6'>
						Acțiuni rapide (în curând)
					</h3>
					<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
						{[
							{
								title: "Crează token nou",
								desc: "Generează un token de acces",
								icon: Plus,
								color: "blue",
							},
							{
								title: "Gestionează utilizatori",
								desc: "Administrează echipa ta",
								icon: Users,
								color: "purple",
							},
							{
								title: "Analizează date",
								desc: "Vezi rapoarte detaliate",
								icon: Activity,
								color: "indigo",
							},
							{
								title: "Configurări",
								desc: "Personalizează setările",
								icon: Settings,
								color: "gray",
							},
						].map((action, index) => (
							<button
								key={index}
								className='group p-4 text-left hover:bg-white/80 rounded-xl transition-all duration-300 border border-transparent hover:border-white/40'>
								<div
									className={`w-12 h-12 rounded-xl bg-gradient-to-r from-${action.color}-500 to-${action.color}-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
									<action.icon className='w-6 h-6 text-white' />
								</div>
								<h4 className='font-semibold text-gray-900 mb-1'>
									{action.title}
								</h4>
								<p className='text-sm text-gray-500'>{action.desc}</p>
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

export default Page;
