/** @format */

import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Refund Policy - YDV",
	description: "Refund policy for YDV services",
};

export default function RefundPage() {
	return (
		<div className='prose prose-gray max-w-none'>
			<h1 className='text-3xl font-bold text-foreground mb-6'>Refund Policy</h1>

			<div className='bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg'>
				<p className='text-sm text-blue-800 mb-2'>
					<strong>Effective Date:</strong> August 5, 2025
				</p>
				<p className='text-sm text-blue-800'>
					<strong>Website:</strong>{" "}
					<a
						href='https://ydv.digital'
						className='text-blue-600 hover:underline'>
						ydv.digital
					</a>
				</p>
			</div>

			<p className='text-lg text-muted-foreground mb-8'>
				We want you to be satisfied with our services. Please review our refund
				policy below.
			</p>

			<div className='space-y-8'>
				<section>
					<h2 className='text-2xl font-semibold text-foreground mb-4'>
						1. Subscriptions
					</h2>
					<ul className='list-disc list-inside text-muted-foreground space-y-2'>
						<li>All subscriptions are billed in advance.</li>
						<li>Refunds are only issued in specific cases (see below).</li>
					</ul>
				</section>

				<section>
					<h2 className='text-2xl font-semibold text-foreground mb-4'>
						2. Refund Eligibility
					</h2>
					<p className='text-muted-foreground mb-3'>We may grant refunds if:</p>
					<ul className='list-disc list-inside text-muted-foreground space-y-2'>
						<li>
							You cancel within <strong>14 days</strong> of your first purchase
							(EU law compliance).
						</li>
						<li>
							There is a technical issue preventing you from using our Services.
						</li>
					</ul>
				</section>

				<section>
					<h2 className='text-2xl font-semibold text-foreground mb-4'>
						3. Non-Refundable Cases
					</h2>
					<ul className='list-disc list-inside text-muted-foreground space-y-2'>
						<li>Partial months after cancellation.</li>
						<li>
							Misuse or violation of our{" "}
							<a href='/docs/terms' className='text-primary hover:underline'>
								Terms & Conditions
							</a>
							.
						</li>
					</ul>
				</section>

				<section>
					<h2 className='text-2xl font-semibold text-foreground mb-4'>
						4. How to Request a Refund
					</h2>
					<p className='text-muted-foreground'>
						Email us at{" "}
						<a
							href='mailto:billing@ydv.digital'
							className='text-primary hover:underline'>
							billing@ydv.digital
						</a>{" "}
						with your account details and payment information.
					</p>
				</section>

				<section>
					<h2 className='text-2xl font-semibold text-foreground mb-4'>
						5. Processing Time
					</h2>
					<p className='text-muted-foreground'>
						Refunds will be processed within <strong>7 business days</strong>{" "}
						via Stripe to your original payment method.
					</p>
				</section>

				<section>
					<h2 className='text-2xl font-semibold text-foreground mb-4'>
						6. Contact
					</h2>
					<p className='text-muted-foreground'>
						For billing or refund questions, contact us at:{" "}
						<a
							href='mailto:support@ydv.digital'
							className='text-primary hover:underline'>
							billing@ydv.digital
						</a>
					</p>
				</section>
			</div>
		</div>
	);
}
