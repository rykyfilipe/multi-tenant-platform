/** @format */

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { ElegantLoadingState } from "./ui/loading-states";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { fadeInUp, spinAnimation } from "@/lib/animations";

interface Props {
	message: string;
}

function Loading({ message }: Props) {
	const { t } = useLanguage();
	const [showFallback, setShowFallback] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setShowFallback(true);
		}, 5000);

		return () => clearTimeout(timer);
	}, []);

	if (showFallback) {
		return (
			<motion.div
				className='flex items-center justify-center h-64 w-full'
				{...fadeInUp}>
				<div className='flex flex-col items-center space-y-4'>
					<motion.div
						className='w-12 h-12 border-4 border-red-400 border-dashed rounded-full'
						{...spinAnimation}
					/>
					<motion.p
						className='text-gray-600 text-sm text-center'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.2 }}>
						{t("loading.fallbackMessage")}
					</motion.p>
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4 }}>
						<Button onClick={() => window.location.reload()}>
							{t("loading.refresh")}
						</Button>
					</motion.div>
				</div>
			</motion.div>
		);
	}

	return <ElegantLoadingState message={message} />;
}

export default Loading;
