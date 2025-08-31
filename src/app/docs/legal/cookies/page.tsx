/** @format */

import {
	legalConfig,
	getCompanyAddress,
	getFullCompanyName,
} from "@/lib/legal-config";

export default function CookiePolicyPage() {
	return (
		<div className='container mx-auto px-4 py-8 max-w-4xl'>
			<div className='prose prose-lg max-w-none'>
				<h1 className='text-4xl font-bold text-foreground mb-8'>
					Cookie Policy
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
								This Cookie Policy explains how {legalConfig.company.name}{" "}
								("we," "our," or "us") uses cookies and similar tracking
								technologies when you visit and use our{" "}
								{legalConfig.platform.serviceDescription}.
							</p>
							<p>
								By using our platform, you consent to the use of cookies in
								accordance with this policy. You can manage your cookie
								preferences at any time through your browser settings or our
								cookie consent manager.
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							2. What Are Cookies?
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								Cookies are small text files that are stored on your device
								(computer, tablet, or mobile phone) when you visit a website.
								They help websites remember information about your visit, such
								as your preferred language and other settings, which can make
								your next visit easier and more useful.
							</p>
							<p>
								We also use similar technologies such as web beacons, pixel
								tags, and local storage that serve similar purposes to cookies.
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							3. Types of Cookies We Use
						</h2>

						<h3 className='text-xl font-semibold text-foreground mb-3'>
							3.1 Essential Cookies
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>
								These cookies are necessary for the platform to function
								properly and cannot be disabled. They include:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Authentication Cookies:</strong> Remember your login
									status and session information
								</li>
								<li>
									<strong>Security Cookies:</strong> Protect against fraud and
									ensure secure connections
								</li>
								<li>
									<strong>Load Balancing Cookies:</strong> Distribute traffic
									across our servers
								</li>
								<li>
									<strong>CSRF Protection:</strong> Prevent cross-site request
									forgery attacks
								</li>
							</ul>
							<p className='text-sm text-muted-foreground'>
								<strong>Note:</strong> Disabling essential cookies will prevent
								the platform from functioning properly.
							</p>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							3.2 Performance Cookies
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>
								These cookies help us understand how visitors interact with our
								platform by collecting and reporting information anonymously:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Analytics Cookies:</strong> Track page views, time
									spent on pages, and user journey
								</li>
								<li>
									<strong>Performance Monitoring:</strong> Monitor response
									times and error rates
								</li>
								<li>
									<strong>Load Testing:</strong> Understand platform performance
									under different conditions
								</li>
								<li>
									<strong>Feature Usage:</strong> Track which features are most
									and least used
								</li>
							</ul>
							<p className='text-sm text-muted-foreground'>
								<strong>Note:</strong> These cookies do not collect personal
								information and are used solely to improve platform performance.
							</p>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							3.3 Functional Cookies
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>
								These cookies enable enhanced functionality and personalization:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Preference Cookies:</strong> Remember your language,
									theme, and display settings
								</li>
								<li>
									<strong>Feature Cookies:</strong> Remember your custom
									configurations and preferences
								</li>
								<li>
									<strong>Session Cookies:</strong> Maintain your session state
									across page refreshes
								</li>
								<li>
									<strong>User Experience Cookies:</strong> Remember your
									interface preferences and shortcuts
								</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							3.4 Third-Party Cookies
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>
								Some cookies are placed by third-party services that appear on
								our platform:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Stripe:</strong> Payment processing and fraud
									detection
								</li>
								<li>
									<strong>Analytics Services:</strong>{" "}
									{legalConfig.services.analyticsProvider} for usage analytics
								</li>
								<li>
									<strong>Support Tools:</strong>{" "}
									{legalConfig.services.supportProvider ||
										"Our internal support system"}{" "}
									for customer support features
								</li>
								<li>
									<strong>Performance Monitoring:</strong>{" "}
									{legalConfig.services.monitoringProvider ||
										"Our internal monitoring system"}{" "}
									for system monitoring
								</li>
							</ul>
							<p className='text-sm text-muted-foreground'>
								<strong>Note:</strong> Third-party cookies are subject to their
								respective privacy policies.
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							4. Specific Cookies We Use
						</h2>

						<div className='overflow-x-auto'>
							<table className='w-full border-collapse border border-border'>
								<thead>
									<tr className='bg-muted/50'>
										<th className='border border-border p-3 text-left font-semibold'>
											Cookie Name
										</th>
										<th className='border border-border p-3 text-left font-semibold'>
											Purpose
										</th>
										<th className='border border-border p-3 text-left font-semibold'>
											Duration
										</th>
										<th className='border border-border p-3 text-left font-semibold'>
											Type
										</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td className='border border-border p-3'>auth_token</td>
										<td className='border border-border p-3'>
											Authentication and session management
										</td>
										<td className='border border-border p-3'>Session</td>
										<td className='border border-border p-3'>Essential</td>
									</tr>
									<tr>
										<td className='border border-border p-3'>csrf_token</td>
										<td className='border border-border p-3'>
											Security protection against CSRF attacks
										</td>
										<td className='border border-border p-3'>Session</td>
										<td className='border border-border p-3'>Essential</td>
									</tr>
									<tr>
										<td className='border border-border p-3'>
											user_preferences
										</td>
										<td className='border border-border p-3'>
											Store user interface preferences
										</td>
										<td className='border border-border p-3'>1 year</td>
										<td className='border border-border p-3'>Functional</td>
									</tr>
									<tr>
										<td className='border border-border p-3'>theme_mode</td>
										<td className='border border-border p-3'>
											Remember dark/light theme preference
										</td>
										<td className='border border-border p-3'>1 year</td>
										<td className='border border-border p-3'>Functional</td>
									</tr>
									<tr>
										<td className='border border-border p-3'>language</td>
										<td className='border border-border p-3'>
											Store language preference
										</td>
										<td className='border border-border p-3'>1 year</td>
										<td className='border border-border p-3'>Functional</td>
									</tr>
									<tr>
										<td className='border border-border p-3'>analytics_id</td>
										<td className='border border-border p-3'>
											Anonymous analytics tracking
										</td>
										<td className='border border-border p-3'>2 years</td>
										<td className='border border-border p-3'>Performance</td>
									</tr>
									<tr>
										<td className='border border-border p-3'>stripe_session</td>
										<td className='border border-border p-3'>
											Payment processing session
										</td>
										<td className='border border-border p-3'>Session</td>
										<td className='border border-border p-3'>Third-party</td>
									</tr>
								</tbody>
							</table>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							5. How Long Cookies Are Stored
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>Cookies are stored on your device for different periods:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Session Cookies:</strong> Deleted when you close your
									browser
								</li>
								<li>
									<strong>Temporary Cookies:</strong> Deleted after a few hours
									or days
								</li>
								<li>
									<strong>Persistent Cookies:</strong> Remain on your device
									until they expire or are deleted
								</li>
								<li>
									<strong>Third-Party Cookies:</strong> Duration controlled by
									the third-party service
								</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							6. Managing Your Cookie Preferences
						</h2>

						<h3 className='text-xl font-semibold text-foreground mb-3'>
							6.1 Browser Settings
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>You can control cookies through your browser settings:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Chrome:</strong> Settings → Privacy and security →
									Cookies and other site data
								</li>
								<li>
									<strong>Firefox:</strong> Options → Privacy & Security →
									Cookies and Site Data
								</li>
								<li>
									<strong>Safari:</strong> Preferences → Privacy → Manage
									Website Data
								</li>
								<li>
									<strong>Edge:</strong> Settings → Cookies and site permissions
									→ Cookies and site data
								</li>
							</ul>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							6.2 Platform Cookie Manager
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>We provide a cookie consent manager that allows you to:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>View all cookies used on our platform</li>
								<li>Enable or disable non-essential cookies</li>
								<li>Set preferences for different cookie categories</li>
								<li>Withdraw consent at any time</li>
							</ul>
							<p>
								You can access this manager through your account settings or by
								clicking the cookie icon in the footer.
							</p>
						</div>

						<h3 className='text-xl font-semibold text-foreground mb-3 mt-6'>
							6.3 Third-Party Opt-Outs
						</h3>
						<div className='space-y-4 text-foreground'>
							<p>For third-party cookies, you can opt out directly:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Analytics:</strong>{" "}
									<a
										href={legalConfig.analytics.optOutLink}
										target='_blank'
										rel='noopener noreferrer'
										className='text-primary hover:underline'>
										Google Analytics Opt-out
									</a>
								</li>
								<li>
									<strong>Advertising:</strong>{" "}
									<a
										href={legalConfig.analytics.advertisingOptOutLink}
										target='_blank'
										rel='noopener noreferrer'
										className='text-primary hover:underline'>
										European Cookie Opt-out
									</a>
								</li>
								<li>
									<strong>Social Media:</strong>{" "}
									<a
										href={legalConfig.analytics.socialMediaOptOutLink}
										target='_blank'
										rel='noopener noreferrer'
										className='text-primary hover:underline'>
										Facebook Ad Preferences
									</a>
								</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							7. Impact of Disabling Cookies
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>Disabling certain cookies may affect your experience:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<strong>Essential Cookies:</strong> Platform will not function
									properly
								</li>
								<li>
									<strong>Functional Cookies:</strong> Preferences will not be
									remembered
								</li>
								<li>
									<strong>Performance Cookies:</strong> We cannot optimize
									platform performance
								</li>
								<li>
									<strong>Analytics Cookies:</strong> Cannot provide usage
									insights and improvements
								</li>
							</ul>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							8. Updates to This Policy
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								We may update this Cookie Policy from time to time to reflect
								changes in our practices or applicable laws. We will notify you
								of any material changes by:
							</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									Updating the "Last updated" date at the top of this policy
								</li>
								<li>
									Sending an email notification to your registered email address
								</li>
								<li>Displaying a prominent notice on our platform</li>
							</ul>
							<p>
								Your continued use of our platform after such changes
								constitutes acceptance of the updated policy.
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							9. Contact Information
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>
								If you have any questions about our use of cookies, please
								contact us:
							</p>

							<div className='bg-muted/50 p-4 rounded-lg'>
								<p>
									<strong>{getFullCompanyName()}</strong>
								</p>
								<p>{getCompanyAddress()}</p>
								<p>Email: {legalConfig.company.email.privacy}</p>
								<p>Phone: {legalConfig.company.phone}</p>
							</div>

							<p className='text-sm text-muted-foreground mt-4'>
								<strong>Data Protection Officer:</strong>{" "}
								{legalConfig.company.email.dpo}
							</p>
						</div>
					</section>

					<section>
						<h2 className='text-2xl font-semibold text-foreground mb-4'>
							10. Additional Resources
						</h2>
						<div className='space-y-4 text-foreground'>
							<p>For more information about cookies and online privacy:</p>
							<ul className='list-disc pl-6 space-y-2'>
								<li>
									<a
										href='https://www.allaboutcookies.org'
										target='_blank'
										rel='noopener noreferrer'
										className='text-primary hover:underline'>
										All About Cookies
									</a>{" "}
									- Comprehensive guide to cookies
								</li>
								<li>
									<a
										href='https://www.youronlinechoices.com'
										target='_blank'
										rel='noopener noreferrer'
										className='text-primary hover:underline'>
										Your Online Choices
									</a>{" "}
									- European cookie opt-out
								</li>
								<li>
									<a
										href='https://www.networkadvertising.org'
										target='_blank'
										rel='noopener noreferrer'
										className='text-primary hover:underline'>
										Network Advertising Initiative
									</a>{" "}
									- US advertising opt-out
								</li>
							</ul>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
