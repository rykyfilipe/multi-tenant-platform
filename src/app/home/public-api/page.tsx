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

			const result = await res.json();

			setTokens((prev) => [...prev, result]);
			setShowCreateModal(false);
			showAlert("API token created successfully", "success");
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

			// Refresh the tokens list to get updated data
			refreshTokens();
			showAlert("Token revoked successfully", "success");
		} catch (err: any) {
			showAlert(err.message || "Unknown error", "error");
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

	if (loading && tokens.length === 0) {
		return <Loading message='API tokens' />;
	}

	return (
		<div className='h-full bg-background'>
			{/* Header */}
			<ApiHeader
				onCreateToken={() => setShowCreateModal(true)}
				loading={loading}
				tokenCount={tokens.length}
			/>

			{/* Main Content */}
			<div className='p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6'>
				{/* Tokens List */}
				<TokensList
					tokens={tokens}
					loading={loading}
					visibleTokens={visibleTokens}
					onCreateToken={() => setShowCreateModal(true)}
					onToggleTokenVisibility={toggleTokenVisibility}
					onCopyToken={copyToClipboard}
					onRevokeToken={revokeToken}
				/>

				{/* API Documentation */}
				<ApiDocumentation />

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

export default ApiTokensPage;
