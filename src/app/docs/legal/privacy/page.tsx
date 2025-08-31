/** @format */

import {
	legalConfig,
	getCompanyAddress,
	getFullCompanyName,
} from "@/lib/legal-config";

export default function PrivacyPolicyPage() {
	return (
		<div className='container mx-auto px-4 py-8 max-w-4xl'>
			<div className='prose prose-lg max-w-none'>
				<h1 className='text-4xl font-bold text-foreground mb-8'>
					Privacy Policy
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
							1. Introduction
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								{legalConfig.company.name} ("we," "our," or "us") is committed
								to protecting your privacy and ensuring the security of your
								personal information. This Privacy Policy explains how we
								collect, use, disclose, and safeguard your information when you
								use our {legalConfig.platform.serviceDescription}.
							</p>
							<p>
								This policy applies to all users of our Service, including
								tenants, administrators, and end users. By using our Service,
								you consent to the data practices described in this policy.
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							2. Information We Collect
						</h2>

						<h3 className='text-xl font-semibold text-foreground mb-3'>
							2.1 Personal Information
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>We collect the following types of personal information:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Account Information:</strong> Name, email address,
									password, role, and profile image
								</li>
								<li>
									<strong>Tenant Information:</strong> Company name, address,
									phone, tax ID, and business details
								</li>
								<li>
									<strong>Usage Data:</strong> Login times, feature usage, API
									calls, and system interactions
								</li>
								<li>
									<strong>Payment Information:</strong> Stripe customer ID,
									subscription details, and billing history
								</li>
								<li>
									<strong>Communication Data:</strong> Support requests,
									feedback, and correspondence
								</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							2.2 Data You Upload
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>
								Our platform allows you to store and manage your business data,
								including:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								{legalConfig.platform.dataTypes.map((dataType, index) => (
									<li key={index}>{dataType}</li>
								))}
							</ul>
							<p className='text-sm text-muted-foreground'>
								<strong>Important:</strong> You retain ownership of all data you
								upload. We process this data solely to provide our services and
								do not use it for any other purpose without your explicit
								consent.
							</p>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							2.3 Automatically Collected Information
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>We automatically collect certain technical information:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Log Data:</strong> IP addresses, browser type,
									operating system, and access timestamps
								</li>
								<li>
									<strong>Device Information:</strong> Device type, screen
									resolution, and browser settings
								</li>
								<li>
									<strong>Performance Data:</strong> Response times, error
									rates, and system performance metrics
								</li>
								<li>
									<strong>Analytics Data:</strong> Feature usage patterns and
									user behavior (anonymized)
								</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							3. How We Use Your Information
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								We use the collected information for the following purposes:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Service Provision:</strong> To provide, maintain, and
									improve our platform
								</li>
								<li>
									<strong>User Management:</strong> To manage user accounts,
									permissions, and access controls
								</li>
								<li>
									<strong>Communication:</strong> To send important service
									updates, security alerts, and support responses
								</li>
								<li>
									<strong>Billing:</strong> To process payments, manage
									subscriptions, and handle billing inquiries
								</li>
								<li>
									<strong>Security:</strong> To detect and prevent fraud, abuse,
									and security threats
								</li>
								<li>
									<strong>Compliance:</strong> To meet legal obligations and
									regulatory requirements
								</li>
								<li>
									<strong>Analytics:</strong> To analyze usage patterns and
									improve user experience (anonymized data only)
								</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							4. Data Sharing and Disclosure
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								We do not sell, trade, or rent your personal information to
								third parties. We may share your information in the following
								limited circumstances:
							</p>

							<h4 className='text-lg font-semibold text-foreground mb-2'>
								4.1 Service Providers
							</h4>
							<p>
								We work with trusted third-party service providers who assist us
								in operating our platform:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Cloud Infrastructure:</strong>{" "}
									{legalConfig.services.cloudProvider} for hosting and data
									storage
								</li>
								<li>
									<strong>Payment Processing:</strong>{" "}
									{legalConfig.services.paymentProcessor} for payment processing
									and billing
								</li>
								<li>
									<strong>Email Services:</strong>{" "}
									{legalConfig.services.emailProvider} for transactional and
									marketing emails
								</li>
								<li>
									<strong>Analytics:</strong>{" "}
									{legalConfig.services.analyticsProvider} for usage analytics
									(anonymized data only)
								</li>
							</ul>

							<h4 className='text-lg font-semibold text-foreground mb-2 mt-4'>
								4.2 Legal Requirements
							</h4>
							<p>
								We may disclose your information if required by law or in
								response to valid legal requests, such as:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>Court orders or subpoenas</li>
								<li>Government investigations</li>
								<li>Regulatory compliance requirements</li>
								<li>Protection of our rights, property, or safety</li>
							</ul>

							<h4 className='text-lg font-semibold text-foreground mb-2 mt-4'>
								4.3 Business Transfers
							</h4>
							<p>
								In the event of a merger, acquisition, or sale of assets, your
								information may be transferred as part of the business
								transaction. We will notify you of any such change in ownership
								or control.
							</p>

							<h4 className='text-lg font-semibold text-foreground mb-2 mt-4'>
								4.4 Data Types and API Usage
							</h4>
							<p>
								Our platform handles the following types of data through our API
								and services:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Database Structures:</strong> Table schemas, column
									definitions, and relationships
								</li>
								<li>
									<strong>Business Data:</strong> Records, transactions, and
									custom data stored in your databases
								</li>
								<li>
									<strong>User Management:</strong> User accounts, roles,
									permissions, and access controls
								</li>
								<li>
									<strong>System Logs:</strong> API usage, data access, and
									system performance metrics
								</li>
								<li>
									<strong>Configuration Data:</strong> Tenant settings, module
									configurations, and custom preferences
								</li>
							</ul>
							<p>
								API access is logged and monitored for security purposes. All
								API requests are authenticated and rate-limited according to
								your subscription plan.
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							5. Data Security
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								We implement comprehensive security measures to protect your
								information:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Encryption:</strong> All data is encrypted in transit
									(TLS 1.3) and at rest (AES-256)
								</li>
								<li>
									<strong>Access Controls:</strong> Multi-factor authentication
									and role-based access controls
								</li>
								<li>
									<strong>Network Security:</strong> Firewalls, intrusion
									detection, and DDoS protection
								</li>
								<li>
									<strong>Data Backup:</strong> Regular automated backups with
									point-in-time recovery
								</li>
								<li>
									<strong>Security Audits:</strong> Regular security assessments
									and penetration testing
								</li>
								<li>
									<strong>Employee Training:</strong> Regular security awareness
									training for our team
								</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							6. Data Retention
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								We retain your information for as long as necessary to provide
								our services and comply with legal obligations:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Account Data:</strong> Retained while your account is
									active and for 30 days after deletion
								</li>
								<li>
									<strong>Usage Logs:</strong> Retained for 12 months for
									security and troubleshooting
								</li>
								<li>
									<strong>Billing Records:</strong> Retained for 7 years to
									comply with tax and accounting requirements
								</li>
								<li>
									<strong>Support Communications:</strong> Retained for 3 years
									for quality improvement
								</li>
								<li>
									<strong>Analytics Data:</strong> Anonymized data retained for
									up to 3 years
								</li>
							</ul>
							<p>
								Upon account deletion, we will permanently delete your data
								within 30 days, except where retention is required by law.
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							7. Your Rights and Choices
						</h2>

						<h3 className='text-xl font-semibold text-foreground mb-3'>
							7.1 GDPR Rights (EU Users)
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>
								If you are located in the European Union, you have the following
								rights:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Right of Access:</strong> Request a copy of your
									personal data
								</li>
								<li>
									<strong>Right to Rectification:</strong> Correct inaccurate or
									incomplete data
								</li>
								<li>
									<strong>Right to Erasure:</strong> Request deletion of your
									personal data
								</li>
								<li>
									<strong>Right to Restriction:</strong> Limit how we process
									your data
								</li>
								<li>
									<strong>Right to Portability:</strong> Receive your data in a
									structured format
								</li>
								<li>
									<strong>Right to Object:</strong> Object to certain types of
									processing
								</li>
								<li>
									<strong>Right to Withdraw Consent:</strong> Withdraw consent
									for data processing
								</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							7.2 CCPA Rights (California Users)
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>
								If you are a California resident, you have the following rights:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Right to Know:</strong> Request information about
									personal data collected and shared
								</li>
								<li>
									<strong>Right to Delete:</strong> Request deletion of personal
									data
								</li>
								<li>
									<strong>Right to Opt-Out:</strong> Opt out of the sale of
									personal data (we do not sell data)
								</li>
								<li>
									<strong>Right to Non-Discrimination:</strong> Receive equal
									service regardless of exercising your rights
								</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							7.3 How to Exercise Your Rights
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>
								To exercise any of these rights, please contact us at{" "}
								{legalConfig.company.email.privacy}. We will respond to your
								request within 30 days.
							</p>
							<p>
								You may also manage your data through your account settings,
								where you can:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>Update your profile information</li>
								<li>Manage your privacy preferences</li>
								<li>Download your data</li>
								<li>Delete your account</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							8. International Data Transfers
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								Our platform is hosted in {legalConfig.company.hostingLocation}.
								If you are located outside this region, your data may be
								transferred to and processed in this location.
							</p>
							<p>
								For EU users, we ensure adequate protection for international
								data transfers through:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									Standard Contractual Clauses (SCCs) approved by the European
									Commission
								</li>
								<li>Adequacy decisions for certain countries</li>
								<li>Appropriate safeguards and security measures</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							9. Cookies and Tracking Technologies
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								We use cookies and similar technologies to enhance your
								experience:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Essential Cookies:</strong> Required for basic
									platform functionality
								</li>
								<li>
									<strong>Performance Cookies:</strong> Help us understand how
									you use our platform
								</li>
								<li>
									<strong>Functional Cookies:</strong> Remember your preferences
									and settings
								</li>
								<li>
									<strong>Analytics Cookies:</strong> Provide insights into
									platform usage (anonymized)
								</li>
							</ul>
							<p>
								You can control cookie preferences through your browser
								settings. However, disabling certain cookies may affect platform
								functionality.
							</p>
							<p>
								For detailed information about our use of cookies, please see
								our{" "}
								<a
									href='/docs/legal/cookies'
									className='text-primary hover:underline'>
									Cookie Policy
								</a>
								.
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							10. Children's Privacy
						</h2>
						<p className='text-foreground'>
							Our Service is not intended for children under 16 years of age. We
							do not knowingly collect personal information from children under
							16. If you become aware that a child has provided us with personal
							information, please contact us immediately.
						</p>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							11. Changes to This Policy
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								We may update this Privacy Policy from time to time to reflect
								changes in our practices or applicable laws. We will notify you
								of any material changes by:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>Posting the updated policy on our website</li>
								<li>
									Sending an email notification to your registered email address
								</li>
								<li>Displaying a prominent notice in our platform</li>
							</ul>
							<p>
								Your continued use of our Service after such changes constitutes
								acceptance of the updated policy.
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							12. Contact Information
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								If you have any questions about this Privacy Policy or our data
								practices, please contact us:
							</p>

							<div className='bg-muted/50 p-4 rounded-lg space-y-2'>
								<p>
									<strong>Data Protection Officer:</strong>{" "}
									{legalConfig.legal.dataProtectionOfficer}
								</p>
								<p>
									<strong>{getFullCompanyName()}</strong>
								</p>
								<p>{getCompanyAddress()}</p>
								<p>Email: {legalConfig.company.email.privacy}</p>
								<p>Phone: {legalConfig.company.phone}</p>
							</div>

							<div className='bg-muted/50 p-4 rounded-lg space-y-2 mt-4'>
								<p>
									<strong>EU Representative (if applicable):</strong>
								</p>
								<p>{legalConfig.legal.representativeEU}</p>
							</div>

							<p className='text-sm text-muted-foreground mt-4'>
								<strong>Note:</strong> For data subject rights requests, please
								use the dedicated email address:{" "}
								{legalConfig.company.email.rights}
							</p>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
