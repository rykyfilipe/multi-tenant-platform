/** @format */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
	AlertTriangle, 
	XCircle, 
	Info, 
	RefreshCw, 
	ExternalLink,
	Copy,
	Check,
	ChevronDown,
	ChevronRight,
	Lightbulb,
	Wrench,
	BookOpen,
	MessageCircle,
	Mail
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { logger } from "@/lib/error-logger";

export interface EnhancedError {
	id: string;
	title: string;
	message: string;
	severity: "low" | "medium" | "high" | "critical";
	type: "validation" | "network" | "permission" | "system" | "business" | "unknown";
	code?: string;
	timestamp: string;
	context?: Record<string, unknown>;
	
	// Actionable solutions
	solutions: ErrorSolution[];
	
	// Additional help
	helpResources?: HelpResource[];
	
	// Recovery options
	recoveryOptions?: RecoveryOption[];
	
	// User actions
	userActions?: UserAction[];
}

export interface ErrorSolution {
	id: string;
	title: string;
	description: string;
	action?: {
		text: string;
		onClick?: () => void;
		href?: string;
		type?: "primary" | "secondary" | "destructive";
	};
	automated?: boolean;
	estimatedTime?: string;
}

export interface HelpResource {
	type: "article" | "video" | "documentation" | "support";
	title: string;
	description: string;
	url?: string;
	onClick?: () => void;
}

export interface RecoveryOption {
	id: string;
	title: string;
	description: string;
	action: () => void;
	risk: "low" | "medium" | "high";
}

export interface UserAction {
	id: string;
	title: string;
	description: string;
	action: () => void;
	requiresConfirmation?: boolean;
}

interface EnhancedErrorDisplayProps {
	error: EnhancedError;
	onDismiss?: () => void;
	onRetry?: () => void;
	onSolutionApplied?: (solutionId: string) => void;
	showDetails?: boolean;
	compact?: boolean;
}

/**
 * Enhanced Error Display Component
 * Shows detailed error information with actionable solutions
 */
