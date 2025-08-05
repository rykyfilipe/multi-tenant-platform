/** @format */

import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Terms and Conditions - YDV",
	description: "Terms and conditions for using YDV services",
};

export default function TermsPage() {
	return (
		<div className='prose prose-gray max-w-none'>
			<h1 className='text-3xl font-bold text-foreground mb-6'>
				Terms and Conditions
			</h1>

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
				Welcome to YDV! These Terms and Conditions ("Terms") govern your use of
				our website and services ("Services"). By accessing or using YDV, you
				agree to these Terms.
			</p>

			<div className='space-y-8'>
				<section>
					<h2 className='text-2xl font-semibold text-foreground mb-4'>
						1. Acceptance of Terms
					</h2>
					<p className='text-muted-foreground'>
						By registering, accessing, or using our Services, you confirm that
						you are at least 18 years old and agree to comply with these Terms.
					</p>
				</section>

				<section>
					<h2 className='text-2xl font-semibold text-foreground mb-4'>
						2. Services
					</h2>
					<p className='text-muted-foreground'>
						YDV provides a SaaS platform that delivers personalized programming
						news and resources. We reserve the right to update or modify the
						Services at any time.
					</p>
				</section>

				<section>
					<h2 className='text-2xl font-semibold text-foreground mb-4'>
						3. User Accounts
					</h2>
					<ul className='list-disc list-inside text-muted-foreground space-y-2'>
						<li>
							You must provide accurate information when creating an account.
						</li>
						<li>
							You are responsible for maintaining the confidentiality of your
							credentials.
						</li>
						<li>You can log in via email/password or Google OAuth.</li>
					</ul>
				</section>

				<section>
					<h2 className='text-2xl font-semibold text-foreground mb-4'>
						4. Payments & Subscriptions
					</h2>
					<ul className='list-disc list-inside text-muted-foreground space-y-2'>
						<li>
							Payments are processed via <strong>Stripe</strong>. We do not
							store card details.
						</li>
						<li>
							Subscription fees are billed in advance according to the selected
							plan.
						</li>
						<li>
							For refund details, see our{" "}
							<a href='/docs/refund' className='text-primary hover:underline'>
								Refund Policy
							</a>
							.
						</li>
					</ul>
				</section>

				<section>
					<h2 className='text-2xl font-semibold text-foreground mb-4'>
						5. Acceptable Use
					</h2>
					<p className='text-muted-foreground mb-3'>You agree not to:</p>
					<ul className='list-disc list-inside text-muted-foreground space-y-2'>
						<li>Use the platform for illegal activities.</li>
						<li>Attempt to hack, disrupt, or overload our systems.</li>
						<li>Share your account credentials with others.</li>
					</ul>
				</section>

				<section>
					<h2 className='text-2xl font-semibold text-foreground mb-4'>
						6. Intellectual Property
					</h2>
					<p className='text-muted-foreground'>
						All content, trademarks, and materials provided by YDV are owned by
						YDV and may not be used without permission.
					</p>
				</section>

				<section>
					<h2 className='text-2xl font-semibold text-foreground mb-4'>
						7. Limitation of Liability
					</h2>
					<p className='text-muted-foreground'>
						YDV is not liable for any indirect, incidental, or consequential
						damages resulting from the use of the Services.
					</p>
				</section>

				<section>
					<h2 className='text-2xl font-semibold text-foreground mb-4'>
						8. Termination
					</h2>
					<p className='text-muted-foreground'>
						We reserve the right to suspend or terminate accounts for violations
						of these Terms.
					</p>
				</section>

				<section>
					<h2 className='text-2xl font-semibold text-foreground mb-4'>
						9. Governing Law
					</h2>
					<p className='text-muted-foreground'>
						These Terms are governed by the laws of Romania and applicable EU
						regulations.
					</p>
				</section>

				<section>
					<h2 className='text-2xl font-semibold text-foreground mb-4'>
						10. Contact
					</h2>
					<p className='text-muted-foreground'>
						If you have questions, contact us at: <br />
						<strong>Email:</strong>{" "}
						<a
							href='mailto:support@ydv.digital'
							className='text-primary hover:underline'>
							support@ydv.digital
						</a>
					</p>
				</section>
			</div>
		</div>
	);
}
