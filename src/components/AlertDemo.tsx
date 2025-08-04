/** @format */
"use client";

import { useApp } from "@/contexts/AppContext";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

export default function AlertDemo() {
	const { showAlert } = useApp();

	const demoAlerts = [
		{
			type: "success" as const,
			title: "Success Alert",
			description: "Perfect for confirming successful actions",
			message:
				"Operation completed successfully! Your changes have been saved.",
			buttonText: "Show Success",
		},
		{
			type: "error" as const,
			title: "Error Alert",
			description: "For displaying error messages and failures",
			message: "Something went wrong. Please try again or contact support.",
			buttonText: "Show Error",
		},
		{
			type: "warning" as const,
			title: "Warning Alert",
			description: "For important warnings and cautions",
			message:
				"This action cannot be undone. Are you sure you want to continue?",
			buttonText: "Show Warning",
		},
		{
			type: "info" as const,
			title: "Info Alert",
			description: "For informational messages and updates",
			message: "Your data is being processed. This may take a few moments.",
			buttonText: "Show Info",
		},
	];

	return (
		<div className='p-6 max-w-4xl mx-auto'>
			<div className='mb-8'>
				<h1 className='text-2xl font-bold text-foreground mb-2'>
					Modern Alert System Demo
				</h1>
				<p className='text-muted-foreground'>
					Click the buttons below to see different types of modern alerts with
					animations and progress bars.
				</p>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				{demoAlerts.map((alert) => (
					<Card
						key={alert.type}
						className='border border-border/20 bg-card/50 backdrop-blur-sm'>
						<CardHeader>
							<CardTitle className='text-lg'>{alert.title}</CardTitle>
							<CardDescription>{alert.description}</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='p-3 bg-muted/30 rounded-lg'>
								<p className='text-sm text-muted-foreground'>
									"{alert.message}"
								</p>
							</div>
							<Button
								onClick={() => showAlert(alert.message, alert.type)}
								className='w-full'
								variant={alert.type === "error" ? "destructive" : "default"}>
								{alert.buttonText}
							</Button>
						</CardContent>
					</Card>
				))}
			</div>

			<div className='mt-8 p-6 bg-muted/30 rounded-lg'>
				<h2 className='text-lg font-semibold text-foreground mb-3'>
					Features of the Modern Alert System
				</h2>
				<ul className='space-y-2 text-sm text-muted-foreground'>
					<li>
						• <strong>Smooth Animations:</strong> Slide-in and fade effects for
						professional appearance
					</li>
					<li>
						• <strong>Progress Bar:</strong> Visual countdown showing when the
						alert will auto-dismiss
					</li>
					<li>
						• <strong>Contextual Icons:</strong> Different icons for each alert
						type (success, error, warning, info)
					</li>
					<li>
						• <strong>Color-coded:</strong> Distinct colors for each alert type
						for quick recognition
					</li>
					<li>
						• <strong>Manual Dismiss:</strong> Click the X button to close
						alerts early
					</li>
					<li>
						• <strong>Auto-dismiss:</strong> Alerts automatically disappear
						after 5 seconds
					</li>
					<li>
						• <strong>Responsive:</strong> Works perfectly on all screen sizes
					</li>
					<li>
						• <strong>Accessible:</strong> Proper ARIA labels and keyboard
						navigation
					</li>
				</ul>
			</div>
		</div>
	);
}
