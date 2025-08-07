/** @format */

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { tourUtils } from "@/lib/tour-config";
import { useState } from "react";

interface TourResetButtonProps {
	className?: string;
	showConfirmation?: boolean;
}

export default function TourResetButton({
	className = "",
	showConfirmation = true,
}: TourResetButtonProps) {
	const [showConfirm, setShowConfirm] = useState(false);

	const handleReset = () => {
		if (showConfirmation && !showConfirm) {
			setShowConfirm(true);
			// Auto-hide confirmation after 3 seconds
			setTimeout(() => setShowConfirm(false), 3000);
			return;
		}

		tourUtils.resetAllTours();
		setShowConfirm(false);

		// Show success message
		if (typeof window !== "undefined") {
			// You can integrate this with your alert system
		}
	};

	return (
		<div className={`relative ${className}`}>
			<Button
				variant='outline'
				size='sm'
				onClick={handleReset}
				className='flex items-center gap-2'
				title='Reset all tour guides'>
				<RefreshCw className='w-4 h-4' />
				{showConfirmation && showConfirm ? "Confirm Reset" : "Reset Tours"}
			</Button>

			{showConfirmation && showConfirm && (
				<div className='absolute top-full left-0 mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-800 max-w-xs'>
					Click again to confirm resetting all tour guides
				</div>
			)}
		</div>
	);
}
