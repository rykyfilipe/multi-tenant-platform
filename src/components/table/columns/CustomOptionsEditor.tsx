/** @format */
"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { X, Plus } from "lucide-react";

interface Props {
	options: string[];
	onOptionsChange: (options: string[]) => void;
	onClose: () => void;
}

export function CustomOptionsEditor({ options, onOptionsChange, onClose }: Props) {
	const [newOption, setNewOption] = useState("");

	const handleAddOption = useCallback(() => {
		if (newOption.trim() && !options.includes(newOption.trim())) {
			const updatedOptions = [...options, newOption.trim()];
			onOptionsChange(updatedOptions);
			setNewOption("");
		}
	}, [newOption, options, onOptionsChange]);

	const handleRemoveOption = useCallback(
		(index: number) => {
			const updatedOptions = options.filter((_, i) => i !== index);
			onOptionsChange(updatedOptions);
		},
		[options, onOptionsChange],
	);

	const handleKeyPress = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				e.preventDefault();
				handleAddOption();
			}
		},
		[handleAddOption],
	);

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold text-foreground">
						Configure Custom Options
					</h3>
					<Button
						variant="ghost"
						size="sm"
						onClick={onClose}
						className="h-8 w-8 p-0">
						<X className="h-4 w-4" />
					</Button>
				</div>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label className="text-sm font-medium text-foreground">
							Add New Option
						</Label>
						<div className="flex gap-2">
							<Input
								type="text"
								value={newOption}
								onChange={(e) => setNewOption(e.target.value)}
								onKeyPress={handleKeyPress}
								placeholder="Enter option value"
								className="flex-1"
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={handleAddOption}
								disabled={!newOption.trim() || options.includes(newOption.trim())}>
								<Plus className="w-4 h-4" />
							</Button>
						</div>
					</div>

					{options.length > 0 && (
						<div className="space-y-2">
							<Label className="text-sm font-medium text-foreground">
								Current Options ({options.length})
							</Label>
							<div className="space-y-2 max-h-40 overflow-y-auto">
								{options.map((option, index) => (
									<div
										key={index}
										className="flex items-center justify-between bg-secondary px-3 py-2 rounded-md">
										<span className="text-sm text-foreground">{option}</span>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => handleRemoveOption(index)}
											className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
											<X className="h-3 w-3" />
										</Button>
									</div>
								))}
							</div>
						</div>
					)}

					{options.length === 0 && (
						<div className="text-center py-4 text-muted-foreground">
							<p className="text-sm">No options added yet</p>
							<p className="text-xs mt-1">
								Add at least one option to create the dropdown
							</p>
						</div>
					)}

					<div className="flex justify-end gap-2 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={options.length === 0}>
							{options.length === 0 ? "Add Options First" : "Done"}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
