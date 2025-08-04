/** @format */

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { ElegantLoadingState } from "./ui/loading-states";

interface Props {
	message: string;
}

function Loading({ message }: Props) {
	const [showFallback, setShowFallback] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setShowFallback(true);
		}, 5000);

		return () => clearTimeout(timer);
	}, []);

	if (showFallback) {
		return (
			<div className='flex items-center justify-center h-64 w-full'>
				<div className='flex flex-col items-center space-y-4'>
					<div className='w-12 h-12 border-4 border-red-400 border-dashed rounded-full animate-spin' />
					<p className='text-gray-600 text-sm text-center'>
						Something went wrong. Please refresh the page...
					</p>
					<Button onClick={() => window.location.reload()}>Refresh</Button>
				</div>
			</div>
		);
	}

	return <ElegantLoadingState message={`Loading ${message}...`} />;
}

export default Loading;
