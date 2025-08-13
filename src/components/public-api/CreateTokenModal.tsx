/** @format */

"use client";

import React, { useState } from "react";
import { X, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { usePlanLimits } from "@/hooks/usePlanLimits";

type CreateTokenRequest = {
	name: string;
	expiresIn?: number; // days
	scopes?: string[];
};

interface CreateTokenModalProps {
	onClose: () => void;
	onCreate: (data: CreateTokenRequest) => void;
}

export const CreateTokenModal = ({
	onClose,
	onCreate,
}: CreateTokenModalProps) => {
	const [formData, setFormData] = useState<CreateTokenRequest>({
		name: "",
		expiresIn: undefined,
		scopes: [],
	});

	const availableScopes = ["tables:read", "rows:read", "rows:write"];
	const { checkLimit, currentPlan } = usePlanLimits();

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
		<Dialog open={true} onOpenChange={onClose}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<X className='w-5 h-5' />
						Create New API Token
					</DialogTitle>
				</DialogHeader>
				{/* Plan Limit Info */}
				{(() => {
					const tokenLimit = checkLimit("apiTokens");
					return (
						<div className='p-3 bg-blue-50 rounded-lg border border-blue-200'>
							<div className='flex items-center justify-between mb-2'>
								<div className='flex items-center gap-2'>
									<Key className='w-4 h-4 text-blue-600' />
									<span className='text-sm font-medium text-blue-900'>
										API Token Limit
									</span>
								</div>
								<Badge
									variant={tokenLimit.allowed ? "default" : "destructive"}
									className='text-xs'>
									{tokenLimit.current} / {tokenLimit.limit}
								</Badge>
							</div>
							<p className='text-xs text-blue-700'>
								{tokenLimit.allowed
									? `You can create ${
											tokenLimit.limit - tokenLimit.current
									  } more API token(s)`
									: "You've reached your plan limit. Upgrade to create more API tokens."}
							</p>
							<p className='text-xs text-orange-700 mt-1'>
								💡 API tokens provide access to all tables in your tenant through the public API by default.
							</p>
						</div>
					);
				})()}

				<form onSubmit={handleSubmit} className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='name'>Token Name *</Label>
						<Input
							id='name'
							type='text'
							value={formData.name}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, name: e.target.value }))
							}
							placeholder='e.g., Production API Access'
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='expiresIn'>Expires In</Label>
						<select
							id='expiresIn'
							value={formData.expiresIn || ""}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									expiresIn: e.target.value
										? Number(e.target.value)
										: undefined,
								}))
							}
							className='w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring'>
							<option value=''>Never expires</option>
							<option value='30'>30 days</option>
							<option value='90'>90 days</option>
							<option value='365'>1 year</option>
						</select>
					</div>

					<div className='space-y-2'>
						<Label>Scopes *</Label>
						<div className='space-y-2'>
							{availableScopes.map((scope) => (
								<div key={scope} className='flex items-center space-x-2'>
									<Checkbox
										id={scope}
										checked={formData.scopes?.includes(scope) || false}
										onCheckedChange={() => toggleScope(scope)}
									/>
									<Label
										htmlFor={scope}
										className='text-sm font-normal cursor-pointer'>
										{scope}
									</Label>
								</div>
							))}
						</div>
					</div>

					<div className='flex gap-3 pt-4'>
						<Button
							type='button'
							variant='outline'
							onClick={onClose}
							className='flex-1'>
							Cancel
						</Button>
						<Button
							type='submit'
							disabled={
								!formData.name.trim() || !checkLimit("apiTokens").allowed
							}
							className={`flex-1 ${
								!checkLimit("apiTokens").allowed ? "opacity-50" : ""
							}`}>
							Create Token
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
};
