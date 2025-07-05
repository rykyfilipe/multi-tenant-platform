/** @format */

"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

function Welcome() {
	return (
		<div className='flex flex-col items-center justify-center min-h-screen bg-gray-100'>
			<h1 className='text-4xl font-bold mb-4'>
				Welcome to the Multi-Tenant Platform
			</h1>
			<p className='text-lg mb-6'>
				This is a sample application demonstrating multi-tenancy.
			</p>
			<Link href={"/auth"}>
				<Button className='px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition'>
					Start
				</Button>
			</Link>
		</div>
	);
}

export default Welcome;
