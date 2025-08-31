/** @format */

import {
	legalConfig,
	getCompanyAddress,
	getFullCompanyName,
} from "@/lib/legal-config";

export default function AcceptableUsePolicyPage() {
	return (
		<div className='container mx-auto px-4 py-8 max-w-4xl'>
			<div className='prose prose-lg max-w-none'>
				<h1 className='text-4xl font-bold text-foreground mb-8'>
					Acceptable Use Policy
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

				<div className='bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg mb-8'>
					<p className='text-yellow-800 dark:text-yellow-200 text-sm'>
						<strong>Important:</strong> This Acceptable Use Policy is part of
						our Terms of Service. Violation of this policy may result in
						suspension or termination of your account. Please read this policy
						carefully to understand what constitutes acceptable use of our
						platform.
					</p>
				</div>

				<div className='space-y-8'>
					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							1. Introduction
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								This Acceptable Use Policy ("Policy") outlines the rules and
								guidelines for using the {legalConfig.company.name}{" "}
								{legalConfig.platform.serviceDescription}. By using our
								platform, you agree to comply with this policy and all
								applicable laws and regulations.
							</p>
							<p>
								We are committed to maintaining a secure, reliable, and
								professional environment for all users. This policy helps ensure
								that our platform remains a valuable resource for legitimate
								business purposes.
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							2. Acceptable Uses
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								Our platform is designed for legitimate business purposes,
								including:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Business Data Management:</strong> Storing and
									organizing business records, customer data, and operational
									information
								</li>
								<li>
									<strong>Team Collaboration:</strong> Sharing data and
									collaborating with authorized team members
								</li>
								<li>
									<strong>Business Analytics:</strong> Analyzing data to improve
									business operations and decision-making
								</li>
								<li>
									<strong>Customer Relationship Management:</strong> Managing
									customer interactions and relationships
								</li>
								<li>
									<strong>Inventory and Asset Management:</strong> Tracking
									business assets, inventory, and resources
								</li>
								<li>
									<strong>Financial Management:</strong> Managing invoices,
									expenses, and financial records
								</li>
								<li>
									<strong>Compliance and Reporting:</strong> Maintaining records
									for regulatory compliance and reporting
								</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							3. Prohibited Uses
						</h2>

						<h3 className='text-xl font-semibold text-foreground mb-3'>
							3.1 Illegal Activities
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>
								You may not use our platform for any illegal purposes,
								including:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									Violating any applicable local, state, national, or
									international laws or regulations
								</li>
								<li>
									Engaging in fraud, money laundering, or other financial crimes
								</li>
								<li>
									Violating intellectual property rights, including copyright,
									trademark, and patent laws
								</li>
								<li>
									Engaging in cybercrime, hacking, or unauthorized access to
									systems
								</li>
								<li>
									Distributing illegal drugs, weapons, or other contraband
								</li>
								<li>
									Engaging in human trafficking or other human rights violations
								</li>
								<li>Violating export control laws or trade sanctions</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							3.2 Harmful Content and Activities
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>You may not use our platform to:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									Upload, store, or distribute malicious software, viruses, or
									harmful code
								</li>
								<li>
									Engage in phishing, social engineering, or other deceptive
									practices
								</li>
								<li>
									Distribute spam, unsolicited commercial messages, or bulk
									emails
								</li>
								<li>
									Harass, threaten, or intimidate other users or individuals
								</li>
								<li>Promote violence, hate speech, or discrimination</li>
								<li>
									Share explicit, pornographic, or otherwise inappropriate
									content
								</li>
								<li>Impersonate others or create false identities</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							3.3 Platform Abuse
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>You may not:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									Attempt to gain unauthorized access to our systems or other
									users' accounts
								</li>
								<li>
									Use automated tools to scrape, crawl, or extract data without
									permission
								</li>
								<li>Overload our servers with excessive requests or traffic</li>
								<li>
									Circumvent platform limitations, restrictions, or security
									measures
								</li>
								<li>
									Reverse engineer, decompile, or attempt to extract source code
								</li>
								<li>
									Use the platform for cryptocurrency mining or other
									resource-intensive activities
								</li>
								<li>
									Share account credentials or allow unauthorized access to your
									account
								</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							3.4 Data Privacy Violations
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>You may not:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									Collect, store, or process personal data without proper
									consent
								</li>
								<li>
									Violate applicable data protection laws (GDPR, CCPA, etc.)
								</li>
								<li>
									Share or sell personal data to third parties without
									authorization
								</li>
								<li>
									Use personal data for purposes other than those disclosed to
									data subjects
								</li>
								<li>
									Fail to implement appropriate security measures for sensitive
									data
								</li>
								<li>
									Retain personal data longer than necessary or permitted by law
								</li>
								<li>
									Transfer personal data to countries without adequate
									protection
								</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							4. Content Standards
						</h2>

						<h3 className='text-xl font-semibold text-foreground mb-3'>
							4.1 Data Quality and Accuracy
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>When using our platform, you must ensure:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>All data uploaded is accurate, complete, and up-to-date</li>
								<li>Data is relevant to legitimate business purposes</li>
								<li>
									Data does not contain false, misleading, or deceptive
									information
								</li>
								<li>Data is properly categorized and organized</li>
								<li>Outdated or irrelevant data is regularly cleaned up</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							4.2 Professional Conduct
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>You must maintain professional standards:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									Use appropriate language and avoid offensive or inflammatory
									content
								</li>
								<li>Respect intellectual property rights and copyright laws</li>
								<li>
									Maintain confidentiality of sensitive business information
								</li>
								<li>Follow industry best practices for data management</li>
								<li>
									Comply with relevant professional standards and regulations
								</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							5. Security Requirements
						</h2>

						<h3 className='text-xl font-semibold text-foreground mb-3'>
							5.1 Account Security
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>You are responsible for:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>Maintaining strong, unique passwords for your account</li>
								<li>Enabling multi-factor authentication when available</li>
								<li>Keeping your login credentials confidential and secure</li>
								<li>Logging out of your account when using shared devices</li>
								<li>
									Regularly reviewing account activity for suspicious behavior
								</li>
								<li>
									Immediately reporting any unauthorized access or security
									concerns
								</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							5.2 Data Security
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>You must implement appropriate security measures:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>Encrypt sensitive data before uploading to the platform</li>
								<li>Implement access controls and user permissions</li>
								<li>Regularly review and update user access rights</li>
								<li>Monitor data access and usage patterns</li>
								<li>Implement backup and recovery procedures</li>
								<li>Train users on security best practices</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							6. Resource Usage and Limitations
						</h2>

						<h3 className='text-xl font-semibold text-foreground mb-3'>
							6.1 Fair Use
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>You must use platform resources responsibly:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									Stay within your subscription plan's storage and usage limits
								</li>
								<li>Avoid excessive API calls or automated requests</li>
								<li>Use bandwidth and computing resources efficiently</li>
								<li>Schedule large data operations during off-peak hours</li>
								<li>Monitor resource usage and optimize as needed</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							6.2 Prohibited Resource Usage
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>You may not:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									Use the platform for cryptocurrency mining or similar
									activities
								</li>
								<li>Run resource-intensive applications or scripts</li>
								<li>Use the platform as a content delivery network (CDN)</li>
								<li>Host large media files or streaming content</li>
								<li>
									Use the platform for file sharing or peer-to-peer applications
								</li>
								<li>
									Engage in activities that could impact other users'
									performance
								</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							7. Third-Party Integrations and APIs
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>When using our APIs or third-party integrations:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>Follow our API rate limits and usage guidelines</li>
								<li>Implement proper error handling and retry logic</li>
								<li>
									Use secure authentication methods (API keys, OAuth, etc.)
								</li>
								<li>Validate and sanitize all data inputs</li>
								<li>Monitor integration performance and error rates</li>
								<li>Comply with third-party service terms and conditions</li>
								<li>Implement appropriate security measures for API access</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							8. Compliance and Monitoring
						</h2>

						<h3 className='text-xl font-semibold text-foreground mb-3'>
							8.1 Our Monitoring
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>We actively monitor platform usage to:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>Detect and prevent security threats and abuse</li>
								<li>Ensure platform performance and reliability</li>
								<li>Identify and resolve technical issues</li>
								<li>Comply with legal and regulatory requirements</li>
								<li>Improve platform features and user experience</li>
								<li>Enforce this Acceptable Use Policy</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							8.2 Your Cooperation
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>
								You must cooperate with our monitoring and compliance efforts:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>Respond to requests for information about your usage</li>
								<li>Provide access to your data for compliance audits</li>
								<li>Implement recommended security improvements</li>
								<li>Report any security incidents or policy violations</li>
								<li>Assist with investigations of potential violations</li>
								<li>Maintain records required for compliance purposes</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							9. Violations and Enforcement
						</h2>

						<h3 className='text-xl font-semibold text-foreground mb-3'>
							9.1 Violation Categories
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>Violations are categorized by severity:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Minor Violations:</strong> First-time policy
									violations or technical issues
								</li>
								<li>
									<strong>Moderate Violations:</strong> Repeated violations or
									policy circumvention
								</li>
								<li>
									<strong>Major Violations:</strong> Security breaches, illegal
									activities, or severe abuse
								</li>
								<li>
									<strong>Critical Violations:</strong> Immediate threats to
									platform security or other users
								</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							9.2 Enforcement Actions
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>We may take the following enforcement actions:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Warning:</strong> Written notice of policy violation
								</li>
								<li>
									<strong>Temporary Suspension:</strong> Temporary restriction
									of platform access
								</li>
								<li>
									<strong>Feature Restrictions:</strong> Limiting access to
									specific platform features
								</li>
								<li>
									<strong>Account Termination:</strong> Permanent removal of
									account and data
								</li>
								<li>
									<strong>Legal Action:</strong> Pursuing legal remedies for
									serious violations
								</li>
								<li>
									<strong>Reporting:</strong> Reporting violations to relevant
									authorities
								</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							9.3 Appeal Process
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>If you believe enforcement action was taken in error:</p>
							<ol className='list-decimal pl-6 space-y-2'>
								<li>Submit a written appeal within 30 days of the action</li>
								<li>Provide evidence supporting your position</li>
								<li>Allow 5-10 business days for review</li>
								<li>Receive written decision with explanation</li>
								<li>Request further review if necessary</li>
							</ol>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							10. Reporting Violations
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>To report policy violations or security concerns:</p>

							<div className='bg-muted/50 p-4 rounded-lg space-y-2'>
								<p>
									<strong>Security Issues:</strong>{" "}
									{legalConfig.company.email.security}
								</p>
								<p>
									<strong>Policy Violations:</strong>{" "}
									{legalConfig.company.email.compliance}
								</p>
								<p>
									<strong>Abuse Reports:</strong>{" "}
									{legalConfig.company.email.abuse}
								</p>
								<p>
									<strong>Emergency Contact:</strong>{" "}
									{legalConfig.company.phone}
								</p>
							</div>

							<p className='mt-4'>When reporting, please include:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>Detailed description of the violation or concern</li>
								<li>Relevant account information or identifiers</li>
								<li>Evidence or documentation supporting your report</li>
								<li>Your contact information for follow-up</li>
								<li>Urgency level and potential impact</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							11. Updates to This Policy
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>We may update this Acceptable Use Policy from time to time:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>Changes will be posted on this page with updated dates</li>
								<li>
									Material changes will be communicated via email or platform
									notifications
								</li>
								<li>
									Continued use of the platform constitutes acceptance of
									updated policies
								</li>
								<li>
									You may be required to explicitly accept significant policy
									changes
								</li>
								<li>
									Previous versions of the policy will be archived for reference
								</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							12. Contact Information
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>For questions about this Acceptable Use Policy:</p>

							<div className='bg-muted/50 p-4 rounded-lg space-y-2'>
								<p>
									<strong>{getFullCompanyName()}</strong>
								</p>
								<p>
									<strong>Compliance Team:</strong>{" "}
									{legalConfig.company.email.compliance}
								</p>
								<p>{getCompanyAddress()}</p>
								<p>Phone: {legalConfig.company.phone}</p>
								<p>
									Hours: Monday-Friday, 9:00 AM - 6:00 PM{" "}
									{legalConfig.company.timezone}
								</p>
							</div>

							<p className='text-sm text-muted-foreground mt-4'>
								<strong>Note:</strong> For urgent security issues, please use
								the emergency contact number provided above.
							</p>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
