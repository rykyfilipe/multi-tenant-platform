/** @format */

"use client";

import React, { useEffect, useState } from "react";
import {
	Copy,
	Eye,
	EyeOff,
	Plus,
	Shield,
	Trash2,
	Calendar,
	Clock,
	CheckCircle,
	Info,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import RevokeTokenButton from "@/components/doc/RemoveTokenButton";
import { Button } from "@/components/ui/button";

type ApiToken = {
	id: string;
	name: string;
	tokenHash: string;
	scopes: string[];
	expiresAt: string | null;
	createdAt: string;
	revoked: boolean;
	lastUsed?: string | null;
};

type CreateTokenRequest = {
	name: string;
	expiresIn?: number; // days
	scopes?: string[];
};

const ApiTokensPage = () => {
	const [tokens, setTokens] = useState<ApiToken[]>([]);
	const [loading, setLoading] = useState(false);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newTokenData, setNewTokenData] = useState<{
		token: string;
		name: string;
	} | null>(null);
	const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());

	const { token, showAlert } = useApp();

	// Fetch user tokens
	const fetchTokens = async () => {
		if (!token) return;
		setLoading(true);
		try {
			const res = await fetch("/api/public/tokens", {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) throw new Error("Failed to fetch tokens");
			const data = await res.json();
			setTokens(data);
		} catch (err: any) {
			showAlert(err.message || "Unknown error", "error");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTokens();
	}, [token]);

	// Generate new token
	const createToken = async (tokenData: CreateTokenRequest) => {
		setLoading(true);
		try {
			const res = await fetch("/api/public/tokens", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(tokenData),
			});
			if (!res.ok) throw new Error("Failed to generate token");
			const result = await res.json();
			console.log(result);
			setTokens((prev) => [...prev, result]);
			setNewTokenData({ token: result.tokenHash, name: tokenData.name });
			setShowCreateModal(false);
		} catch (err: any) {
			showAlert(err.message || "Unknown error", "error");
		} finally {
			setLoading(false);
		}
	};

	// Revoke token
	const revokeToken = async (tokenId: string) => {
		try {
			const res = await fetch(`/api/public/tokens/${tokenId}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) throw new Error("Failed to revoke token");
			setTokens((prev) =>
				prev.map((t) => (t.id === tokenId ? { ...t, revoked: true } : t)),
			);
		} catch (err: any) {
			showAlert(err.message || "Unknown error");
		}
	};

	const toggleTokenVisibility = (tokenId: string) => {
		setVisibleTokens((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(tokenId)) {
				newSet.delete(tokenId);
			} else {
				newSet.add(tokenId);
			}
			return newSet;
		});
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getTokenStatus = (token: ApiToken) => {
		if (token.revoked)
			return { status: "revoked", color: "text-red-600", bg: "bg-red-50" };
		if (token.expiresAt && new Date(token.expiresAt) < new Date())
			return {
				status: "expired",
				color: "text-orange-600",
				bg: "bg-orange-50",
			};
		return { status: "active", color: "text-green-600", bg: "bg-green-50" };
	};

	return (
		<div className='min-h-screen bg-gray-50 p-6 '>
			<div className='max-w-7xl mx-auto'>
				{/* Header */}
				<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
					<div className='max-w-full flex flex-col sm:flex-row gap-5  items-center justify-between py-8 px-6  bg-black/5 rounded-2xl mb-8 border'>
						<div>
							<h1 className='max-w-[90%] text-3xl font-bold text-gray-900 flex items-center gap-3'>
								<Shield className='w-8 h-8 text-blue-600' />
								API Token Management
							</h1>
							<p className='text-gray-600 mt-2 max-w-[90%] ml-2'>
								Manage your API tokens for secure access to public endpoints
							</p>
						</div>
						<Button
							onClick={() => setShowCreateModal(true)}
							disabled={loading}
							className='bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200'>
							<Plus className='w-5 h-5' />
							Create New Token
						</Button>
					</div>
				</div>

				{/* New Token Alert */}
				{newTokenData && (
					<div className='bg-green-50 border border-green-200 rounded-lg p-6'>
						<div className='flex items-center gap-3 mb-4'>
							<CheckCircle className='w-6 h-6 text-green-600' />
							<h3 className='font-semibold text-green-800'>
								Token Created Successfully!
							</h3>
						</div>
						<p className='text-green-700 mb-4'>
							Your new token "{newTokenData.name}" has been created.{" "}
							<strong>Save it now</strong> - you won't be able to see it again.
						</p>
						<div className='bg-white border border-green-200 rounded-lg p-4 font-mono text-sm break-all flex items-center justify-between'>
							<span className='text-gray-800'>{newTokenData.token}</span>
							<button
								onClick={() => copyToClipboard(newTokenData.token)}
								className='ml-4 p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors'
								title='Copy token'>
								<Copy className='w-4 h-4' />
							</button>
						</div>
						<button
							onClick={() => setNewTokenData(null)}
							className='mt-4 text-green-700 hover:text-green-800 font-medium'>
							I've saved my token
						</button>
					</div>
				)}

				{/* Tokens List */}
				<div className='bg-white rounded-xl shadow-sm border border-gray-200'>
					<div className='p-6 border-b border-gray-200'>
						<h2 className='text-xl font-semibold text-gray-900'>
							Your API Tokens
						</h2>
						<p className='text-gray-600 mt-1'>
							Manage and monitor your active API tokens
						</p>
					</div>

					{loading && (
						<div className='p-8 text-center'>
							<div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
							<p className='mt-4 text-gray-600'>Loading tokens...</p>
						</div>
					)}

					{!loading && tokens.length === 0 && (
						<div className='p-12 text-center'>
							<Shield className='w-16 h-16 text-gray-300 mx-auto mb-4' />
							<h3 className='text-lg font-medium text-gray-900 mb-2'>
								No API tokens yet
							</h3>
							<p className='text-gray-600 mb-6'>
								Create your first API token to start accessing the public API
							</p>
							<button
								onClick={() => setShowCreateModal(true)}
								className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium'>
								Create Your First Token
							</button>
						</div>
					)}

					{!loading && tokens.length > 0 && (
						<div className='overflow-hidden'>
							{tokens.map((token) => {
								const status = getTokenStatus(token);
								const isVisible = visibleTokens.has(token.id);

								return (
									<div
										key={token.id}
										className='border-b border-gray-200 last:border-b-0 p-6 hover:bg-gray-50 transition-colors'>
										<div className='flex items-start justify-between'>
											<div className='flex-1'>
												<div className='flex items-center gap-3 mb-3'>
													<h3 className='font-semibold text-gray-900 text-lg'>
														{token.name}
													</h3>
													<span
														className={`px-3 py-1 rounded-full text-xs font-medium ${status.color} ${status.bg} capitalize`}>
														{status.status}
													</span>
												</div>

												<div className='space-y-2 mb-4'>
													<div className='flex items-center gap-2 text-sm text-gray-600'>
														<Calendar className='w-4 h-4' />
														<span>Created: {formatDate(token.createdAt)}</span>
													</div>
													{token.expiresAt && (
														<div className='flex items-center gap-2 text-sm text-gray-600'>
															<Clock className='w-4 h-4' />
															<span>
																Expires: {formatDate(token.expiresAt)}
															</span>
														</div>
													)}
													{token.lastUsed && (
														<div className='flex items-center gap-2 text-sm text-gray-600'>
															<Info className='w-4 h-4' />
															<span>
																Last used: {formatDate(token.lastUsed)}
															</span>
														</div>
													)}
												</div>

												<div className='flex items-center gap-2 mb-4'>
													<span className='text-sm font-medium text-gray-700'>
														Token:
													</span>
													<div className='bg-gray-100 rounded-lg px-3 py-2 font-mono text-sm flex items-center gap-2 flex-1 max-w-md'>
														<span className='overflow-x-auto '>
															{isVisible
																? token.tokenHash
																: "••••••••••••••••••••••••••••••••"}
														</span>
														<button
															onClick={() => toggleTokenVisibility(token.id)}
															className='text-gray-500 hover:text-gray-700'>
															{isVisible ? (
																<EyeOff className='w-4 h-4' />
															) : (
																<Eye className='w-4 h-4' />
															)}
														</button>
														{isVisible && (
															<button
																onClick={() => copyToClipboard(token.tokenHash)}
																className='text-gray-500 hover:text-gray-700'
																title='Copy token'>
																<Copy className='w-4 h-4' />
															</button>
														)}
													</div>
												</div>

												{token.scopes.length > 0 && (
													<div className='flex items-center gap-2'>
														<span className='text-sm font-medium text-gray-700'>
															Scopes:
														</span>
														<div className='flex flex-wrap gap-1'>
															{token.scopes.map((scope) => (
																<span
																	key={scope}
																	className='px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-lg'>
																	{scope}
																</span>
															))}
														</div>
													</div>
												)}
											</div>

											<div className='flex items-center gap-2 ml-4'>
												<RevokeTokenButton
													onConfirm={() => revokeToken(token.id)}
												/>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* API Documentation */}
				<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
					<h2 className='text-2xl font-semibold text-gray-900 mb-6'>
						API Documentation
					</h2>

					<div className='space-y-8'>
						<div className='bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-xl shadow-sm text-sm'>
							<p>
								<strong>Note:</strong> All public API routes operate strictly on
								the tables created within this application. Make sure you have
								at least one database and table defined before sending any
								requests to these endpoints.
							</p>
						</div>

						{/* Authentication */}
						<div>
							<h3 className='text-lg font-semibold text-gray-900 mb-4'>
								Authentication
							</h3>
							<p className='text-gray-600 mb-4'>
								Include your API token in the{" "}
								<code className='bg-gray-100 px-2 py-1 rounded text-sm'>
									Authorization
								</code>{" "}
								header with every request:
							</p>
							<div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto'>
								<span className='text-blue-300'>Authorization:</span> Bearer
								YOUR_API_TOKEN
							</div>
						</div>

						{/* Available Endpoints */}
						<div>
							<h3 className='text-lg font-semibold text-gray-900 mb-4'>
								Available Endpoints
							</h3>

							<div className='space-y-6'>
								{/* Tables List Endpoint */}
								<div className='border border-gray-200 rounded-lg p-6'>
									<div className='flex items-center gap-3 mb-4'>
										<span className='bg-green-100 text-green-800 px-3 py-1 rounded-lg font-mono text-sm font-semibold'>
											GET
										</span>
										<code className='max-w-full text-sm md:text-lg font-mono break-all'>
											/api/public/tables
										</code>
									</div>
									<p className='text-gray-600 mb-4'>
										List all accessible tables.
									</p>

									<div className='space-y-4'>
										<div>
											<h4 className='font-semibold text-gray-900 mb-2'>
												Query Parameters (not available yet)
											</h4>
											<div className='space-y-2'>
												<div className='bg-gray-50 p-3 rounded-lg'>
													<code className='text-sm'>page</code>{" "}
													<span className='text-gray-600'>
														(number, optional) - Page number (default: 1)
													</span>
												</div>
												<div className='bg-gray-50 p-3 rounded-lg'>
													<code className='text-sm'>limit</code>{" "}
													<span className='text-gray-600'>
														(number, optional) - Items per page (default: 10,
														max: 100)
													</span>
												</div>
											</div>
										</div>

										<div>
											<h4 className='font-semibold text-gray-900 mb-2'>
												Example Request
											</h4>
											<div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto'>
												<div className='text-yellow-300'>
													curl -X GET
													"multi-tenant-platform-nu.vercel.app/api/public/tables?page=1&limit=20"
												</div>
												<div className='text-gray-300 ml-4'>
													-H "Authorization: Bearer YOUR_API_TOKEN"
												</div>
											</div>
										</div>
									</div>
								</div>
								{/* Tables Endpoint */}
								<div className='border border-gray-200 rounded-lg p-6 space-y-10'>
									<div>
										<div className='flex items-center gap-3 mb-4'>
											<span className='bg-green-100 text-green-800 px-3 py-1 rounded-lg font-mono text-sm font-semibold'>
												GET
											</span>
											<code className='max-w-full text-sm md:text-lg font-mono break-all'>
												/api/public/tables/:tableId
											</code>
										</div>
										<p className='text-gray-600 mb-4'>
											Retrieve data from a specific table.
										</p>

										<div className='space-y-4'>
											<div>
												<h4 className='font-semibold text-gray-900 mb-2'>
													Parameters
												</h4>
												<div className='bg-gray-50 p-3 rounded-lg'>
													<code className='text-sm'>tableId</code>{" "}
													<span className='text-gray-600'>
														(string, required) - The ID of the table to retrieve
													</span>
												</div>
											</div>

											<div>
												<h4 className='font-semibold text-gray-900 mb-2'>
													Example Request
												</h4>
												<div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto'>
													<div className='text-yellow-300'>
														curl -X GET
														"multi-tenant-platform-nu.vercel.app/api/public/tables/table123"
													</div>
													<div className='text-gray-300 ml-4'>
														-H "Authorization: Bearer YOUR_API_TOKEN"
													</div>
												</div>
											</div>

											<div>
												<h4 className='font-semibold text-gray-900 mb-2'>
													Example Response
												</h4>
												<div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto'>
													<pre>{`
 {
    "id": 31,
    "name": "projects",
    "description": "Represents custom projects or orders carried out for clients. Contains details like project name, associated client, status, deadline, and creation date.",
    "databaseId": 6,
    "rows": [
        {
            "id": 51,
            "createdAt": "2025-07-18T14:33:00.000Z",
            "name": "Website Redesign",
            "deadline": "2025-09-19T14:33:00.000Z",
            "status": "InProgress",
            "client": 50
        },
        {
            "id": 55,
            "createdAt": "2025-07-03T08:48:00.000Z",
            "name": "Hanana",
            "status": "Done",
            "deadline": "2025-07-10T08:48:00.000Z",
            "client": null
        }
    ]
}`}</pre>
												</div>
											</div>
										</div>
									</div>
								</div>
								{/* Rows Endpoints */}
								<div className='border border-gray-200 rounded-lg p-6 space-y-10'>
									<div>
										<div className='flex items-center gap-3 mb-4'>
											<span className='bg-yellow-100 text-yellow-600 px-3 py-1 rounded-lg font-mono text-sm font-semibold'>
												POST
											</span>
											<code className='max-w-full text-sm md:text-lg font-mono break-all'>
												/api/public/tables/:tableId/rows
											</code>
										</div>
										<p className='text-gray-600 mb-4'>
											Add rows in a specific table.
										</p>

										<div className='space-y-4'>
											<div>
												<h4 className='font-semibold text-gray-900 mb-2'>
													Parameters
												</h4>
												<div className='bg-gray-50 p-3 rounded-lg'>
													<code className='text-sm'>tableId</code>{" "}
													<span className='text-gray-600'>
														(string, required) - The ID of the table to add
													</span>
												</div>
											</div>

											<div>
												<h4 className='font-semibold text-gray-900 mb-2'>
													Example Request
												</h4>
												<div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto'>
													<div className='text-yellow-300'>
														curl -X POST
														"multi-tenant-platform-nu.vercel.app/api/public/tables/table123/rows"
													</div>
													<div className='text-gray-300 ml-4'>
														-H "Authorization: Bearer YOUR_API_TOKEN"
													</div>
												</div>
											</div>

											<div>
												<h4 className='font-semibold text-gray-900 mb-2'>
													Example Body
												</h4>
												<div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto'>
													<pre>{`
 { 
    "id": 55,
    "createdAt": "2025-07-03T08:48:00.000Z",
    "name": "Hanana",
    "status": "Done",
    "deadline": "2025-07-10T08:48:00.000Z",
    "client": null
}`}</pre>
												</div>
											</div>
										</div>
									</div>
									<div>
										<div className='flex items-center gap-3 mb-4'>
											<span className='bg-pink-100 text-pink-600 px-3 py-1 rounded-lg font-mono text-sm font-semibold'>
												PATCH
											</span>
											<code className='max-w-full text-sm md:text-lg font-mono break-all'>
												/api/public/tables/:tableId/rows/:rowId
											</code>
										</div>
										<p className='text-gray-600 mb-4'>
											Modify data in a specific row.
										</p>

										<div className='space-y-4'>
											<div>
												<h4 className='font-semibold text-gray-900 mb-2'>
													Parameters
												</h4>
												<div className='flex flex-col bg-gray-50 p-3 rounded-lg space-y-2'>
													<div>
														<code className='text-sm'>tableId</code>{" "}
														<span className='text-gray-600'>
															(string, required) - The ID of the table
														</span>
													</div>
													<div>
														<code className='text-sm'>rowId</code>{" "}
														<span className='text-gray-600'>
															(string, required) - The ID of the row to modify
														</span>
													</div>
												</div>
											</div>

											<div>
												<h4 className='font-semibold text-gray-900 mb-2'>
													Example Request
												</h4>
												<div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto'>
													<div className='text-yellow-300'>
														curl -X PATCH
														"multi-tenant-platform-nu.vercel.app/api/public/tables/table123/rows/row12"
													</div>
													<div className='text-gray-300 ml-4'>
														-H "Authorization: Bearer YOUR_API_TOKEN"
													</div>
												</div>
											</div>

											<div>
												<h4 className='font-semibold text-gray-900 mb-2'>
													Example Body
												</h4>
												<div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto'>
													<pre>{`
 { 
    "name": "Hanana",
    "status": "Done",
    "deadline": "2025-07-10T08:48:00.000Z",
}`}</pre>
												</div>
											</div>
										</div>
									</div>
									<div>
										<div className='flex items-center gap-3 mb-4'>
											<span className='bg-orange-100 text-orange-600 px-3 py-1 rounded-lg font-mono text-sm font-semibold'>
												DELETE
											</span>
											<code className='max-w-full text-sm md:text-lg font-mono break-all'>
												/api/public/tables/:tableId/rows/:rowId
											</code>
										</div>
										<p className='text-gray-600 mb-4'>Delete a specific row.</p>

										<div className='space-y-4'>
											<div>
												<h4 className='font-semibold text-gray-900 mb-2'>
													Parameters
												</h4>
												<div className='flex flex-col bg-gray-50 p-3 rounded-lg space-y-2'>
													<div>
														<code className='text-sm'>tableId</code>{" "}
														<span className='text-gray-600'>
															(string, required) - The ID of the table
														</span>
													</div>
													<div>
														<code className='text-sm'>rowId</code>{" "}
														<span className='text-gray-600'>
															(string, required) - The ID of the row to delete
														</span>
													</div>
												</div>
											</div>

											<div>
												<h4 className='font-semibold text-gray-900 mb-2'>
													Example Request
												</h4>
												<div className='bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto'>
													<div className='text-yellow-300'>
														curl -X DELETE
														"multi-tenant-platform-nu.vercel.app/api/public/tables/table123/rows/row12"
													</div>
													<div className='text-gray-300 ml-4'>
														-H "Authorization: Bearer YOUR_API_TOKEN"
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Rate Limits
					<div>
						<h3 className='text-lg font-semibold text-gray-900 mb-4'>
							Rate Limits
						</h3>
						<div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
							<div className='flex items-center gap-3 mb-2'>
								<Info className='w-5 h-5 text-blue-600' />
								<span className='font-medium text-blue-900'>
									Rate Limit Information
								</span>
							</div>
							<ul className='text-blue-800 space-y-1'>
								<li>• 1000 requests per hour per token</li>
								<li>• 100 requests per minute per token</li>
								<li>• Rate limit headers included in responses</li>
							</ul>
						</div>
					</div> */}

						{/* Error Responses */}
						<div>
							<h3 className='text-lg font-semibold text-gray-900 mb-4'>
								Error Responses
							</h3>
							<div className='space-y-3'>
								<div className='flex items-center gap-4 p-3 bg-gray-50 rounded-lg'>
									<span className='font-mono text-sm bg-red-100 text-red-800 px-2 py-1 rounded'>
										401
									</span>
									<span className='text-gray-700'>
										Unauthorized - Invalid or missing API token
									</span>
								</div>
								<div className='flex items-center gap-4 p-3 bg-gray-50 rounded-lg'>
									<span className='font-mono text-sm bg-red-100 text-red-800 px-2 py-1 rounded'>
										403
									</span>
									<span className='text-gray-700'>
										Forbidden - Token doesn't have required permissions
									</span>
								</div>
								<div className='flex items-center gap-4 p-3 bg-gray-50 rounded-lg'>
									<span className='font-mono text-sm bg-red-100 text-red-800 px-2 py-1 rounded'>
										404
									</span>
									<span className='text-gray-700'>
										Not Found - Resource doesn't exist
									</span>
								</div>
								<div className='flex items-center gap-4 p-3 bg-gray-50 rounded-lg'>
									<span className='font-mono text-sm bg-red-100 text-red-800 px-2 py-1 rounded'>
										429
									</span>
									<span className='text-gray-700'>
										Too Many Requests - Rate limit exceeded
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Create Token Modal */}
				{showCreateModal && (
					<CreateTokenModal
						onClose={() => setShowCreateModal(false)}
						onCreate={createToken}
					/>
				)}
			</div>
		</div>
	);
};

// Create Token Modal Component
const CreateTokenModal = ({
	onClose,
	onCreate,
}: {
	onClose: () => void;
	onCreate: (data: CreateTokenRequest) => void;
}) => {
	const [formData, setFormData] = useState<CreateTokenRequest>({
		name: "",
		expiresIn: undefined,
		scopes: [],
	});

	const availableScopes = ["tables:read", "rows:read", "rows:write"];

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name.trim()) return;
		onCreate(formData);
	};

	const toggleScope = (scope: string) => {
		setFormData((prev) => ({
			...prev,
			scopes: prev.scopes?.includes(scope)
				? prev.scopes.filter((s) => s !== scope)
				: [...(prev.scopes || []), scope],
		}));
	};

	return (
		<div className='fixed inset-0 bg-black/20 bg-opacity-50 flex items-center justify-center p-4 z-50'>
			<div className='bg-white rounded-xl shadow-xl max-w-md w-full p-6'>
				<h2 className='text-xl font-semibold text-gray-900 mb-6'>
					Create New API Token
				</h2>

				<div className='space-y-4'>
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-2'>
							Token Name *
						</label>
						<input
							type='text'
							value={formData.name}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, name: e.target.value }))
							}
							className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
							placeholder='e.g., Production API Access'
							required
						/>
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-2'>
							Expires In (Optional)
						</label>
						<select
							value={formData.expiresIn || ""}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									expiresIn: e.target.value
										? Number(e.target.value)
										: undefined,
								}))
							}
							className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'>
							<option value=''>Never expires</option>
							<option value='30'>30 days</option>
							<option value='90'>90 days</option>
							<option value='365'>1 year</option>
						</select>
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-2'>
							Scopes (Optional)
						</label>
						<div className='space-y-2'>
							{availableScopes.map((scope) => (
								<label key={scope} className='flex items-center'>
									<input
										type='checkbox'
										checked={formData.scopes?.includes(scope) || false}
										onChange={() => toggleScope(scope)}
										className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
									/>
									<span className='ml-2 text-sm text-gray-700'>{scope}</span>
								</label>
							))}
						</div>
					</div>

					<div className='flex gap-3 pt-4'>
						<button
							type='button'
							onClick={onClose}
							className='flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors'>
							Cancel
						</button>
						<button
							type='button'
							onClick={() => {
								if (!formData.name.trim()) return;
								onCreate(formData);
							}}
							className='flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors'>
							Create Token
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ApiTokensPage;
