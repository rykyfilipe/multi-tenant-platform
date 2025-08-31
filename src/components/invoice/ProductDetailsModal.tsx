/** @format */

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Package,
	Eye,
	DollarSign,
	Hash,
	Tag,
	Building,
	FileText,
	Calendar,
	User,
	Database,
} from "lucide-react";

interface ProductDetailsModalProps {
	productName: string;
	productDetails: any;
	tableName: string;
	productId: number;
	children: React.ReactNode;
}

export function ProductDetailsModal({
	productName,
	productDetails,
	tableName,
	productId,
	children,
}: ProductDetailsModalProps) {
	// Filter out null/undefined values and format the data
	const formatFieldValue = (value: any): string => {
		if (value === null || value === undefined || value === "") {
			return "";
		}

		if (typeof value === "boolean") {
			return value ? "Yes" : "No";
		}

		if (typeof value === "object") {
			return JSON.stringify(value);
		}

		return String(value);
	};

	const getFieldIcon = (fieldName: string) => {
		const name = fieldName.toLowerCase();
		if (
			name.includes("price") ||
			name.includes("cost") ||
			name.includes("amount")
		) {
			return <DollarSign className='w-4 h-4' />;
		}
		if (name.includes("sku") || name.includes("code") || name.includes("id")) {
			return <Hash className='w-4 h-4' />;
		}
		if (
			name.includes("category") ||
			name.includes("type") ||
			name.includes("group")
		) {
			return <Tag className='w-4 h-4' />;
		}
		if (
			name.includes("brand") ||
			name.includes("manufacturer") ||
			name.includes("company")
		) {
			return <Building className='w-4 h-4' />;
		}
		if (
			name.includes("description") ||
			name.includes("details") ||
			name.includes("info")
		) {
			return <FileText className='w-4 h-4' />;
		}
		if (name.includes("date") || name.includes("time")) {
			return <Calendar className='w-4 h-4' />;
		}
		if (
			name.includes("user") ||
			name.includes("created") ||
			name.includes("updated")
		) {
			return <User className='w-4 h-4' />;
		}
		return <Database className='w-4 h-4' />;
	};

	const getFieldColor = (fieldName: string) => {
		const name = fieldName.toLowerCase();
		if (
			name.includes("price") ||
			name.includes("cost") ||
			name.includes("amount")
		) {
			return "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800";
		}
		if (name.includes("sku") || name.includes("code") || name.includes("id")) {
			return "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800";
		}
		if (
			name.includes("category") ||
			name.includes("type") ||
			name.includes("group")
		) {
			return "bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800";
		}
		if (
			name.includes("brand") ||
			name.includes("manufacturer") ||
			name.includes("company")
		) {
			return "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800";
		}
		return "bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800";
	};

	// Get all available fields from the product's cells
	const allFields = productDetails?.cells || [];
	const nonNullFields = allFields.filter((cell: any) => {
		const value = formatFieldValue(cell.value);
		return value !== "";
	});

	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className='max-w-4xl max-h-[90vh] overflow-hidden'>
				<DialogHeader className='border-b pb-4'>
					<DialogTitle className='flex items-center gap-3 text-xl'>
						<div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center'>
							<Package className='w-5 h-5 text-white' />
						</div>
						<div>
							<div className='text-xl font-bold'>
								{productDetails?.name || productName || `Product #${productId}`}
							</div>
							<div className='text-sm text-muted-foreground font-normal'>
								From table: {tableName} • ID: {productId}
							</div>
						</div>
					</DialogTitle>
				</DialogHeader>

				<div className='overflow-y-auto pr-2'>
					{nonNullFields.length > 0 ? (
						<div className='space-y-6'>
							{/* Key Product Info */}
							{(productDetails?.name ||
								productDetails?.description ||
								productDetails?.price) && (
								<Card className='border-0 shadow-sm bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20'>
									<CardHeader className='pb-3'>
										<CardTitle className='text-lg flex items-center gap-2'>
											<Package className='w-5 h-5 text-primary' />
											Key Information
										</CardTitle>
									</CardHeader>
									<CardContent className='space-y-3'>
										{productDetails?.name && (
											<div className='flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg'>
												<FileText className='w-4 h-4 text-blue-600' />
												<div>
													<p className='text-sm font-medium text-muted-foreground'>
														Product Name
													</p>
													<p className='font-semibold'>{productDetails.name}</p>
												</div>
											</div>
										)}
										{productDetails?.description && (
											<div className='flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg'>
												<FileText className='w-4 h-4 text-blue-600 mt-1' />
												<div className='flex-1'>
													<p className='text-sm font-medium text-muted-foreground'>
														Description
													</p>
													<p className='text-sm leading-relaxed'>
														{productDetails.description}
													</p>
												</div>
											</div>
										)}
										{productDetails?.price && productDetails?.currency && (
											<div className='flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg'>
												<DollarSign className='w-4 h-4 text-green-600' />
												<div>
													<p className='text-sm font-medium text-muted-foreground'>
														Price
													</p>
													<p className='font-bold text-lg text-green-600 dark:text-green-400'>
														{productDetails.price} {productDetails.currency}
													</p>
												</div>
											</div>
										)}
										{productDetails?.vat !== undefined &&
											productDetails?.vat !== null && (
												<div className='flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg'>
													<DollarSign className='w-4 h-4 text-orange-600' />
													<div>
														<p className='text-sm font-medium text-muted-foreground'>
															VAT Rate
														</p>
														<p className='font-bold text-lg text-orange-600 dark:text-orange-400'>
															{productDetails.vat}%
														</p>
													</div>
												</div>
											)}
									</CardContent>
								</Card>
							)}

							{/* Additional Details */}
							<Card className='border-0 shadow-sm'>
								<CardHeader className='pb-3'>
									<CardTitle className='text-lg flex items-center gap-2'>
										<Database className='w-5 h-5 text-primary' />
										All Product Details
										<Badge variant='secondary' className='ml-2'>
											{nonNullFields.length} fields
										</Badge>
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
										{nonNullFields.map((cell: any, index: number) => {
											const fieldValue = formatFieldValue(cell.value);
											const fieldName = cell.column.name;
											const fieldType = cell.column.type;
											const semanticType = cell.column.semanticType;

											return (
												<div
													key={index}
													className={`p-4 rounded-lg border ${getFieldColor(
														fieldName,
													)}`}>
													<div className='flex items-start gap-3'>
														<div className='flex-shrink-0 mt-0.5'>
															{getFieldIcon(fieldName)}
														</div>
														<div className='flex-1 min-w-0'>
															<div className='flex items-center gap-2 mb-1'>
																<p className='font-medium text-sm capitalize'>
																	{fieldName.replace(/_/g, " ")}
																</p>
																{semanticType && (
																	<Badge variant='outline' className='text-xs'>
																		{semanticType}
																	</Badge>
																)}
															</div>
															<p className='text-sm text-muted-foreground mb-2'>
																Type: {fieldType.toLowerCase()}
															</p>
															<div className='break-words'>
																{fieldValue.length > 100 ? (
																	<details className='cursor-pointer'>
																		<summary className='text-sm font-medium hover:text-primary'>
																			{fieldValue.substring(0, 100)}...
																		</summary>
																		<p className='mt-2 text-sm whitespace-pre-wrap'>
																			{fieldValue}
																		</p>
																	</details>
																) : (
																	<p className='text-sm font-medium whitespace-pre-wrap'>
																		{fieldValue}
																	</p>
																)}
															</div>
														</div>
													</div>
												</div>
											);
										})}
									</div>
								</CardContent>
							</Card>
						</div>
					) : (
						<div className='text-center py-12'>
							<Package className='w-16 h-16 text-muted-foreground/50 mx-auto mb-4' />
							<h3 className='text-lg font-semibold text-muted-foreground mb-2'>
								No product details available
							</h3>
							<p className='text-sm text-muted-foreground'>
								This product has no additional information or all fields are
								empty.
							</p>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
