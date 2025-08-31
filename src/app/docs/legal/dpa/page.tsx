/** @format */

import {
	legalConfig,
	getCompanyAddress,
	getFullCompanyName,
} from "@/lib/legal-config";

export default function DataProcessingAgreementPage() {
	return (
		<div className='container mx-auto px-4 py-8 max-w-4xl'>
			<div className='prose prose-lg max-w-none'>
				<h1 className='text-4xl font-bold text-foreground mb-8'>
					Data Processing Agreement
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

				<div className='bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mb-8'>
					<p className='text-blue-800 dark:text-blue-200 text-sm'>
						<strong>Important:</strong> This Data Processing Agreement (DPA) is
						designed to ensure compliance with the General Data Protection
						Regulation (GDPR) and other applicable data protection laws. It
						defines the roles and responsibilities of both parties when
						processing personal data through our platform.
					</p>
				</div>

				<div className='space-y-8'>
					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							1. Definitions
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>For the purposes of this Agreement:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>"GDPR"</strong> means the General Data Protection
									Regulation (EU) 2016/679
								</li>
								<li>
									<strong>"Data Controller"</strong> means the entity that
									determines the purposes and means of processing personal data
								</li>
								<li>
									<strong>"Data Processor"</strong> means the entity that
									processes personal data on behalf of the Data Controller
								</li>
								<li>
									<strong>"Personal Data"</strong> means any information
									relating to an identified or identifiable natural person
								</li>
								<li>
									<strong>"Processing"</strong> means any operation performed on
									personal data
								</li>
								<li>
									<strong>"Data Subject"</strong> means the individual to whom
									the personal data relates
								</li>
								<li>
									<strong>"Sub-processor"</strong> means any third party engaged
									by the Data Processor to process personal data
								</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							2. Roles and Responsibilities
						</h2>

						<h3 className='text-xl font-semibold text-foreground mb-3'>
							2.1 Data Controller
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>
								You, as the tenant of our platform, act as the Data Controller
								for:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									Personal data of your employees, customers, and business
									contacts
								</li>
								<li>
									Business data you upload and manage through our platform
								</li>
								<li>User accounts and permissions within your tenant</li>
								<li>Any other personal data you collect and process</li>
							</ul>
							<p>As Data Controller, you are responsible for:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									Ensuring you have a legal basis for processing personal data
								</li>
								<li>Obtaining necessary consents from data subjects</li>
								<li>Implementing appropriate data protection measures</li>
								<li>Responding to data subject rights requests</li>
								<li>Maintaining records of processing activities</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							2.2 Data Processor
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>{legalConfig.company.name} acts as the Data Processor for:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>Platform infrastructure and hosting services</li>
								<li>Data storage and backup services</li>
								<li>Platform security and access controls</li>
								<li>Technical support and maintenance</li>
								<li>
									Analytics and performance monitoring (anonymized data only)
								</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							3. Subject Matter and Duration
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								<strong>Subject Matter:</strong> This Agreement governs the
								processing of personal data by {legalConfig.company.name} on
								behalf of you, the Data Controller, in connection with the
								provision of our {legalConfig.platform.serviceDescription}.
							</p>
							<p>
								<strong>Duration:</strong> This Agreement remains in effect for
								the duration of your subscription to our platform and for any
								period during which we continue to process personal data on your
								behalf.
							</p>
							<p>
								<strong>Nature and Purpose:</strong> The processing is necessary
								for the provision of our platform services, including data
								storage, user management, and platform functionality.
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							4. Types of Personal Data and Categories of Data Subjects
						</h2>

						<h3 className='text-xl font-semibold text-foreground mb-3'>
							4.1 Types of Personal Data
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>We may process the following types of personal data:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Account Data:</strong> Names, email addresses,
									passwords, roles, and profile information
								</li>
								<li>
									<strong>Business Data:</strong> Company information,
									addresses, phone numbers, and tax identifiers
								</li>
								<li>
									<strong>Usage Data:</strong> Login times, feature usage, and
									platform interactions
								</li>
								<li>
									<strong>Technical Data:</strong> IP addresses, browser
									information, and device details
								</li>
								<li>
									<strong>Communication Data:</strong> Support requests,
									feedback, and correspondence
								</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							4.2 Categories of Data Subjects
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>Personal data may relate to:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Your Employees:</strong> Staff members who use the
									platform
								</li>
								<li>
									<strong>Your Customers:</strong> Individuals whose data you
									store and manage
								</li>
								<li>
									<strong>Your Business Contacts:</strong> Partners, suppliers,
									and other business relationships
								</li>
								<li>
									<strong>Platform Users:</strong> Individuals with access to
									your tenant
								</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							5. Our Obligations as Data Processor
						</h2>

						<h3 className='text-xl font-semibold text-foreground mb-3'>
							5.1 Processing in Accordance with Instructions
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>We will:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									Process personal data only on documented instructions from you
								</li>
								<li>
									Not process personal data for any purpose other than providing
									our services
								</li>
								<li>
									Immediately inform you if we believe your instructions
									infringe GDPR or other applicable law
								</li>
								<li>
									Not engage any sub-processor without your prior written
									consent
								</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							5.2 Confidentiality
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>We will:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									Ensure that persons authorized to process personal data are
									bound by confidentiality obligations
								</li>
								<li>
									Maintain the confidentiality of personal data even after the
									termination of this Agreement
								</li>
								<li>
									Provide regular training to our staff on data protection and
									confidentiality
								</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							5.3 Security Measures
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>
								We implement appropriate technical and organizational measures
								to ensure a level of security appropriate to the risk:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Technical Measures:</strong> Encryption, access
									controls, and security monitoring
								</li>
								<li>
									<strong>Organizational Measures:</strong> Staff training,
									security policies, and incident response procedures
								</li>
								<li>
									<strong>Physical Measures:</strong> Secure data centers and
									access controls
								</li>
								<li>
									<strong>Regular Assessments:</strong> Security audits and
									penetration testing
								</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							5.4 Sub-processors
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>
								We may engage sub-processors to assist in providing our
								services. We will:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>Maintain an up-to-date list of sub-processors</li>
								<li>Impose data protection obligations on sub-processors</li>
								<li>Remain liable for sub-processor compliance</li>
								<li>Notify you of any intended changes to sub-processors</li>
							</ul>
							<p>Current sub-processors include:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Cloud Infrastructure:</strong> {legalConfig.services.cloudProvider} - Data hosting and storage
								</li>
								<li>
									<strong>Payment Processing:</strong> {legalConfig.services.paymentProcessor} - Payment
									processing and billing
								</li>
								<li>
									<strong>Email Services:</strong> {legalConfig.services.emailProvider} -
									Transactional and support emails
								</li>
								<li>
									<strong>Monitoring:</strong> {legalConfig.services.monitoringProvider} -
									System performance monitoring
								</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							5.5 Data Subject Rights
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>
								We will assist you in responding to data subject rights requests
								by:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>Providing technical support for data access and export</li>
								<li>Assisting with data deletion and rectification</li>
								<li>Supporting data portability requests</li>
								<li>Providing information about data processing activities</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							5.6 Data Breach Notification
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>In the event of a personal data breach, we will:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									Notify you without undue delay after becoming aware of the
									breach
								</li>
								<li>Provide detailed information about the breach</li>
								<li>Assist you in meeting your notification obligations</li>
								<li>Take immediate steps to contain and mitigate the breach</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							5.7 Data Protection Impact Assessment
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>
								We will assist you in conducting data protection impact
								assessments by:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>Providing information about our processing activities</li>
								<li>Assessing the risks associated with our processing</li>
								<li>Recommending appropriate mitigation measures</li>
								<li>Supporting ongoing monitoring and review</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							6. Your Obligations as Data Controller
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>As the Data Controller, you are responsible for:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Legal Basis:</strong> Ensuring you have a valid legal
									basis for processing personal data
								</li>
								<li>
									<strong>Consent Management:</strong> Obtaining and managing
									necessary consents from data subjects
								</li>
								<li>
									<strong>Data Quality:</strong> Ensuring the accuracy and
									relevance of personal data
								</li>
								<li>
									<strong>Data Minimization:</strong> Only collecting and
									processing necessary personal data
								</li>
								<li>
									<strong>Retention Policies:</strong> Establishing and
									enforcing data retention policies
								</li>
								<li>
									<strong>Data Subject Rights:</strong> Responding to data
									subject requests within required timeframes
								</li>
								<li>
									<strong>Breach Notification:</strong> Notifying relevant
									authorities and data subjects of breaches
								</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							7. Data Transfers
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								Our platform may involve international data transfers. We ensure
								adequate protection through:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Standard Contractual Clauses:</strong> EU-approved
									data transfer agreements
								</li>
								<li>
									<strong>Adequacy Decisions:</strong> Transfers to countries
									with adequate data protection
								</li>
								<li>
									<strong>Certification Schemes:</strong> Industry-recognized
									data protection certifications
								</li>
								<li>
									<strong>Binding Corporate Rules:</strong> Internal data
									protection policies for international transfers
								</li>
							</ul>
							<p>Current data processing locations:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Primary Processing:</strong> {legalConfig.company.hostingLocation}
								</li>
								<li>
									<strong>Backup Storage:</strong> {legalConfig.company.backupLocation}
								</li>
								<li>
									<strong>CDN Services:</strong> {legalConfig.company.cdnLocations}
								</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							8. Audit Rights
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								You have the right to audit our compliance with this Agreement
								by:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									Requesting information about our data processing activities
								</li>
								<li>Reviewing our security measures and policies</li>
								<li>Conducting on-site audits (with reasonable notice)</li>
								<li>Requesting third-party security assessments</li>
							</ul>
							<p>
								We will provide reasonable assistance and access to relevant
								documentation and personnel.
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							9. Data Return and Deletion
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								Upon termination of your subscription or upon your request, we
								will:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									Return all personal data to you in a structured, commonly used
									format
								</li>
								<li>
									Delete all personal data from our systems within 30 days
								</li>
								<li>Provide written confirmation of data deletion</li>
								<li>Ensure sub-processors also delete the data</li>
							</ul>
							<p>
								We may retain certain data where required by law or for
								legitimate business purposes (e.g., billing records, audit
								logs).
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							10. Liability and Indemnification
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								Each party's liability for data protection breaches is limited
								to:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>Direct damages caused by the breach</li>
								<li>Regulatory fines imposed on the other party</li>
								<li>Costs of responding to data protection authorities</li>
								<li>Expenses related to data breach notifications</li>
							</ul>
							<p>
								Neither party shall be liable for indirect, consequential, or
								punitive damages arising from data protection breaches.
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							11. Governing Law and Dispute Resolution
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
															This Agreement is governed by the laws of {legalConfig.company.jurisdiction}.
							Any disputes shall be resolved through:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>Good faith negotiations between the parties</li>
								<li>Mediation by a neutral third party</li>
								<li>Binding arbitration if mediation fails</li>
								<li>Court proceedings as a last resort</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							12. Contact Information
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>For questions about this Data Processing Agreement:</p>

							<div className='bg-muted/50 p-4 rounded-lg space-y-2'>
								<p>
									<strong>{getFullCompanyName()}</strong>
								</p>
								<p>
									<strong>Data Protection Officer:</strong> {legalConfig.legal.dataProtectionOfficer}
								</p>
								<p>{getCompanyAddress()}</p>
								<p>Email: {legalConfig.company.email.dpo}</p>
								<p>Phone: {legalConfig.company.phone}</p>
							</div>

							<p className='text-sm text-muted-foreground mt-4'>
								<strong>EU Representative (if applicable):</strong> {legalConfig.legal.representativeEU}
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							13. Acceptance and Execution
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								This Data Processing Agreement is automatically accepted when
								you:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>Sign up for our platform</li>
								<li>
									Continue using our services after updates to this Agreement
								</li>
								<li>Accept our updated Terms of Service</li>
							</ul>
							<p>
															You may also execute this Agreement separately by signing and
							returning a copy to {legalConfig.company.email.legal}.
							</p>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
