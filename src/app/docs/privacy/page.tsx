/** @format */

import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Privacy Policy - YDV",
	description: "Privacy policy for YDV services",
};

export default function PrivacyPage() {
	return (
		<div className="prose prose-gray max-w-none">
			<h1 className="text-3xl font-bold text-foreground mb-6">
				Privacy Policy
			</h1>
			
			<div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg">
				<p className="text-sm text-blue-800 mb-2">
					<strong>Effective Date:</strong> August 5, 2025
				</p>
				<p className="text-sm text-blue-800">
					<strong>Website:</strong> <a href="https://ydv.digital" className="text-blue-600 hover:underline">ydv.digital</a>
				</p>
			</div>

			<p className="text-lg text-muted-foreground mb-8">
				Your privacy is important to us. This Privacy Policy explains how YDV collects,
				uses, and protects your personal data in compliance with <strong>GDPR</strong> and other
				applicable laws.
			</p>

			<div className="space-y-8">
				<section>
					<h2 className="text-2xl font-semibold text-foreground mb-4">1. Data We Collect</h2>
					<ul className="list-disc list-inside text-muted-foreground space-y-2">
						<li><strong>Account Data:</strong> Name, email, password (hashed)</li>
						<li><strong>Optional Data:</strong> Billing address, company name</li>
						<li><strong>Login Data:</strong> Google OAuth if you choose to sign in with Google</li>
						<li><strong>Usage Data:</strong> IP address, device info, cookies</li>
					</ul>
				</section>

				<section>
					<h2 className="text-2xl font-semibold text-foreground mb-4">2. How We Use Your Data</h2>
					<ul className="list-disc list-inside text-muted-foreground space-y-2">
						<li>To provide and improve our Services</li>
						<li>To process payments (via Stripe)</li>
						<li>To communicate with you about updates and promotions</li>
						<li>To comply with legal obligations</li>
					</ul>
				</section>

				<section>
					<h2 className="text-2xl font-semibold text-foreground mb-4">3. Data Sharing</h2>
					<p className="text-muted-foreground mb-3">
						We do <strong>not</strong> sell your data. We may share it with:
					</p>
					<ul className="list-disc list-inside text-muted-foreground space-y-2">
						<li><strong>Payment processors:</strong> Stripe</li>
						<li><strong>Analytics providers:</strong> Google Analytics</li>
						<li><strong>Legal authorities:</strong> when required by law</li>
					</ul>
				</section>

				<section>
					<h2 className="text-2xl font-semibold text-foreground mb-4">4. Cookies</h2>
					<p className="text-muted-foreground">
						We use cookies for authentication and analytics. For more details, see our
						<a href="/docs/cookies" className="text-primary hover:underline ml-1">Cookie Policy</a>.
					</p>
				</section>

				<section>
					<h2 className="text-2xl font-semibold text-foreground mb-4">5. Your GDPR Rights</h2>
					<p className="text-muted-foreground mb-3">You have the right to:</p>
					<ul className="list-disc list-inside text-muted-foreground space-y-2">
						<li>Access, correct, or delete your data</li>
						<li>Withdraw consent at any time</li>
						<li>Request data portability</li>
						<li>File a complaint with a supervisory authority</li>
					</ul>
					<p className="text-muted-foreground mt-4">
						To exercise your rights, contact us at: <a href="mailto:privacy@ydv.digital" className="text-primary hover:underline">privacy@ydv.digital</a>
					</p>
				</section>

				<section>
					<h2 className="text-2xl font-semibold text-foreground mb-4">6. Data Security</h2>
					<p className="text-muted-foreground">
						We use encryption, secure servers, and best practices to protect your
						information.
					</p>
				</section>

				<section>
					<h2 className="text-2xl font-semibold text-foreground mb-4">7. Data Retention</h2>
					<p className="text-muted-foreground">
						We keep your data as long as your account is active or as required by law.
					</p>
				</section>

				<section>
					<h2 className="text-2xl font-semibold text-foreground mb-4">8. Changes to This Policy</h2>
					<p className="text-muted-foreground">
						We may update this Privacy Policy. The latest version will always be available
						on our website.
					</p>
				</section>

				<section>
					<h2 className="text-2xl font-semibold text-foreground mb-4">9. Contact</h2>
					<p className="text-muted-foreground">
						For privacy concerns, email us at: <a href="mailto:privacy@ydv.digital" className="text-primary hover:underline">privacy@ydv.digital</a>
					</p>
				</section>
			</div>
		</div>
	);
} 