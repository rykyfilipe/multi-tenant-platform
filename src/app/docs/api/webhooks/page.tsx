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
	Webhook,
	Settings,
	Code,
	Copy,
	CheckCircle,
	AlertTriangle,
	Info,
	Clock,
	ArrowRight,
	Shield,
	Zap,
	Database,
	Users,
} from "lucide-react";

const WebhooksPage = () => {
	const { t } = useLanguage();

	const webhookEvents = [
		{
			event: "table.row.created",
			description: "Triggered when a new row is added to any table",
			payload: "Row data with table information",
			useCase: "Real-time notifications, data synchronization",
			frequency: "High",
		},
		{
			event: "table.row.updated",
			description: "Triggered when an existing row is modified",
			payload: "Updated row data with previous and new values",
			useCase: "Change tracking, audit logs",
			frequency: "High",
		},
		{
			event: "table.row.deleted",
			description: "Triggered when a row is deleted from any table",
			payload: "Deleted row data and table information",
			useCase: "Cleanup operations, backup systems",
			frequency: "Medium",
		},
		{
			event: "table.created",
			description: "Triggered when a new table is created",
			payload: "Table schema and configuration",
			useCase: "Schema management, documentation updates",
			frequency: "Low",
		},
		{
			event: "user.invited",
			description: "Triggered when a new user is invited to the workspace",
			payload: "User information and permissions",
			useCase: "User onboarding, access management",
			frequency: "Low",
		},
		{
			event: "user.permissions.changed",
			description: "Triggered when user permissions are modified",
			payload: "User ID and new permission levels",
			useCase: "Security monitoring, compliance",
			frequency: "Low",
		},
	];

	const setupSteps = [
		{
			step: 1,
			title: "Configure Webhook URL",
			description: "Set up your endpoint to receive webhook payloads",
			details: [
				"Create an HTTPS endpoint in your application",
				"Ensure your endpoint can handle POST requests",
				"Return HTTP 200 status for successful processing",
				"Implement proper error handling",
			],
		},
		{
			step: 2,
			title: "Register Webhook",
			description: "Add your webhook URL in the dashboard settings",
			details: [
				"Go to Settings > Webhooks in your dashboard",
				"Click 'Add New Webhook'",
				"Enter your endpoint URL",
				"Select the events you want to receive",
			],
		},
		{
			step: 3,
			title: "Verify Webhook",
			description: "Test your webhook to ensure it's working correctly",
			details: [
				"Use the test button in webhook settings",
				"Check your endpoint logs for incoming requests",
				"Verify payload structure and content",
				"Test error scenarios and retries",
			],
		},
		{
			step: 4,
			title: "Handle Webhook Security",
			description: "Implement security measures for webhook verification",
			details: [
				"Verify webhook signatures using shared secret",
				"Validate request headers and origin",
				"Implement idempotency to handle duplicates",
				"Use HTTPS for all webhook communications",
			],
		},
	];

	const examplePayload = `{
  "event": "table.row.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "tenant_id": "tenant_123",
  "table": {
    "id": "table_456",
    "name": "customers",
    "database": "main_db"
  },
  "data": {
    "id": 789,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "previous_data": null,
  "user": {
    "id": "user_321",
    "email": "admin@company.com"
  }
}`;

	const webhookEndpoint = `const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());

// Webhook signature verification
function verifySignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

app.post('/webhook', (req, res) => {
  const payload = JSON.stringify(req.body);
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;

  // Verify webhook signature
  if (!verifySignature(payload, signature, secret)) {
    return res.status(401).send('Unauthorized');
  }

  // Process the webhook event
  const { event, data, table } = req.body;
  
  switch (event) {
    case 'table.row.created':
      console.log('New row created:', data);
      // Handle new row creation
      break;
      
    case 'table.row.updated':
      console.log('Row updated:', data);
      // Handle row update
      break;
      
    case 'table.row.deleted':
      console.log('Row deleted:', data);
      // Handle row deletion
      break;
      
    default:
      console.log('Unknown event:', event);
  }

  // Always respond with 200 to acknowledge receipt
  res.status(200).send('OK');
});

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});`;

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
					<span className='text-foreground'>Webhooks</span>
				</div>

				<div className='space-y-2'>
					<h1 className='text-3xl font-bold text-foreground'>
						Webhook Integration
					</h1>
					<p className='text-lg text-muted-foreground'>
						Configure webhooks to receive real-time notifications about data
						changes and events in your YDV platform.
					</p>
				</div>

				<div className='flex items-center space-x-4'>
					<Badge variant='secondary'>
						<Clock className='w-3 h-3 mr-1' />
						15 min read
					</Badge>
					<Badge variant='outline'>API</Badge>
					<Badge variant='outline'>Webhooks</Badge>
					<Badge variant='outline'>Real-time</Badge>
				</div>
			</div>

			<Separator />

			{/* What are Webhooks */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						What are Webhooks?
					</h2>
					<p className='text-muted-foreground'>
						Webhooks are HTTP callbacks that notify your application about
						events happening in your YDV platform in real-time.
					</p>
				</div>

				<Card>
					<CardContent className='p-6'>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
							<div className='text-center space-y-3'>
								<div className='p-3 bg-blue-500/10 text-blue-600 rounded-lg w-fit mx-auto'>
									<Zap className='w-8 h-8' />
								</div>
								<div>
									<h3 className='font-semibold text-foreground'>
										Real-time Updates
									</h3>
									<p className='text-sm text-muted-foreground'>
										Get notified immediately when data changes occur
									</p>
								</div>
							</div>
							<div className='text-center space-y-3'>
								<div className='p-3 bg-green-500/10 text-green-600 rounded-lg w-fit mx-auto'>
									<Database className='w-8 h-8' />
								</div>
								<div>
									<h3 className='font-semibold text-foreground'>
										Data Synchronization
									</h3>
									<p className='text-sm text-muted-foreground'>
										Keep external systems in sync with your data
									</p>
								</div>
							</div>
							<div className='text-center space-y-3'>
								<div className='p-3 bg-purple-500/10 text-purple-600 rounded-lg w-fit mx-auto'>
									<Shield className='w-8 h-8' />
								</div>
								<div>
									<h3 className='font-semibold text-foreground'>
										Secure Delivery
									</h3>
									<p className='text-sm text-muted-foreground'>
										Signed payloads ensure authentic and secure delivery
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Separator />

			{/* Available Events */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Available Webhook Events
					</h2>
					<p className='text-muted-foreground'>
						Subscribe to specific events to receive notifications only for the
						changes you care about.
					</p>
				</div>

				<div className='space-y-4'>
					{webhookEvents.map((event, index) => (
						<Card key={index}>
							<CardContent className='p-4'>
								<div className='space-y-3'>
									<div className='flex items-start justify-between'>
										<div className='space-y-1'>
											<div className='flex items-center space-x-2'>
												<code className='px-2 py-1 bg-muted rounded text-sm font-mono'>
													{event.event}
												</code>
												<Badge
													variant={
														event.frequency === "High"
															? "destructive"
															: event.frequency === "Medium"
															? "secondary"
															: "outline"
													}
													className='text-xs'>
													{event.frequency} Frequency
												</Badge>
											</div>
											<p className='text-sm text-muted-foreground'>
												{event.description}
											</p>
										</div>
									</div>
									<div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
										<div>
											<p className='font-medium text-foreground mb-1'>
												Payload Contains:
											</p>
											<p className='text-muted-foreground'>{event.payload}</p>
										</div>
										<div>
											<p className='font-medium text-foreground mb-1'>
												Common Use Cases:
											</p>
											<p className='text-muted-foreground'>{event.useCase}</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			<Separator />

			{/* Setup Guide */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Webhook Setup Guide
					</h2>
					<p className='text-muted-foreground'>
						Follow these steps to configure and test webhooks for your
						application.
					</p>
				</div>

				<div className='space-y-6'>
					{setupSteps.map((step, index) => (
						<Card key={index}>
							<CardHeader>
								<div className='flex items-start space-x-3'>
									<span className='inline-flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium'>
										{step.step}
									</span>
									<div className='space-y-1'>
										<CardTitle className='text-lg'>{step.title}</CardTitle>
										<CardDescription>{step.description}</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<ul className='space-y-2 ml-11'>
									{step.details.map((detail, idx) => (
										<li
											key={idx}
											className='flex items-start text-sm text-muted-foreground'>
											<CheckCircle className='w-4 h-4 mr-2 text-green-600 mt-0.5 flex-shrink-0' />
											{detail}
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			<Separator />

			{/* Example Payload */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Example Webhook Payload
					</h2>
					<p className='text-muted-foreground'>
						Here's what a typical webhook payload looks like when a new row is
						created.
					</p>
				</div>

				<Card>
					<CardHeader className='pb-3'>
						<div className='flex items-center justify-between'>
							<CardTitle className='text-lg'>table.row.created Event</CardTitle>
							<Button
								variant='outline'
								size='sm'
								onClick={() => copyToClipboard(examplePayload)}
								className='flex items-center space-x-1'>
								<Copy className='w-4 h-4' />
								<span>Copy</span>
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<pre className='bg-muted p-4 rounded-lg overflow-x-auto text-sm'>
							<code>{examplePayload}</code>
						</pre>
					</CardContent>
				</Card>
			</div>

			<Separator />

			{/* Implementation Example */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Implementation Example
					</h2>
					<p className='text-muted-foreground'>
						Here's a complete example of a webhook endpoint with signature
						verification and event handling.
					</p>
				</div>

				<Card>
					<CardHeader className='pb-3'>
						<div className='flex items-center justify-between'>
							<CardTitle className='text-lg'>
								Node.js Express Webhook Endpoint
							</CardTitle>
							<Button
								variant='outline'
								size='sm'
								onClick={() => copyToClipboard(webhookEndpoint)}
								className='flex items-center space-x-1'>
								<Copy className='w-4 h-4' />
								<span>Copy</span>
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<pre className='bg-muted p-4 rounded-lg overflow-x-auto text-sm'>
							<code>{webhookEndpoint}</code>
						</pre>
					</CardContent>
				</Card>
			</div>

			<Separator />

			{/* Security & Best Practices */}
			<div className='space-y-6'>
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold text-foreground'>
						Security & Best Practices
					</h2>
					<p className='text-muted-foreground'>
						Follow these guidelines to ensure secure and reliable webhook
						processing.
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					<Card>
						<CardContent className='p-4'>
							<div className='flex items-start space-x-3'>
								<Shield className='w-5 h-5 text-red-600 mt-0.5' />
								<div>
									<h3 className='font-medium text-foreground'>
										Verify Signatures
									</h3>
									<p className='text-sm text-muted-foreground'>
										Always verify webhook signatures using the shared secret to
										ensure authenticity.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-4'>
							<div className='flex items-start space-x-3'>
								<Zap className='w-5 h-5 text-blue-600 mt-0.5' />
								<div>
									<h3 className='font-medium text-foreground'>
										Handle Retries
									</h3>
									<p className='text-sm text-muted-foreground'>
										Implement idempotency to handle duplicate webhook deliveries
										gracefully.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-4'>
							<div className='flex items-start space-x-3'>
								<AlertTriangle className='w-5 h-5 text-amber-600 mt-0.5' />
								<div>
									<h3 className='font-medium text-foreground'>Use HTTPS</h3>
									<p className='text-sm text-muted-foreground'>
										Always use HTTPS endpoints to protect webhook payloads in
										transit.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-4'>
							<div className='flex items-start space-x-3'>
								<CheckCircle className='w-5 h-5 text-green-600 mt-0.5' />
								<div>
									<h3 className='font-medium text-foreground'>
										Quick Response
									</h3>
									<p className='text-sm text-muted-foreground'>
										Respond quickly (within 10 seconds) to avoid webhook
										timeouts and retries.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			<Separator />

			{/* Next Steps */}
			<div className='space-y-4'>
				<h2 className='text-2xl font-semibold text-foreground'>Next Steps</h2>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					<Link href='/docs/api/authentication'>
						<Card className='hover:shadow-md transition-shadow cursor-pointer'>
							<CardContent className='p-4'>
								<div className='flex items-center justify-between'>
									<div>
										<h3 className='font-medium text-foreground'>
											API Authentication
										</h3>
										<p className='text-sm text-muted-foreground'>
											Learn how to authenticate your API requests
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

export default WebhooksPage;
