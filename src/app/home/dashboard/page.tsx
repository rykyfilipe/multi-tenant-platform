/** @format */

"use client";

import React from "react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
	ResponsiveContainer,
} from "recharts";

const data = [
	{ day: "Mon", tokens: 3 },
	{ day: "Tue", tokens: 5 },
	{ day: "Wed", tokens: 2 },
	{ day: "Thu", tokens: 7 },
	{ day: "Fri", tokens: 6 },
];

function Page() {
	return (
		<div className='p-6'>
			<h1 className='text-2xl font-bold mb-4'>Welcome to your Dashboard</h1>
			<p className='text-gray-600 mb-8'>
				Here you'll find analytics, token usage, and quick access to your
				databases.
			</p>

			{/* Stats */}
			<div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
				<div className='bg-white shadow-md p-4 rounded-xl'>
					<p className='text-sm text-gray-500'>Total Tokens</p>
					<p className='text-2xl font-bold'>8</p>
				</div>
				<div className='bg-white shadow-md p-4 rounded-xl'>
					<p className='text-sm text-gray-500'>Active Users</p>
					<p className='text-2xl font-bold'>124</p>
				</div>
				<div className='bg-white shadow-md p-4 rounded-xl'>
					<p className='text-sm text-gray-500'>Tables Created</p>
					<p className='text-2xl font-bold'>32</p>
				</div>
			</div>

			{/* Chart */}
			<div className='bg-white shadow-md p-6 rounded-xl'>
				<h2 className='text-lg font-semibold mb-4'>Tokens Created This Week</h2>
				<ResponsiveContainer width='100%' height={300}>
					<BarChart data={data}>
						<CartesianGrid strokeDasharray='3 3' />
						<XAxis dataKey='day' />
						<YAxis />
						<Tooltip />
						<Bar dataKey='tokens' fill='#3b82f6' />
					</BarChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}

export default Page;
