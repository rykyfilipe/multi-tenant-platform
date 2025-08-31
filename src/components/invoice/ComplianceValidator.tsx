/**
 * Invoice Compliance Validator Component
 * Validates invoices for legal compliance across different countries
 *
 * @format
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	CheckCircle,
	XCircle,
	AlertTriangle,
	Info,
	Globe,
	Shield,
} from "lucide-react";
import {
	validateInvoiceCompliance,
	getCountryComplianceRequirements,
	type ComplianceValidationResult,
} from "@/lib/legal-compliance";

interface ComplianceValidatorProps {
	invoiceData: any;
	onValidationComplete?: (result: ComplianceValidationResult) => void;
}

export function ComplianceValidator({
	invoiceData,
	onValidationComplete,
}: ComplianceValidatorProps) {
	const [selectedCountry, setSelectedCountry] = useState<string>("EU");
	const [validationResult, setValidationResult] =
		useState<ComplianceValidationResult | null>(null);
	const [isValidating, setIsValidating] = useState(false);

	const countries = [
		{ code: "EU", name: "European Union", flag: "🇪🇺" },
		{ code: "ROMANIA", name: "Romania", flag: "🇷🇴" },
		{ code: "US", name: "United States", flag: "🇺🇸" },
		{ code: "UK", name: "United Kingdom", flag: "🇬🇧" },
		{ code: "CANADA", name: "Canada", flag: "🇨🇦" },
		{ code: "GENERIC", name: "Other Countries", flag: "🌍" },
	];

	useEffect(() => {
		if (invoiceData) {
			validateCompliance();
		}
	}, [invoiceData, selectedCountry]);

	const validateCompliance = async () => {
		if (!invoiceData) return;

		setIsValidating(true);

		try {
			// Transform invoice data to compliance format
			const complianceData = transformToComplianceFormat(invoiceData);

			// Validate compliance
			const result = validateInvoiceCompliance(complianceData, selectedCountry);
			setValidationResult(result);

			// Notify parent component
			if (onValidationComplete) {
				onValidationComplete(result);
			}
		} catch (error) {
			console.error("Compliance validation error:", error);
		} finally {
			setIsValidating(false);
		}
	};

	const transformToComplianceFormat = (data: any) => {
		// This function should transform your invoice data to the compliance format
		// You'll need to adapt this based on your actual data structure
		return {
			company: {
				name: data.company?.name || data.tenant?.name,
				taxId: data.company?.tax_id || data.tenant?.tax_id,
				registrationNumber:
					data.company?.registration_number || data.tenant?.registration_number,
				address: data.company?.address || data.tenant?.address,
				city: data.company?.city || data.tenant?.city,
				country: data.company?.country || data.tenant?.country || "RO",
				postalCode: data.company?.postal_code || data.tenant?.postal_code,
				iban: data.company?.iban || data.tenant?.iban,
				bic: data.company?.bic || data.tenant?.bic,
			},
			customer: {
				name: data.customer?.customer_name,
				taxId: data.customer?.customer_tax_id,
				registrationNumber: data.customer?.customer_registration_number,
				address: data.customer?.customer_address,
				city: data.customer?.customer_city,
				country: data.customer?.customer_country || "RO",
				postalCode: data.customer?.customer_postal_code,
			},
			invoice: {
				number: data.invoice?.invoice_number,
				series: data.invoice?.invoice_series,
				date: data.invoice?.date,
				dueDate: data.invoice?.due_date,
				status: data.invoice?.status,
				currency: data.items?.[0]?.currency || "RON",
			},
			items:
				data.items?.map((item: any) => ({
					name: item.product_name,
					price: item.price,
					quantity: item.quantity,
					taxRate: item.tax_rate,
					taxAmount: item.tax_amount,
					discountRate: item.discount_rate,
					discountAmount: item.discount_amount,
				})) || [],
		};
	};

	const getStatusIcon = (isCompliant: boolean) => {
		return isCompliant ? (
			<CheckCircle className='w-6 h-6 text-green-600' />
		) : (
			<XCircle className='w-6 h-6 text-red-600' />
		);
	};

	const getStatusBadge = (isCompliant: boolean) => {
		return isCompliant ? (
			<Badge
				variant='default'
				className='bg-green-100 text-green-800 border-green-200'>
				<CheckCircle className='w-4 h-4 mr-1' />
				Compliant
			</Badge>
		) : (
			<Badge variant='destructive'>
				<XCircle className='w-4 h-4 mr-1' />
				Non-Compliant
			</Badge>
		);
	};

	if (!invoiceData) {
		return (
			<Card>
				<CardContent className='text-center py-8'>
					<Globe className='w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50' />
					<p className='text-muted-foreground'>No invoice data to validate</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Shield className='w-5 h-5' />
					Legal Compliance Validator
				</CardTitle>
			</CardHeader>
			<CardContent className='space-y-4'>
				{/* Country Selection */}
				<div className='space-y-2'>
					<label className='text-sm font-medium'>
						Select Country for Compliance
					</label>
					<Select value={selectedCountry} onValueChange={setSelectedCountry}>
						<SelectTrigger>
							<SelectValue placeholder='Select country' />
						</SelectTrigger>
						<SelectContent>
							{countries.map((country) => (
								<SelectItem key={country.code} value={country.code}>
									<span className='mr-2'>{country.flag}</span>
									{country.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Validation Status */}
				{validationResult && (
					<div className='space-y-4'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-2'>
								{getStatusIcon(validationResult.isCompliant)}
								<span className='font-medium'>
									{validationResult.isCompliant ? "Compliant" : "Non-Compliant"}
								</span>
							</div>
							{getStatusBadge(validationResult.isCompliant)}
						</div>

						{/* Errors */}
						{validationResult.errors.length > 0 && (
							<Alert variant='destructive'>
								<XCircle className='h-4 w-4' />
								<AlertDescription>
									<strong>
										Critical Issues ({validationResult.errors.length}):
									</strong>
									<ul className='mt-2 list-disc list-inside space-y-1'>
										{validationResult.errors.map((error, index) => (
											<li key={index} className='text-sm'>
												{error}
											</li>
										))}
									</ul>
								</AlertDescription>
							</Alert>
						)}

						{/* Warnings */}
						{validationResult.warnings.length > 0 && (
							<Alert>
								<AlertTriangle className='h-4 w-4' />
								<AlertDescription>
									<strong>
										Warnings ({validationResult.warnings.length}):
									</strong>
									<ul className='mt-2 list-disc list-inside space-y-1'>
										{validationResult.warnings.map((warning, index) => (
											<li key={index} className='text-sm'>
												{warning}
											</li>
										))}
									</ul>
								</AlertDescription>
							</Alert>
						)}

						{/* Missing Fields */}
						{validationResult.missingFields.length > 0 && (
							<Alert>
								<Info className='h-4 w-4' />
								<AlertDescription>
									<strong>
										Missing Required Fields (
										{validationResult.missingFields.length}):
									</strong>
									<ul className='mt-2 list-disc list-inside space-y-1'>
										{validationResult.missingFields.map((field, index) => (
											<li key={index} className='text-sm'>
												{field}
											</li>
										))}
									</ul>
								</AlertDescription>
							</Alert>
						)}

						{/* Recommendations */}
						{validationResult.recommendations.length > 0 && (
							<Alert>
								<Info className='h-4 w-4' />
								<AlertDescription>
									<strong>
										Recommendations ({validationResult.recommendations.length}):
									</strong>
									<ul className='mt-2 list-disc list-inside space-y-1'>
										{validationResult.recommendations.map((rec, index) => (
											<li key={index} className='text-sm'>
												{rec}
											</li>
										))}
									</ul>
								</AlertDescription>
							</Alert>
						)}
					</div>
				)}

				{/* Country Requirements */}
				<div className='pt-4 border-t'>
					<h4 className='font-medium mb-2'>
						Requirements for{" "}
						{countries.find((c) => c.code === selectedCountry)?.name}
					</h4>
					<ul className='text-sm text-muted-foreground space-y-1'>
						{getCountryComplianceRequirements(selectedCountry).map(
							(requirement, index) => (
								<li key={index} className='flex items-start gap-2'>
									<span className='text-blue-600'>•</span>
									{requirement}
								</li>
							),
						)}
					</ul>
				</div>

				{/* Validation Button */}
				<Button
					onClick={validateCompliance}
					disabled={isValidating}
					className='w-full'>
					{isValidating ? "Validating..." : "Re-validate Compliance"}
				</Button>
			</CardContent>
		</Card>
	);
}
