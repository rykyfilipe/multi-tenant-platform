/** @format */

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DocsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<header className='border-b border-border/20 bg-card/50 backdrop-blur-sm'>
				<div className='container mx-auto px-4 py-4'>
					<div className='flex items-center justify-between'>
						<Link href='/'>
							<Button variant='ghost' className='flex items-center gap-2'>
								<ArrowLeft className='w-4 h-4' />
								Back to Home
							</Button>
						</Link>
						<div className='text-sm text-muted-foreground'>
							YDV Documentation
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className='container mx-auto px-4 py-8 max-w-4xl'>{children}</main>

			{/* Footer */}
			<footer className='border-t border-border/20 bg-card/50 backdrop-blur-sm mt-16'>
				<div className='container mx-auto px-4 py-6'>
					<div className='text-center text-sm text-muted-foreground'>
						© 2025 YDV. All rights reserved. Multi-Tenant Database Platform.
					</div>
				</div>
			</footer>
		</div>
	);
}
