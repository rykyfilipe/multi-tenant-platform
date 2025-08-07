/** @format */

"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import { usePlanLimitError } from "@/hooks/usePlanLimitError";
import { ApiHeader } from "@/components/public-api/ApiHeader";
import { TokensList } from "@/components/public-api/TokensList";
import { ApiDocumentation } from "@/components/public-api/ApiDocumentation";
import { CreateTokenModal } from "@/components/public-api/CreateTokenModal";
import { ApiLoadingState } from "@/components/ui/loading-states";
import Loading from "@/components/loading";
import TourProv from "@/contexts/TourProvider";
import { useTour } from "@reactour/tour";
import { publicApiTourSteps, tourUtils } from "@/lib/tour-config";

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
	const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());
	const hasFetched = useRef(false);

	const { token, showAlert } = useApp();
	const { handleApiError } = usePlanLimitError();
	const { setIsOpen, setCurrentStep } = useTour();

	const startTour = () => {
		setCurrentStep(0);
		setIsOpen(true);
	};

	useEffect(() => {
		const hasSeenTour = tourUtils.isTourSeen("public-api");
		if (!hasSeenTour && !loading && tokens.length > 0) {
			// Start tour after data is loaded
			const timer = setTimeout(() => {
				startTour();
			}, 1000);
			
			return () => clearTimeout(timer);
		}
	}, [loading, tokens]);

	// Fetch user tokens
	const fetchTokens = useCallback(async () => {
		if (loading || hasFetched.current) return; // Prevent multiple requests

		setLoading(true);
		try {
			const res = await fetch("/api/public/tokens", {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!res.ok) {
				handleApiError(res);
				return;
			}

			const data = await res.json();
			setTokens(data);
			hasFetched.current = true; // Mark as fetched
		} catch (err: any) {
			showAlert(err.message || "Unknown error", "error");
		} finally {
			setLoading(false);
		}
	}, [token, handleApiError, showAlert, loading]);

	useEffect(() => {
		if (token) {
			hasFetched.current = false; // Reset when token changes
			fetchTokens();
		} else {
			// Clear tokens when no token (user logged out)
			setTokens([]);
			hasFetched.current = false;
		}
	}, [token]);

	// Refresh tokens list
	const refreshTokens = useCallback(() => {
		hasFetched.current = false;
		fetchTokens();
	}, [fetchTokens]);

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

			if (!res.ok) {
				handleApiError(res);
				return;
			}

			const newToken = await res.json();
			setTokens((prev) => [...prev, newToken]);
			setShowCreateModal(false);
			showAlert("API token created successfully", "success");
		} catch (err: any) {
			showAlert(err.message || "Failed to create token", "error");
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

			if (!res.ok) {
				handleApiError(res);
				return;
			}

			setTokens((prev) =>
				prev.map((token) =>
					token.id === tokenId ? { ...token, revoked: true } : token,
				),
			);
			showAlert("Token revoked successfully", "success");
		} catch (err: any) {
			showAlert(err.message || "Failed to revoke token", "error");
		}
	};

	// Toggle token visibility
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

	// Copy to clipboard
	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		showAlert("Copied to clipboard", "success");
	};

	if (loading && tokens.length === 0) {
		return <ApiLoadingState />;
	}

	return (
		<TourProv
			steps={publicApiTourSteps}
			onTourComplete={() => {
				tourUtils.markTourSeen("public-api");
			}}
			onTourSkip={() => {
				tourUtils.markTourSeen("public-api");
			}}>
			<div className='h-full bg-background'>
				{/* Header */}
				<div className='api-header border-b border-border/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50'>
					<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 gap-4'>
						<div>
							<h1 className='text-xl font-semibold text-foreground'>
								Public API
							</h1>
							<p className='text-sm text-muted-foreground'>
								Manage API tokens and access documentation
							</p>
						</div>
						<div className='flex items-center space-x-2'>
							<button
								onClick={refreshTokens}
								className='text-sm text-muted-foreground hover:text-foreground transition-colors'>
								Refresh
							</button>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className='p-6 max-w-7xl mx-auto'>
					<div className='space-y-6'>
						{/* API Header Component */}
						<ApiHeader 
							onCreateToken={() => setShowCreateModal(true)}
							loading={loading}
							tokenCount={tokens.length}
						/>

						{/* Tokens Section */}
						<div className='tokens-list'>
							<TokensList
								tokens={tokens}
								loading={loading}
								visibleTokens={visibleTokens}
								onCreateToken={() => setShowCreateModal(true)}
								onToggleTokenVisibility={toggleTokenVisibility}
								onCopyToken={copyToClipboard}
								onRevokeToken={revokeToken}
							/>
						</div>

						{/* API Documentation */}
						<div className='api-documentation'>
							<ApiDocumentation />
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
		</TourProv>
	);
};

export default ApiTokensPage;
