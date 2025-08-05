/** @format */

"use client";

import React from "react";
import {
	Shield,
	Eye,
	EyeOff,
	Copy,
	Calendar,
	Clock,
	Info,
	Trash2,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import RevokeTokenButton from "@/components/doc/RemoveTokenButton";

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

interface TokensListProps {
	tokens: ApiToken[];
	loading: boolean;
	visibleTokens: Set<string>;
	onCreateToken: () => void;
	onToggleTokenVisibility: (tokenId: string) => void;
	onCopyToken: (text: string) => void;
	onRevokeToken: (tokenId: string) => void;
}

export const TokensList = ({
	tokens,
	loading,
	visibleTokens,
	onCreateToken,
	onToggleTokenVisibility,
	onCopyToken,
	onRevokeToken,
}: TokensListProps) => {
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

	if (loading) {
		return (
			<div className='border border-border/20 bg-card/50 backdrop-blur-sm rounded-lg'>
				<div className='p-6 sm:p-8 text-center'>
					<div className='w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4'>
						<Loader2 className='w-6 h-6 sm:w-8 sm:h-8 text-white animate-spin' />
					</div>
					<h3 className='text-base sm:text-lg font-semibold text-foreground mb-2'>
						Loading API tokens
					</h3>
					<p className='text-sm text-muted-foreground'>
						Fetching your authentication tokens...
					</p>
				</div>
			</div>
		);
	}

	if (tokens.length === 0) {
		return (
			<div className='border border-border/20 bg-card/50 backdrop-blur-sm rounded-lg'>
				<div className='p-8 sm:p-12 text-center'>
					<div className='p-3 sm:p-4 bg-muted/30 rounded-full w-fit mx-auto mb-4'>
						<Shield className='w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground' />
					</div>
					<h3 className='text-base sm:text-lg font-medium text-foreground mb-2'>
						No API tokens yet
					</h3>
					<p className='text-sm text-muted-foreground mb-6'>
						Create your first API token to start accessing the public API
					</p>
					<Button onClick={onCreateToken} className='w-full sm:w-auto'>
						Create Your First Token
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className='border border-border/20 bg-card/50 backdrop-blur-sm rounded-lg overflow-hidden'>
			{/* Table Header */}
			<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b border-border/20 bg-muted/30 gap-3'>
				<div className='flex items-center gap-3'>
					<div className='p-2 bg-primary/10 rounded-lg'>
						<Shield className='w-4 h-4 text-primary' />
					</div>
					<div>
						<h3 className='text-sm font-semibold text-foreground'>
							Your API Tokens
						</h3>
						<p className='text-xs text-muted-foreground'>
							{tokens.length} token{tokens.length !== 1 && "s"}
						</p>
					</div>
				</div>
				<Button onClick={onCreateToken} size='sm' className='w-full sm:w-auto'>
					Create New Token
				</Button>
			</div>

			{/* Mobile Cards View */}
			<div className='block sm:hidden'>
				<div className='p-4 space-y-4'>
					{tokens.map((token) => {
						const status = getTokenStatus(token);
						const isVisible = visibleTokens.has(token.id);

						return (
							<div
								key={token.id}
								className='border border-border/20 rounded-lg p-4 space-y-3 bg-background/50'>
								{/* Header */}
								<div className='flex items-start justify-between gap-3'>
									<div className='flex-1 min-w-0'>
										<h4 className='font-medium text-foreground truncate'>
											{token.name}
										</h4>
										{token.lastUsed && (
											<div className='text-xs text-muted-foreground flex items-center gap-1 mt-1'>
												<Info className='w-3 h-3 flex-shrink-0' />
												<span className='truncate'>
													Last used: {formatDate(token.lastUsed)}
												</span>
											</div>
										)}
									</div>
									<span
										className={`px-2 py-1 rounded-full text-xs font-medium ${status.color} ${status.bg} capitalize flex-shrink-0`}>
										{status.status}
									</span>
								</div>

								{/* Token */}
								<div className='bg-muted/50 rounded-lg p-3'>
									<div className='flex items-center gap-2'>
										<div className='flex-1 min-w-0'>
											<code className='text-xs font-mono text-gray-800 break-all'>
												{isVisible ? token.tokenHash : "•••••••••••••••••••"}
											</code>
										</div>
										<div className='flex items-center gap-1 flex-shrink-0'>
											<Button
												variant='ghost'
												size='sm'
												onClick={() => onToggleTokenVisibility(token.id)}
												className='h-7 w-7 p-0 text-muted-foreground hover:text-foreground'>
												{isVisible ? (
													<EyeOff className='w-3 h-3' />
												) : (
													<Eye className='w-3 h-3' />
												)}
											</Button>
											{isVisible && (
												<Button
													variant='ghost'
													size='sm'
													onClick={() => onCopyToken(token.tokenHash)}
													className='h-7 w-7 p-0 text-muted-foreground hover:text-foreground'>
													<Copy className='w-3 h-3' />
												</Button>
											)}
										</div>
									</div>
								</div>

								{/* Scopes */}
								<div className='flex flex-wrap gap-1'>
									{token.scopes.map((scope) => (
										<span
											key={scope}
											className='px-2 py-1 bg-primary/10 text-primary text-xs rounded-lg'>
											{scope}
										</span>
									))}
								</div>

								{/* Dates */}
								<div className='text-xs text-muted-foreground space-y-1'>
									<div className='flex items-center gap-1'>
										<Calendar className='w-3 h-3 flex-shrink-0' />
										<span>Created: {formatDate(token.createdAt)}</span>
									</div>
									{token.expiresAt && (
										<div className='flex items-center gap-1'>
											<Clock className='w-3 h-3 flex-shrink-0' />
											<span>Expires: {formatDate(token.expiresAt)}</span>
										</div>
									)}
								</div>

								{/* Actions */}
								<div className='flex justify-end pt-2 border-t border-border/20'>
									<RevokeTokenButton
										onConfirm={() => onRevokeToken(token.id)}
									/>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Desktop Table View */}
			<div className='hidden sm:block'>
				<div
					className='overflow-auto'
					style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
					<table className='w-full'>
						<thead>
							<tr className='bg-muted/20'>
								<th className='text-xs font-medium text-muted-foreground uppercase tracking-wider p-4 text-left'>
									Name
								</th>
								<th className='text-xs font-medium text-muted-foreground uppercase tracking-wider p-4 text-left'>
									Status
								</th>
								<th className='text-xs font-medium text-muted-foreground uppercase tracking-wider p-4 text-left'>
									Token
								</th>
								<th className='text-xs font-medium text-muted-foreground uppercase tracking-wider p-4 text-left'>
									Scopes
								</th>
								<th className='text-xs font-medium text-muted-foreground uppercase tracking-wider p-4 text-left'>
									Created
								</th>
								<th className='text-xs font-medium text-muted-foreground uppercase tracking-wider p-4 text-right'>
									Actions
								</th>
							</tr>
						</thead>
						<tbody>
							{tokens.map((token) => {
								const status = getTokenStatus(token);
								const isVisible = visibleTokens.has(token.id);

								return (
									<tr
										key={token.id}
										className='hover:bg-muted/30 transition-colors border-b border-border/10'>
										<td className='p-4'>
											<div>
												<div className='font-medium text-foreground'>
													{token.name}
												</div>
												{token.lastUsed && (
													<div className='text-xs text-muted-foreground flex items-center gap-1 mt-1'>
														<Info className='w-3 h-3' />
														Last used: {formatDate(token.lastUsed)}
													</div>
												)}
											</div>
										</td>
										<td className='p-4'>
											<span
												className={`px-3 py-1 rounded-full text-xs font-medium ${status.color} ${status.bg} capitalize`}>
												{status.status}
											</span>
										</td>
										<td className='p-4'>
											<div className='flex items-center gap-2'>
												<div className='bg-muted/50 rounded-lg px-3 py-2 font-mono text-sm flex items-center gap-2 flex-1 max-w-md'>
													<div className='overflow-x-auto max-w-[200px] lg:max-w-full whitespace-nowrap'>
														<span className='block'>
															{isVisible
																? token.tokenHash
																: "•••••••••••••••••••"}
														</span>
													</div>
													<Button
														variant='ghost'
														size='sm'
														onClick={() => onToggleTokenVisibility(token.id)}
														className='h-8 w-8 p-0 text-muted-foreground hover:text-foreground flex-shrink-0'
														title={isVisible ? "Hide token" : "Show token"}>
														{isVisible ? (
															<EyeOff className='w-4 h-4' />
														) : (
															<Eye className='w-4 h-4' />
														)}
													</Button>
													{isVisible && (
														<Button
															variant='ghost'
															size='sm'
															onClick={() => onCopyToken(token.tokenHash)}
															className='h-8 w-8 p-0 text-muted-foreground hover:text-foreground flex-shrink-0'
															title='Copy token'>
															<Copy className='w-4 h-4' />
														</Button>
													)}
												</div>
											</div>
										</td>
										<td className='p-4'>
											<div className='flex flex-wrap gap-1'>
												{token.scopes.map((scope) => (
													<span
														key={scope}
														className='px-2 py-1 bg-primary/10 text-primary text-xs rounded-lg'>
														{scope}
													</span>
												))}
											</div>
										</td>
										<td className='p-4'>
											<div className='text-sm text-muted-foreground'>
												<div className='flex items-center gap-1'>
													<Calendar className='w-3 h-3' />
													{formatDate(token.createdAt)}
												</div>
												{token.expiresAt && (
													<div className='flex items-center gap-1 mt-1'>
														<Clock className='w-3 h-3' />
														Expires: {formatDate(token.expiresAt)}
													</div>
												)}
											</div>
										</td>
										<td className='p-4'>
											<div className='flex items-center justify-end gap-2'>
												<RevokeTokenButton
													onConfirm={() => onRevokeToken(token.id)}
												/>
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};
