/** @format */

import {
	legalConfig,
	getCompanyAddress,
	getFullCompanyName,
} from "@/lib/legal-config";

export default function TermsAndConditionsPage() {
	return (
		<div className='container mx-auto px-4 py-8 max-w-4xl'>
			<div className='prose prose-lg max-w-none'>
				<h1 className='text-4xl font-bold text-foreground mb-8'>
					Terms and Conditions
				</h1>

				<div className='text-sm text-muted-foreground mb-8'>
					<p>
						<strong>Last updated:</strong> {legalConfig.dates.lastUpdated}
					</p>
					<p>
						<strong>Effective date:</strong> {legalConfig.dates.effectiveDate}
					</p>
				</div>

				<div className='space-y-8'>
					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							1. Acceptance of Terms
						</h2>
						<p className='text-foreground'>
							By accessing and using the {legalConfig.company.name} multi-tenant
							SaaS platform ("Service"), you accept and agree to be bound by the
							terms and provision of this agreement. If you do not agree to
							abide by the above, please do not use this service.
						</p>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							2. Description of Service
						</h2>
						<p className='text-foreground mb-4'>
							{legalConfig.company.name} provides a cloud-based{" "}
							{legalConfig.platform.serviceDescription} that allows
							organizations to:
						</p>
						<ul className='list-disc pl-6 text-foreground space-y-2'>
							{legalConfig.platform.mainFeatures.map((feature, index) => (
								<li key={index}>{feature}</li>
							))}
						</ul>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							3. User Accounts and Registration
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								To access the Service, you must register for an account. You
								agree to provide accurate, current, and complete information
								during registration and to update such information to keep it
								accurate, current, and complete.
							</p>
							<p>
								You are responsible for safeguarding your account credentials
								and for all activities that occur under your account. You agree
								to notify us immediately of any unauthorized use of your
								account.
							</p>
							<p>
								You must be at least 18 years old to use the Service. If you are
								under 18, you may only use the Service with the involvement of a
								parent or guardian.
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							4. Subscription Plans and Billing
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								The Service offers various subscription plans with different
								features and limitations. Current pricing and plan details are
								available on our website and may be updated from time to time.
							</p>
							<p>
								Subscription fees are billed in advance on a recurring basis.
								You authorize us to charge your payment method for all fees
								associated with your subscription.
							</p>
							<p>
								You may cancel your subscription at any time through your
								account settings. Cancellation will take effect at the end of
								your current billing period.
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							5. Acceptable Use
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>You agree not to use the Service to:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>Violate any applicable laws or regulations</li>
								<li>Infringe upon the rights of others</li>
								<li>
									Upload or store malicious code, viruses, or harmful content
								</li>
								<li>
									Attempt to gain unauthorized access to the Service or other
									users' data
								</li>
								<li>Use the Service for any illegal or unauthorized purpose</li>
								<li>Interfere with or disrupt the Service or servers</li>
								<li>Store or process personal data without proper consent</li>
								<li>
									Exceed reasonable usage limits or attempt to circumvent
									restrictions
								</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							6. Data and Privacy
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								You retain ownership of all data you upload to the Service. We
								process your data in accordance with our Privacy Policy and
								applicable data protection laws.
							</p>
							<p>
								You are responsible for ensuring that you have the right to
								upload and process any data you store in the Service, including
								compliance with applicable data protection laws such as GDPR and
								CCPA.
							</p>
							<p>
								We implement appropriate technical and organizational measures
								to protect your data against unauthorized access, alteration,
								disclosure, or destruction.
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							7. API Usage and Data Limits
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								The Service provides REST API access for integration with
								third-party applications. API usage is subject to the following
								limits and conditions:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									API rate limits: {legalConfig.policies.apiRateLimit} requests
									per minute
								</li>
								<li>
									Maximum concurrent users per tenant:{" "}
									{legalConfig.policies.concurrentUsers}
								</li>
								<li>
									Maximum data volume per tenant:{" "}
									{legalConfig.policies.dataVolume} records
								</li>
								<li>
									Maximum tables per database:{" "}
									{legalConfig.policies.maxTablesPerDatabase}
								</li>
								<li>
									Maximum columns per table:{" "}
									{legalConfig.policies.maxColumnsPerTable}
								</li>
								<li>
									Maximum rows per table: {legalConfig.policies.maxRowsPerTable}
								</li>
								<li>
									Storage growth limit: {legalConfig.policies.storageGrowth} per
									month included
								</li>
							</ul>
							<p>
								Exceeding these limits may result in service degradation or
								additional charges. We reserve the right to modify these limits
								with reasonable notice.
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							8. Intellectual Property
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								The Service and its original content, features, and
								functionality are owned by {legalConfig.company.name} and are
								protected by international copyright, trademark, patent, trade
								secret, and other intellectual property laws.
							</p>
							<p>
								You retain ownership of your data and any custom configurations
								you create. You grant us a limited license to use your data
								solely for the purpose of providing the Service.
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							9. Limitation of Liability
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW,{" "}
								{legalConfig.company.name.toUpperCase()} SHALL NOT BE LIABLE FOR
								ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
								DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA,
								USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
							</p>
							<p>
								OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM OR
								RELATING TO THE SERVICE SHALL NOT EXCEED THE AMOUNT PAID BY YOU
								FOR THE SERVICE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							10. Service Availability and Support
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								We strive to maintain high service availability but do not
								guarantee uninterrupted access. The Service may be temporarily
								unavailable due to maintenance, updates, or circumstances beyond
								our control.
							</p>
							<p>
								Support is available through our help center, documentation, and
								customer support channels. Response times may vary based on your
								subscription plan.
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							11. Termination
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								We may terminate or suspend your account and access to the
								Service immediately, without prior notice, for conduct that we
								believe violates these Terms or is harmful to other users, us,
								or third parties.
							</p>
							<p>
								Upon termination, your right to use the Service will cease
								immediately. We will retain your data for a reasonable period to
								allow you to export it, after which it may be permanently
								deleted.
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							12. Changes to Terms
						</h2>
						<p className='text-foreground'>
							We reserve the right to modify these Terms at any time. We will
							notify you of any material changes by posting the new Terms on
							this page and updating the "Last updated" date. Your continued use
							of the Service after such changes constitutes acceptance of the
							new Terms.
						</p>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							13. Governing Law and Dispute Resolution
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								These Terms shall be governed by and construed in accordance
								with the laws of {legalConfig.legal.governingLaw}, without
								regard to its conflict of law provisions.
							</p>
							<p>
								Any disputes arising from these Terms or the Service shall be
								resolved through binding arbitration in accordance with the
								rules of {legalConfig.legal.arbitrationOrganization}. The
								arbitration shall be conducted in{" "}
								{legalConfig.legal.arbitrationLocation}.
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							14. Contact Information
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								If you have any questions about these Terms, please contact us
								at:
							</p>
							<div className='bg-muted/50 p-4 rounded-lg'>
								<p>
									<strong>{legalConfig.company.name}</strong>
								</p>
								<p>{getCompanyAddress()}</p>
								<p>Email: {legalConfig.company.email.legal}</p>
								<p>Phone: {legalConfig.company.phone}</p>
							</div>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
