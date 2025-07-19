/** @format */

"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Welcome() {
	return (
		<div className='flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 text-slate-900 px-4'>
			<div className='max-w-2xl text-center space-y-6'>
				<h1 className='text-5xl font-bold tracking-tight'>
					YDV – Your Data. Your View.
				</h1>
				<p className='text-lg text-slate-600'>
					A powerful multi-tenant platform where you can build custom databases,
					create dynamic dashboards, and manage everything — your way.
				</p>

				<div className='flex justify-center gap-4'>
					<Link href='/auth'>
						<Button className='px-6 py-3 text-base rounded-xl bg-slate-900 hover:bg-slate-800 text-white'>
							Start Now
						</Button>
					</Link>
					<Link href='/docs'>
						<Button
							variant='outline'
							className='px-6 py-3 text-base rounded-xl'>
							Learn More
						</Button>
					</Link>
				</div>
			</div>

			<p className='absolute bottom-6 text-sm text-slate-400'>
				Made with ❤️ by the YDV team
			</p>
		</div>
	);
}
