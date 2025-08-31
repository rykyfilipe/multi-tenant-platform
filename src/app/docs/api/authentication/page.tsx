/** @format */

"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Key,
	Shield,
	Code,
	Copy,
	Eye,
	EyeOff,
	CheckCircle,
	AlertTriangle,
	Info,
	Clock,
	ArrowRight,
	Settings,
} from "lucide-react";

const AuthenticationPage = () => {
	const { t } = useLanguage();
	const [showApiKey, setShowApiKey] = React.useState(false);

	const authMethods = [
		{
			method: "API Key Authentication",
			icon: <Key className='w-6 h-6' />,
			description: "Simple and secure authentication using API keys",
			security: "Medium",
			useCase: "Server-to-server communication",
			implementation: "Include API key in Authorization header",
			pros: [
				"Easy to implement",
				"No expiration management",
				"Perfect for backend services",
			],
			cons: ["Key rotation needed", "Less granular permissions"],
		},
		{
			method: "JWT Token Authentication",
			icon: <Shield className='w-6 h-6' />,
			description: "JSON Web Tokens for stateless authentication",
			security: "High",
			useCase: "Frontend applications and mobile apps",
			implementation: "Exchange credentials for JWT token",
			pros: ["Stateless", "Built-in expiration", "Supports user context"],
			cons: ["More complex setup", "Token refresh needed"],
		},
	];

	const codeExamples = {
		curl: `# Using API Key
curl -X GET "https://api.ydv.digital/tables" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"

# Using JWT Token
curl -X GET "https://api.ydv.digital/tables" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json"`,
		javascript: `// Using API Key
const response = await fetch('https://api.ydv.digital/tables', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

// Using JWT Token
const response = await fetch('https://api.ydv.digital/tables', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  }
});`,
		python: `import requests

# Using API Key
headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.ydv.digital/tables',
    headers=headers
)

# Using JWT Token
headers = {
    'Authorization': 'Bearer YOUR_JWT_TOKEN', 
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.ydv.digital/tables',
    headers=headers
)`,
		nodejs: `const axios = require('axios');

// Using API Key
const config = {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
};

const response = await axios.get(
  'https://api.ydv.digital/tables', 
  config
);

// JWT Authentication Flow
const loginResponse = await axios.post(
  'https://api.ydv.digital/auth/login',
  { email: 'user@example.com', password: 'password' }
);

const token = loginResponse.data.token;`,
	};

	const securityTips = [
		{
			title: "Keep API Keys Secure",
			description:
				"Never expose API keys in client-side code or public repositories",
			icon: <Shield className='w-5 h-5' />,
			level: "Critical",
		},
		{
			title: "Use Environment Variables",
			description:
				"Store API keys and secrets in environment variables, not in your code",
			icon: <Settings className='w-5 h-5' />,
			level: "Important",
		},
		{
			title: "Rotate Keys Regularly",
			description:
				"Rotate your API keys periodically and when team members leave",
			icon: <Key className='w-5 h-5' />,
			level: "Recommended",
		},
		{
			title: "Monitor API Usage",
			description:
				"Monitor your API usage patterns to detect suspicious activity",
			icon: <Eye className='w-5 h-5' />,
			level: "Best Practice",
		},
	];

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	return (
		<div className='max-w-6xl mx-auto p-6 space-y-8'>
			{/* Header */}
			<div className='space-y-4'>
				<div className='flex items-center space-x-2 text-sm text-muted-foreground'>
					<Link href='/docs' className='hover:text-foreground'>
						Documentation
					</Link>
					<span>/</span>
					<Link href='/docs/api' className='hover:text-foreground'>
						API Reference
					</Link>
					<span>/</span>
					<span className='text-foreground'>Authentication</span>
				</div>

				<div className='space-y-2'>
					<h1 className='text-3xl font-bold text-foreground'>
						API Authentication
					</h1>
					<p className='text-lg text-muted-foreground'>
						Learn how to authenticate your API requests using API keys or JWT
						tokens for secure access to your data.
					</p>
				</div>

				<div className='flex items-center space-x-4'>
					<Badge variant='secondary'>
						<Clock className='w-3 h-3 mr-1' />8 min read
					</Badge>
					<Badge variant='outline'>API</Badge>
					<Badge variant='outline'>Security</Badge>
					<Badge variant='outline'>Authentication</Badge>
				</div>
			</div>

			<Separator />

			{/* Authentication Methods */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Authentication Methods
					</h2>
					<p className='text-muted-foreground'>
						Choose the authentication method that best fits your application
						architecture and security requirements.
					</p>
				</div>

				<div className='space-y-6'>
					{authMethods.map((method, index) => (
						<Card key={index}>
							<CardHeader>
								<div className='flex items-start space-x-3'>
									<div className='p-2 bg-blue-500/10 text-blue-600 rounded-lg'>
										{method.icon}
									</div>
									<div className='space-y-1 flex-1'>
										<div className='flex items-center justify-between'>
											<CardTitle className='text-lg'>{method.method}</CardTitle>
											<Badge
												variant={
													method.security === "High" ? "default" : "secondary"
												}
												className='ml-2'>
												{method.security} Security
											</Badge>
										</div>
										<CardDescription>{method.description}</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
									<div>
										<h4 className='font-medium text-sm text-foreground mb-2'>
											Best For:
										</h4>
										<p className='text-sm text-muted-foreground'>
											{method.useCase}
										</p>
									</div>
									<div>
										<h4 className='font-medium text-sm text-foreground mb-2'>
											Implementation:
										</h4>
										<p className='text-sm text-muted-foreground'>
											{method.implementation}
										</p>
									</div>
									<div>
										<h4 className='font-medium text-sm text-foreground mb-2'>
											Pros & Cons:
										</h4>
										<div className='space-y-1'>
											{method.pros.slice(0, 2).map((pro, idx) => (
												<p
													key={idx}
													className='text-sm text-green-600 flex items-center'>
													<CheckCircle className='w-3 h-3 mr-1' />
													{pro}
												</p>
											))}
											{method.cons.slice(0, 1).map((con, idx) => (
												<p
													key={idx}
													className='text-sm text-amber-600 flex items-center'>
													<AlertTriangle className='w-3 h-3 mr-1' />
													{con}
												</p>
											))}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			<Separator />

			{/* Getting Your API Key */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Getting Your API Key
					</h2>
					<p className='text-muted-foreground'>
						Follow these steps to generate your API key for authentication.
					</p>
				</div>

				<Card>
					<CardContent className='p-6'>
						<div className='space-y-4'>
							<ol className='space-y-3'>
								<li className='flex items-start space-x-3'>
									<span className='inline-flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-medium'>
										1
									</span>
									<div>
										<p className='font-medium text-foreground'>
											Navigate to API Settings
										</p>
										<p className='text-sm text-muted-foreground'>
											Go to your dashboard and click on "Public API" in the
											navigation menu.
										</p>
									</div>
								</li>
								<li className='flex items-start space-x-3'>
									<span className='inline-flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-medium'>
										2
									</span>
									<div>
										<p className='font-medium text-foreground'>
											Create New Token
										</p>
										<p className='text-sm text-muted-foreground'>
											Click "Generate New Token" and provide a descriptive name
											for your API key.
										</p>
									</div>
								</li>
								<li className='flex items-start space-x-3'>
									<span className='inline-flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-medium'>
										3
									</span>
									<div>
										<p className='font-medium text-foreground'>
											Copy and Store Securely
										</p>
										<p className='text-sm text-muted-foreground'>
											Copy your API key immediately and store it in a secure
											location. You won't be able to see it again.
										</p>
									</div>
								</li>
								<li className='flex items-start space-x-3'>
									<span className='inline-flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-medium'>
										4
									</span>
									<div>
										<p className='font-medium text-foreground'>Test Your Key</p>
										<p className='text-sm text-muted-foreground'>
											Use the code examples below to test your API key with a
											simple request.
										</p>
									</div>
								</li>
							</ol>

							<div className='mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg'>
								<div className='flex items-start space-x-2'>
									<AlertTriangle className='w-5 h-5 text-amber-600 mt-0.5' />
									<div>
										<p className='font-medium text-amber-800 dark:text-amber-200'>
											Security Warning
										</p>
										<p className='text-sm text-amber-700 dark:text-amber-300'>
											API keys provide full access to your account. Keep them
											secure and never share them publicly.
										</p>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Separator />

			{/* Code Examples */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Code Examples
					</h2>
					<p className='text-muted-foreground'>
						Here are examples of how to authenticate your API requests in
						different programming languages.
					</p>
				</div>

				<div className='space-y-4'>
					{Object.entries(codeExamples).map(([language, code]) => (
						<Card key={language}>
							<CardHeader className='pb-3'>
								<div className='flex items-center justify-between'>
									<CardTitle className='text-lg capitalize'>
										{language === "nodejs" ? "Node.js" : language}
									</CardTitle>
									<Button
										variant='outline'
										size='sm'
										onClick={() => copyToClipboard(code)}
										className='flex items-center space-x-1'>
										<Copy className='w-4 h-4' />
										<span>Copy</span>
									</Button>
								</div>
							</CardHeader>
							<CardContent>
								<pre className='bg-muted p-4 rounded-lg overflow-x-auto text-sm'>
									<code>{code}</code>
								</pre>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			<Separator />

			{/* Security Best Practices */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Security Best Practices
					</h2>
					<p className='text-muted-foreground'>
						Follow these security guidelines to keep your API keys and data
						safe.
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					{securityTips.map((tip, index) => (
						<Card key={index}>
							<CardContent className='p-4'>
								<div className='flex items-start space-x-3'>
									<div className='p-2 bg-red-500/10 text-red-600 rounded-lg'>
										{tip.icon}
									</div>
									<div className='space-y-1'>
										<div className='flex items-center space-x-2'>
											<h3 className='font-medium text-foreground'>
												{tip.title}
											</h3>
											<Badge
												variant={
													tip.level === "Critical" ? "destructive" : "secondary"
												}
												className='text-xs'>
												{tip.level}
											</Badge>
										</div>
										<p className='text-sm text-muted-foreground'>
											{tip.description}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			<Separator />

			{/* Next Steps */}
			<div className='space-y-4'>
				<h2 className='text-2xl font-semibold text-foreground'>Next Steps</h2>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					<Link href='/docs/api'>
						<Card className='hover:shadow-md transition-shadow cursor-pointer'>
							<CardContent className='p-4'>
								<div className='flex items-center justify-between'>
									<div>
										<h3 className='font-medium text-foreground'>
											API Reference
										</h3>
										<p className='text-sm text-muted-foreground'>
											Explore all available API endpoints and operations
										</p>
									</div>
									<ArrowRight className='w-5 h-5 text-muted-foreground' />
								</div>
							</CardContent>
						</Card>
					</Link>

					<Link href='/docs/api/sdk-examples'>
						<Card className='hover:shadow-md transition-shadow cursor-pointer'>
							<CardContent className='p-4'>
								<div className='flex items-center justify-between'>
									<div>
										<h3 className='font-medium text-foreground'>
											SDK Examples
										</h3>
										<p className='text-sm text-muted-foreground'>
											Code examples and SDKs for popular languages
										</p>
									</div>
									<ArrowRight className='w-5 h-5 text-muted-foreground' />
								</div>
							</CardContent>
						</Card>
					</Link>
				</div>
			</div>
		</div>
	);
};

export default AuthenticationPage;
