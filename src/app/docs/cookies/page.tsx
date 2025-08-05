/** @format */

import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Cookie Policy - YDV",
	description: "Cookie policy for YDV services",
};

export default function CookiesPage() {
	return (
		<div className="prose prose-gray max-w-none">
			<h1 className="text-3xl font-bold text-foreground mb-6">
				Cookie Policy
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
				This Cookie Policy explains how YDV uses cookies and similar technologies.
			</p>

			<div className="space-y-8">
				<section>
					<h2 className="text-2xl font-semibold text-foreground mb-4">1. What Are Cookies?</h2>
					<p className="text-muted-foreground">
						Cookies are small text files stored on your device to improve user experience.
					</p>
				</section>

				<section>
					<h2 className="text-2xl font-semibold text-foreground mb-4">2. Types of Cookies We Use</h2>
					<ul className="list-disc list-inside text-muted-foreground space-y-2">
						<li><strong>Essential Cookies:</strong> Required for authentication and security.</li>
						<li><strong>Analytics Cookies:</strong> To understand user behavior (Google Analytics).</li>
						<li><strong>Preference Cookies:</strong> To remember your settings.</li>
					</ul>
				</section>

				<section>
					<h2 className="text-2xl font-semibold text-foreground mb-4">3. Managing Cookies</h2>
					<p className="text-muted-foreground">
						You can accept or reject cookies through our <strong>cookie banner</strong> or in your
						browser settings.
					</p>
				</section>

				<section>
					<h2 className="text-2xl font-semibold text-foreground mb-4">4. Third-Party Cookies</h2>
					<p className="text-muted-foreground">
						Some cookies may come from third-party services like <strong>Google Analytics</strong>.
					</p>
				</section>

				<section>
					<h2 className="text-2xl font-semibold text-foreground mb-4">5. Contact</h2>
					<p className="text-muted-foreground">
						For questions, email us at: <a href="mailto:privacy@ydv.digital" className="text-primary hover:underline">privacy@ydv.digital</a>
					</p>
				</section>
			</div>
		</div>
	);
} 