export function EnhancedErrorDisplay({
	error,
	onDismiss,
	onRetry,
	onSolutionApplied,
	showDetails = false,
	compact = false
}: EnhancedErrorDisplayProps) {
	const { t } = useLanguage();
	const [isExpanded, setIsExpanded] = useState(showDetails);
	const [copiedCode, setCopiedCode] = useState(false);
	const [selectedSolution, setSelectedSolution] = useState<string | null>(null);

	const getSeverityIcon = () => {
		switch (error.severity) {
			case "critical":
				return <XCircle className="h-5 w-5 text-red-600" />;
			case "high":
				return <AlertTriangle className="h-5 w-5 text-orange-600" />;
			case "medium":
				return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
			case "low":
				return <Info className="h-5 w-5 text-blue-600" />;
			default:
				return <AlertTriangle className="h-5 w-5 text-gray-600" />;
		}
	};

	const getSeverityColor = () => {
		switch (error.severity) {
			case "critical":
				return "border-red-200 bg-red-50";
			case "high":
				return "border-orange-200 bg-orange-50";
			case "medium":
				return "border-yellow-200 bg-yellow-50";
			case "low":
				return "border-blue-200 bg-blue-50";
			default:
				return "border-gray-200 bg-gray-50";
		}
	};

	const getTypeColor = () => {
		switch (error.type) {
			case "validation":
				return "bg-blue-100 text-blue-800";
			case "network":
				return "bg-purple-100 text-purple-800";
			case "permission":
				return "bg-red-100 text-red-800";
			case "system":
				return "bg-gray-100 text-gray-800";
			case "business":
				return "bg-green-100 text-green-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const copyErrorCode = async () => {
		if (error.code) {
			try {
				await navigator.clipboard.writeText(error.code);
				setCopiedCode(true);
				setTimeout(() => setCopiedCode(false), 2000);
			} catch (err) {
				logger.error("Failed to copy error code", err as Error, {
					component: "EnhancedErrorDisplay",
				});
			}
		}
	};

	const applySolution = (solution: ErrorSolution) => {
		setSelectedSolution(solution.id);
		
		// Log solution application
		logger.info("Error solution applied", {
			component: "EnhancedErrorDisplay",
			errorId: error.id,
			solutionId: solution.id,
			solutionTitle: solution.title,
		});

		// Execute solution action
		if (solution.action?.onClick) {
			solution.action.onClick();
		}

		// Notify parent
		onSolutionApplied?.(solution.id);
	};

	if (compact) {
		return (
			<Alert className={`${getSeverityColor()} border-l-4`}>
				{getSeverityIcon()}
				<AlertDescription className="flex items-center justify-between">
					<div>
						<span className="font-medium">{error.title}</span>
						{error.code && (
							<Badge variant="outline" className="ml-2 text-xs">
								{error.code}
							</Badge>
						)}
					</div>
					<div className="flex items-center gap-2">
						{onRetry && (
							<Button variant="ghost" size="sm" onClick={onRetry}>
								<RefreshCw className="h-4 w-4" />
							</Button>
						)}
						{onDismiss && (
							<Button variant="ghost" size="sm" onClick={onDismiss}>
								<X className="h-4 w-4" />
							</Button>
						)}
					</div>
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<Card className={`${getSeverityColor()} border-l-4`}>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex items-start gap-3">
						{getSeverityIcon()}
						<div className="flex-1">
							<div className="flex items-center gap-2 mb-1">
								<CardTitle className="text-lg">{error.title}</CardTitle>
								<Badge className={getTypeColor()}>
									{error.type}
								</Badge>
								<Badge variant="outline">
									{error.severity}
								</Badge>
							</div>
							<CardDescription className="text-base">
								{error.message}
							</CardDescription>
						</div>
					</div>
					<div className="flex items-center gap-2">
						{error.code && (
							<Button
								variant="ghost"
								size="sm"
								onClick={copyErrorCode}
								className="text-xs"
							>
								{copiedCode ? (
									<Check className="h-3 w-3 text-green-600" />
								) : (
									<Copy className="h-3 w-3" />
								)}
								{error.code}
							</Button>
						)}
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsExpanded(!isExpanded)}
						>
							{isExpanded ? (
								<ChevronDown className="h-4 w-4" />
							) : (
								<ChevronRight className="h-4 w-4" />
							)}
						</Button>
					</div>
				</div>
			</CardHeader>

			{isExpanded && (
				<CardContent className="space-y-6">
					{/* Solutions */}
					{error.solutions.length > 0 && (
						<div>
							<h4 className="font-medium mb-3 flex items-center gap-2">
								<Lightbulb className="h-4 w-4" />
								Suggested Solutions
							</h4>
							<div className="space-y-3">
								{error.solutions.map((solution) => (
									<div
										key={solution.id}
										className={`p-4 border rounded-lg ${
											selectedSolution === solution.id
												? "border-green-200 bg-green-50"
												: "border-gray-200 bg-white"
										}`}
									>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<h5 className="font-medium mb-1">{solution.title}</h5>
												<p className="text-sm text-muted-foreground mb-2">
													{solution.description}
												</p>
												{solution.estimatedTime && (
													<Badge variant="outline" className="text-xs">
														{solution.estimatedTime}
													</Badge>
												)}
											</div>
											{solution.action && (
												<Button
													variant={solution.action.type || "outline"}
													size="sm"
													onClick={() => applySolution(solution)}
													disabled={selectedSolution === solution.id}
												>
													{solution.action.text}
												</Button>
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Recovery Options */}
					{error.recoveryOptions && error.recoveryOptions.length > 0 && (
						<div>
							<h4 className="font-medium mb-3 flex items-center gap-2">
								<Wrench className="h-4 w-4" />
								Recovery Options
							</h4>
							<div className="space-y-2">
								{error.recoveryOptions.map((option) => (
									<div key={option.id} className="flex items-center justify-between p-3 border rounded-lg">
										<div>
											<h5 className="font-medium">{option.title}</h5>
											<p className="text-sm text-muted-foreground">{option.description}</p>
										</div>
										<div className="flex items-center gap-2">
											<Badge
												variant={
													option.risk === "high" ? "destructive" :
													option.risk === "medium" ? "secondary" : "outline"
												}
											>
												{option.risk} risk
											</Badge>
											<Button
												variant="outline"
												size="sm"
												onClick={option.action}
											>
												Try
											</Button>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Help Resources */}
					{error.helpResources && error.helpResources.length > 0 && (
						<div>
							<h4 className="font-medium mb-3 flex items-center gap-2">
								<BookOpen className="h-4 w-4" />
								Help Resources
							</h4>
							<div className="grid gap-2 md:grid-cols-2">
								{error.helpResources.map((resource, index) => (
									<Button
										key={index}
										variant="outline"
										className="justify-start h-auto p-3"
										onClick={resource.onClick}
									>
										<div className="flex items-center gap-2">
											{resource.type === "article" && <BookOpen className="h-4 w-4" />}
											{resource.type === "video" && <ExternalLink className="h-4 w-4" />}
											{resource.type === "documentation" && <BookOpen className="h-4 w-4" />}
											{resource.type === "support" && <MessageCircle className="h-4 w-4" />}
											<div className="text-left">
												<div className="font-medium">{resource.title}</div>
												<div className="text-xs text-muted-foreground">
													{resource.description}
												</div>
											</div>
										</div>
									</Button>
								))}
							</div>
						</div>
					)}

					{/* Error Details */}
					{error.context && Object.keys(error.context).length > 0 && (
						<div>
							<h4 className="font-medium mb-3">Error Details</h4>
							<div className="bg-gray-50 p-3 rounded-lg">
								<pre className="text-xs text-gray-600 overflow-x-auto">
									{JSON.stringify(error.context, null, 2)}
								</pre>
							</div>
						</div>
					)}

					{/* Actions */}
					<div className="flex items-center justify-between pt-4 border-t">
						<div className="text-sm text-muted-foreground">
							Error occurred at {new Date(error.timestamp).toLocaleString()}
						</div>
						<div className="flex items-center gap-2">
							{onRetry && (
								<Button variant="outline" size="sm" onClick={onRetry}>
									<RefreshCw className="h-4 w-4 mr-2" />
									Retry
								</Button>
							)}
							<Button variant="outline" size="sm">
								<MessageCircle className="h-4 w-4 mr-2" />
								Report Issue
							</Button>
							{onDismiss && (
								<Button variant="ghost" size="sm" onClick={onDismiss}>
									Dismiss
								</Button>
							)}
						</div>
					</div>
				</CardContent>
			)}
		</Card>
	);
}

/**
 * Error Message Generator
 * Creates enhanced error objects with actionable solutions
 */
export class ErrorMessageGenerator {
	static createValidationError(field: string, message: string, solutions: ErrorSolution[] = []): EnhancedError {
		return {
			id: `validation-${Date.now()}`,
			title: "Validation Error",
			message: `${field}: ${message}`,
			severity: "medium",
			type: "validation",
			timestamp: new Date().toISOString(),
			solutions: solutions.length > 0 ? solutions : [
				{
					id: "check-input",
					title: "Check Your Input",
					description: "Please review the highlighted field and ensure it meets the requirements.",
					estimatedTime: "1 minute",
				},
				{
					id: "view-examples",
					title: "View Examples",
					description: "See examples of valid input formats for this field.",
					action: {
						text: "Show Examples",
						onClick: () => {
							// This would show examples
							logger.info("Validation examples requested", {
								component: "ErrorMessageGenerator",
								field,
							});
						},
					},
				},
			],
			helpResources: [
				{
					type: "documentation",
					title: "Field Requirements",
					description: "Learn about this field's requirements",
				},
			],
		};
	}

	static createNetworkError(message: string, solutions: ErrorSolution[] = []): EnhancedError {
		return {
			id: `network-${Date.now()}`,
			title: "Network Error",
			message,
			severity: "high",
			type: "network",
			timestamp: new Date().toISOString(),
			solutions: solutions.length > 0 ? solutions : [
				{
					id: "retry-request",
					title: "Retry Request",
					description: "The connection may be temporarily unavailable. Try again in a moment.",
					action: {
						text: "Retry Now",
						onClick: () => window.location.reload(),
					},
					estimatedTime: "30 seconds",
				},
				{
					id: "check-connection",
					title: "Check Your Connection",
					description: "Ensure you have a stable internet connection.",
					estimatedTime: "2 minutes",
				},
			],
			recoveryOptions: [
				{
					id: "refresh-page",
					title: "Refresh Page",
					description: "Reload the page to reset the connection",
					action: () => window.location.reload(),
					risk: "low",
				},
			],
		};
	}

	static createPermissionError(resource: string, solutions: ErrorSolution[] = []): EnhancedError {
		return {
			id: `permission-${Date.now()}`,
			title: "Access Denied",
			message: `You don't have permission to access ${resource}`,
			severity: "high",
			type: "permission",
			timestamp: new Date().toISOString(),
			solutions: solutions.length > 0 ? solutions : [
				{
					id: "request-access",
					title: "Request Access",
					description: "Contact your administrator to request access to this resource.",
					action: {
						text: "Request Access",
						onClick: () => {
							// This would open a request access form
							logger.info("Access request initiated", {
								component: "ErrorMessageGenerator",
								resource,
							});
						},
					},
				},
				{
					id: "check-permissions",
					title: "Check Your Permissions",
					description: "Verify your current role and permissions in the system.",
					action: {
						text: "View Permissions",
						href: "/home/settings/permissions",
					},
				},
			],
			helpResources: [
				{
					type: "article",
					title: "Understanding Permissions",
					description: "Learn about user roles and permissions",
				},
			],
		};
	}

	static createBusinessError(message: string, solutions: ErrorSolution[] = []): EnhancedError {
		return {
			id: `business-${Date.now()}`,
			title: "Business Rule Violation",
			message,
			severity: "medium",
			type: "business",
			timestamp: new Date().toISOString(),
			solutions: solutions.length > 0 ? solutions : [
				{
					id: "review-limits",
					title: "Review Your Limits",
					description: "Check your current plan limits and usage.",
					action: {
						text: "View Limits",
						href: "/home/settings/limits",
					},
				},
				{
					id: "upgrade-plan",
					title: "Upgrade Your Plan",
					description: "Consider upgrading to unlock more features and higher limits.",
					action: {
						text: "View Plans",
						href: "/pricing",
					},
				},
			],
		};
	}
}
