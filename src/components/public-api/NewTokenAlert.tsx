/** @format */

"use client";

import React from "react";
import { CheckCircle, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface NewTokenAlertProps {
	tokenData: {
		token: string;
		name: string;
	} | null;
	onCopy: (text: string) => void;
	onDismiss: () => void;
}

export const NewTokenAlert = ({ tokenData, onCopy, onDismiss }: NewTokenAlertProps) => {
	if (!tokenData) return null;

	return (
		<Alert className="border-green-200 bg-green-50">
			<div className="flex items-start justify-between">
				<div className="flex items-start gap-3">
					<CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
					<div className="flex-1">
						<AlertTitle className="text-green-800">
							Token Created Successfully!
						</AlertTitle>
						<AlertDescription className="text-green-700 mt-2">
							Your new token "{tokenData.name}" has been created.{" "}
							<strong>Save it now</strong> - you won't be able to see it again.
						</AlertDescription>
						<div className="mt-4 bg-white border border-green-200 rounded-lg p-3 font-mono text-sm break-all flex items-center justify-between">
							<span className="text-gray-800">{tokenData.token}</span>
							<Button
								onClick={() => onCopy(tokenData.token)}
								variant="ghost"
								size="sm"
								className="ml-3 text-green-600 hover:text-green-700 hover:bg-green-100 h-8 w-8 p-0">
								<Copy className="w-4 h-4" />
							</Button>
						</div>
						<Button
							onClick={onDismiss}
							variant="ghost"
							size="sm"
							className="mt-3 text-green-700 hover:text-green-800 font-medium">
							I've saved my token
						</Button>
					</div>
				</div>
				<Button
					onClick={onDismiss}
					variant="ghost"
					size="sm"
					className="text-green-600 hover:text-green-700 hover:bg-green-100 h-8 w-8 p-0">
					<X className="w-4 h-4" />
				</Button>
			</div>
		</Alert>
	);
}; 