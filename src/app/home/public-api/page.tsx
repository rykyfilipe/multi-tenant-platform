/** @format */

"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { usePlanLimitError } from "@/hooks/usePlanLimitError";
import { ApiHeader } from "@/components/public-api/ApiHeader";
import { NewTokenAlert } from "@/components/public-api/NewTokenAlert";
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
	const [newTokenData, setNewTokenData] = useState<{
		token: string;
		name: string;
	} | null>(null);
	const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());

	const { token, showAlert } = useApp();
	const { handleApiError } = usePlanLimitError();

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

			if (!res.ok) {
				handleApiError(res);
				return;
			}

			const result = await res.json();
			console.log(result);
			setTokens((prev) => [...prev, result]);
			setNewTokenData({ token: result.tokenHash, name: tokenData.name });
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
			<div className='p-6 max-w-7xl mx-auto space-y-6'>
				{/* New Token Alert */}
				<NewTokenAlert
					tokenData={newTokenData}
					onCopy={copyToClipboard}
					onDismiss={() => setNewTokenData(null)}
				/>

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
