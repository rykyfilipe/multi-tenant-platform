/** @format */

import {
	legalConfig,
	getCompanyAddress,
	getFullCompanyName,
} from "@/lib/legal-config";

export default function RefundPolicyPage() {
	return (
		<div className='container mx-auto px-4 py-8 max-w-4xl'>
			<div className='prose prose-lg max-w-none'>
				<h1 className='text-4xl font-bold text-foreground mb-8'>
					Refund Policy
				</h1>

				<div className='text-sm text-muted-foreground mb-8'>
					<p>
						<strong>Last updated:</strong> {legalConfig.dates.lastUpdated}
					</p>
					<p>
						<strong>Effective date:</strong> {legalConfig.dates.effectiveDate}
					</p>
					<p>
						<strong>Version:</strong> {legalConfig.dates.version}
					</p>
				</div>

				<div className='bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 rounded-lg mb-8'>
					<p className='text-green-800 dark:text-green-200 text-sm'>
						<strong>Customer Satisfaction:</strong> We want you to be completely
						satisfied with our platform. If you're not happy with your
						subscription, we offer flexible refund options and will work with
						you to resolve any issues.
					</p>
				</div>

				<div className='space-y-8'>
					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							1. Overview
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								This Refund Policy outlines the terms and conditions for
								refunds, cancellations, and billing adjustments for{" "}
								{legalConfig.company.name} subscriptions. By subscribing to our
								platform, you agree to the refund and cancellation terms
								described in this policy.
							</p>
							<p>
								We strive to provide transparent and fair refund policies that
								protect both our customers and our business. All refund requests
								are reviewed on a case-by-case basis to ensure appropriate
								resolution.
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							2. Subscription Plans and Billing
						</h2>

						<h3 className='text-xl font-semibold text-foreground mb-3'>
							2.1 Billing Cycles
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>Our platform offers the following billing options:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Monthly Plans:</strong> Billed monthly in advance
								</li>
								<li>
									<strong>Annual Plans:</strong> Billed annually in advance with
									potential discounts
								</li>
								<li>
									<strong>Custom Plans:</strong> Enterprise plans with custom
									billing cycles
								</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							2.2 Payment Methods
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>We accept the following payment methods:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									Credit and debit cards (Visa, Mastercard, American Express)
								</li>
								<li>Digital wallets (Apple Pay, Google Pay)</li>
								<li>
									Bank transfers (for annual plans and enterprise customers)
								</li>
								<li>
									Invoicing (for enterprise customers with net payment terms)
								</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							2.3 Automatic Renewal
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>
								Subscriptions automatically renew unless cancelled before the
								renewal date:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>Monthly plans renew on the same day each month</li>
								<li>Annual plans renew on the same day each year</li>
								<li>
									You will receive email notifications before each renewal
								</li>
								<li>Payment is processed automatically on the renewal date</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							3. Cancellation Policy
						</h2>

						<h3 className='text-xl font-semibold text-foreground mb-3'>
							3.1 How to Cancel
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>You can cancel your subscription at any time through:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Account Settings:</strong> Navigate to Settings →
									Subscription → Cancel Subscription
								</li>
								<li>
									<strong>Customer Support:</strong> Contact our support team
									via email or chat
								</li>
								<li>
									<strong>Email Request:</strong> Send cancellation request to{" "}
									{legalConfig.company.email.support}
								</li>
							</ul>
							<p className='text-sm text-muted-foreground'>
								<strong>Note:</strong> Cancellation requests must be submitted
								at least 24 hours before your next billing date to avoid
								charges.
							</p>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							3.2 Cancellation Effective Date
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>When you cancel your subscription:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Immediate Cancellation:</strong> Your subscription
									will be cancelled immediately
								</li>
								<li>
									<strong>Service Access:</strong> You will retain access until
									the end of your current billing period
								</li>
								<li>
									<strong>No Further Charges:</strong> You will not be charged
									for future billing cycles
								</li>
								<li>
									<strong>Data Retention:</strong> Your data will be retained
									for 30 days after cancellation
								</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							3.3 Downgrading vs. Cancelling
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>Instead of cancelling, consider downgrading your plan:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Plan Downgrade:</strong> Switch to a lower-tier plan
									with reduced features
								</li>
								<li>
									<strong>Pause Subscription:</strong> Temporarily suspend your
									subscription (available for annual plans)
								</li>
								<li>
									<strong>Flexible Usage:</strong> Adjust your plan based on
									current needs
								</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							4. Refund Eligibility
						</h2>

						<h3 className='text-xl font-semibold text-foreground mb-3'>
							4.1 Full Refunds
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>Full refunds are available in the following circumstances:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Technical Issues:</strong> Platform is unusable due to
									our technical problems
								</li>
								<li>
									<strong>Service Unavailability:</strong> Extended downtime
									exceeding 24 hours
								</li>
								<li>
									<strong>Misrepresentation:</strong> Service does not match
									advertised features
								</li>
								<li>
									<strong>Billing Errors:</strong> Incorrect charges or
									duplicate billing
								</li>
								<li>
									<strong>First 30 Days:</strong> New customers within 30 days
									of initial subscription
								</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							4.2 Partial Refunds
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>Partial refunds may be available for:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Mid-cycle Cancellation:</strong> Pro-rated refund for
									unused portion of billing period
								</li>
								<li>
									<strong>Service Degradation:</strong> Significant reduction in
									service quality
								</li>
								<li>
									<strong>Feature Removal:</strong> Removal of features you
									specifically subscribed for
								</li>
								<li>
									<strong>Price Increases:</strong> Unacceptable price increases
									during your subscription term
								</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							4.3 Non-Refundable Items
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>The following are generally non-refundable:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Setup Fees:</strong> One-time implementation or
									onboarding charges
								</li>
								<li>
									<strong>Custom Development:</strong> Bespoke features or
									integrations
								</li>
								<li>
									<strong>Training Services:</strong> Custom training or
									consulting sessions
								</li>
								<li>
									<strong>Data Migration:</strong> Custom data import or export
									services
								</li>
								<li>
									<strong>Third-Party Costs:</strong> Charges from external
									services or integrations
								</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							5. Refund Process
						</h2>

						<h3 className='text-xl font-semibold text-foreground mb-3'>
							5.1 How to Request a Refund
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>To request a refund, please follow these steps:</p>
							<ol className='list-decimal pl-6 space-y-2'>
								<li>
									<strong>Contact Support:</strong> Reach out to our customer
									support team
								</li>
								<li>
									<strong>Provide Details:</strong> Explain the reason for your
									refund request
								</li>
								<li>
									<strong>Include Information:</strong> Provide your account
									details and billing information
								</li>
								<li>
									<strong>Wait for Review:</strong> Allow 3-5 business days for
									review and processing
								</li>
								<li>
									<strong>Receive Response:</strong> Get notification of
									approval or denial with explanation
								</li>
							</ol>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							5.2 Refund Processing Time
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>Refund processing times vary by payment method:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Credit/Debit Cards:</strong> 5-10 business days to
									appear on your statement
								</li>
								<li>
									<strong>Digital Wallets:</strong> 3-7 business days to return
									to your wallet
								</li>
								<li>
									<strong>Bank Transfers:</strong> 7-14 business days to return
									to your account
								</li>
								<li>
									<strong>Account Credits:</strong> Immediate credit to your
									account balance
								</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							5.3 Refund Methods
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>Refunds are processed using the original payment method:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Original Payment:</strong> Refund to the card or
									account used for payment
								</li>
								<li>
									<strong>Account Credit:</strong> Credit applied to your
									account for future use
								</li>
								<li>
									<strong>Alternative Method:</strong> Different payment method
									if original is unavailable
								</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							6. Special Circumstances
						</h2>

						<h3 className='text-xl font-semibold text-foreground mb-3'>
							6.1 Annual Plan Cancellations
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>Annual plan subscribers have additional options:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Pro-rated Refunds:</strong> Refund for unused months
									of annual subscription
								</li>
								<li>
									<strong>Plan Downgrade:</strong> Switch to monthly billing for
									remaining period
								</li>
								<li>
									<strong>Account Credit:</strong> Credit applied for future
									services
								</li>
								<li>
									<strong>Early Termination Fee:</strong> No early termination
									fee applies for early cancellation
								</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							6.2 Enterprise Customers
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>Enterprise customers may have custom refund terms:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Custom Contracts:</strong> Refund terms specified in
									your service agreement
								</li>
								<li>
									<strong>Volume Discounts:</strong> Refund calculations based
									on volume pricing
								</li>
								<li>
									<strong>Service Credits:</strong> Credits for service level
									agreement failures
								</li>
								<li>
									<strong>Dedicated Support:</strong> Direct contact with
									account manager for refund requests
								</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							6.3 Force Majeure Events
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>In extraordinary circumstances beyond our control:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Extended Downtime:</strong> Refunds for extended
									service interruptions
								</li>
								<li>
									<strong>Data Loss:</strong> Refunds if data cannot be
									recovered
								</li>
								<li>
									<strong>Security Breaches:</strong> Refunds if platform
									security is compromised
								</li>
								<li>
									<strong>Regulatory Changes:</strong> Refunds if service
									becomes non-compliant
								</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							7. Dispute Resolution
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>If you disagree with a refund decision:</p>
							<ol className='list-decimal pl-6 space-y-2'>
								<li>
									<strong>Escalation:</strong> Request review by a senior
									support representative
								</li>
								<li>
									<strong>Documentation:</strong> Provide additional evidence or
									documentation
								</li>
								<li>
									<strong>Management Review:</strong> Escalate to customer
									success management
								</li>
								<li>
									<strong>Alternative Resolution:</strong> Discuss alternative
									solutions (credits, plan changes, etc.)
								</li>
								<li>
									<strong>External Options:</strong> Contact your payment
									provider or relevant consumer protection agency
								</li>
							</ol>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							8. Data and Account Handling
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>After cancellation or refund:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Data Retention:</strong> Your data is retained for 30
									days after cancellation
								</li>
								<li>
									<strong>Data Export:</strong> You can export your data during
									this period
								</li>
								<li>
									<strong>Account Access:</strong> Limited access for data
									export and account management
								</li>
								<li>
									<strong>Permanent Deletion:</strong> Data is permanently
									deleted after 30 days
								</li>
								<li>
									<strong>Reactivation:</strong> You can reactivate your account
									within 30 days
								</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							9. Changes to This Policy
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>We may update this Refund Policy from time to time:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Notification:</strong> You will be notified of any
									material changes
								</li>
								<li>
									<strong>Effective Date:</strong> Changes take effect 30 days
									after notification
								</li>
								<li>
									<strong>Grandfathering:</strong> Existing customers may be
									grandfathered under previous terms
								</li>
								<li>
									<strong>Consent:</strong> Significant changes may require your
									explicit consent
								</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							10. Contact Information
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>For refund requests and billing questions:</p>

							<div className='bg-muted/50 p-4 rounded-lg space-y-2'>
								<p>
									<strong>Billing Support:</strong>
								</p>
								<p>Email: {legalConfig.company.email.billing}</p>
								<p>Phone: {legalConfig.company.phone}</p>
								<p>
									Hours: Monday-Friday, 9:00 AM - 6:00 PM{" "}
									{legalConfig.company.timezone}
								</p>
							</div>

							<div className='bg-muted/50 p-4 rounded-lg space-y-2 mt-4'>
								<p>
									<strong>General Support:</strong>
								</p>
								<p>Email: {legalConfig.company.email.support}</p>
								<p>Live Chat: Available through our platform</p>
								<p>Help Center: {legalConfig.company.website}/help</p>
							</div>

							<p className='text-sm text-muted-foreground mt-4'>
								<strong>Note:</strong> For urgent billing issues, please call
								our support line during business hours.
							</p>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
