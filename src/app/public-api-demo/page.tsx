/** @format */

"use client";

import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Key, Globe } from "lucide-react";
import PublicApiConsumer from "@/components/PublicApiConsumer";

export default function PublicApiDemoPage() {
	const [apiToken, setApiToken] = useState("");
	const [baseUrl, setBaseUrl] = useState("");
	const [isConfigured, setIsConfigured] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleConfigure = async () => {
		if (!apiToken.trim()) {
			alert("Please enter an API token");
			return;
		}

		setLoading(true);

		// Test the API token by making a simple request
		try {
			const response = await fetch(`${baseUrl || ""}/api/public/tables`, {
				headers: {
					Authorization: `Bearer ${apiToken}`,
					"Content-Type": "application/json",
				},
			});

			if (response.ok) {
				setIsConfigured(true);
			} else {
				const error = await response.json();
				alert(`API Error: ${error.error || "Invalid token or configuration"}`);
			}
		} catch (err) {
			alert("Failed to connect to API. Please check your configuration.");
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const resetConfiguration = () => {
		setIsConfigured(false);
		setApiToken("");
		setBaseUrl("");
	};

	if (isConfigured) {
		return (
			<div className='container mx-auto py-8 space-y-6'>
				<div className='flex items-center justify-between'>
					<div>
						<h1 className='text-3xl font-bold'>Public API Consumer</h1>
						<p className='text-muted-foreground'>
							Interact with your public tables through the API
						</p>
					</div>
					<Button variant='outline' onClick={resetConfiguration}>
						Change Configuration
					</Button>
				</div>

				<PublicApiConsumer apiToken={apiToken} baseUrl={baseUrl} />
			</div>
		);
	}

	return (
		<div className='container mx-auto py-8 max-w-2xl'>
			<div className='text-center mb-8'>
				<h1 className='text-3xl font-bold mb-2'>Public API Consumer Demo</h1>
				<p className='text-muted-foreground'>
					Configure your API credentials to start consuming public table data
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Key className='h-5 w-5' />
						API Configuration
					</CardTitle>
					<CardDescription>
						Enter your API token and base URL to connect to your multi-tenant
						platform
					</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div>
						<Label htmlFor='baseUrl'>Base URL (Optional)</Label>
						<div className='flex items-center gap-2 mt-1'>
							<Globe className='h-4 w-4 text-muted-foreground' />
							<Input
								id='baseUrl'
								placeholder='https://your-domain.com (leave empty for current domain)'
								value={baseUrl}
								onChange={(e) => setBaseUrl(e.target.value)}
							/>
						</div>
						<p className='text-xs text-muted-foreground mt-1'>
							If left empty, the component will use the current domain
						</p>
					</div>

					<div>
						<Label htmlFor='apiToken'>API Token *</Label>
						<Input
							id='apiToken'
							type='password'
							placeholder='Enter your JWT API token'
							value={apiToken}
							onChange={(e) => setApiToken(e.target.value)}
							className='mt-1'
						/>
						<p className='text-xs text-muted-foreground mt-1'>
							This should be a valid JWT token with access to public tables
						</p>
					</div>

					<Button
						onClick={handleConfigure}
						disabled={!apiToken.trim() || loading}
						className='w-full'>
						{loading ? (
							<>
								<Loader2 className='h-4 w-4 animate-spin mr-2' />
								Testing Connection...
							</>
						) : (
							"Connect to API"
						)}
					</Button>
				</CardContent>
			</Card>

			<Card className='mt-6'>
				<CardHeader>
					<CardTitle>How to Use</CardTitle>
					<CardDescription>
						Follow these steps to get your API token and start using this
						component
					</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='space-y-2'>
						<h4 className='font-semibold'>1. Generate API Token</h4>
						<p className='text-sm text-muted-foreground'>
							Go to your platform's Public API section and generate a new JWT
							token
						</p>
					</div>

					<div className='space-y-2'>
						<h4 className='font-semibold'>2. Configure Component</h4>
						<p className='text-sm text-muted-foreground'>
							Enter your API token above. Optionally specify a base URL if
							different from current domain
						</p>
					</div>

					<div className='space-y-2'>
						<h4 className='font-semibold'>3. Start Consuming Data</h4>
						<p className='text-sm text-muted-foreground'>
							Once connected, you'll see all available public tables and can
							interact with their data
						</p>
					</div>
				</CardContent>
			</Card>

			<Alert className='mt-6'>
				<AlertDescription>
					<strong>Note:</strong> This component requires a valid JWT token with
					access to public tables. Make sure your token has the necessary
					permissions and hasn't expired.
				</AlertDescription>
			</Alert>
		</div>
	);
}
