/** @format */

import React, { useEffect } from 'react';
import Head from 'next/head';

interface PerformanceOptimizerProps {
	children: React.ReactNode;
	preloadFonts?: boolean;
	preloadCriticalCSS?: boolean;
}

const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
	children,
	preloadFonts = true,
	preloadCriticalCSS = true,
}) => {
	useEffect(() => {
		// Preload critical resources
		if (typeof window !== 'undefined') {
			// Preload critical fonts
			if (preloadFonts) {
				const fontLinks = [
					'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
				];

				fontLinks.forEach(href => {
					const link = document.createElement('link');
					link.rel = 'preload';
					link.as = 'style';
					link.href = href;
					document.head.appendChild(link);
				});
			}

			// Preload critical images
			const criticalImages = [
				'/logo.png',
				'/cursor-black.png',
				'/cursor-white.svg',
			];

			criticalImages.forEach(src => {
				const link = document.createElement('link');
				link.rel = 'preload';
				link.as = 'image';
				link.href = src;
				document.head.appendChild(link);
			});

			// Preload critical API endpoints
			const criticalAPIs = [
				'/api/tenants',
				'/api/users',
			];

			criticalAPIs.forEach(endpoint => {
				const link = document.createElement('link');
				link.rel = 'preconnect';
				link.href = endpoint;
				document.head.appendChild(link);
			});
		}
	}, [preloadFonts]);

	return (
		<>
			<Head>
				{/* DNS prefetch for external domains */}
				<link rel="dns-prefetch" href="//fonts.googleapis.com" />
				<link rel="dns-prefetch" href="//fonts.gstatic.com" />
				<link rel="dns-prefetch" href="//js.stripe.com" />
				<link rel="dns-prefetch" href="//api.stripe.com" />

				{/* Preconnect to external domains */}
				<link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link rel="preconnect" href="https://js.stripe.com" crossOrigin="anonymous" />
				<link rel="preconnect" href="https://api.stripe.com" crossOrigin="anonymous" />

				{/* Critical CSS inlining for above-the-fold content */}
				{preloadCriticalCSS && (
					<style
						dangerouslySetInnerHTML={{
							__html: `
								/* Critical CSS for dashboard */
								.dashboard-card {
									transition: all 0.2s ease-in-out;
								}
								.dashboard-stats {
									display: grid;
									gap: 1rem;
								}
								@media (min-width: 640px) {
									.dashboard-stats {
										grid-template-columns: repeat(2, 1fr);
									}
								}
								@media (min-width: 1024px) {
									.dashboard-stats {
										grid-template-columns: repeat(3, 1fr);
									}
								}
								@media (min-width: 1280px) {
									.dashboard-stats {
										grid-template-columns: repeat(6, 1fr);
									}
								}
								/* Optimize skeleton loading */
								.skeleton-loading {
									animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
								}
								@keyframes pulse {
									0%, 100% {
										opacity: 1;
									}
									50% {
										opacity: .5;
									}
								}
							`,
						}}
					/>
				)}

				{/* Resource hints for better performance */}
				<link rel="preload" href="/_next/static/chunks/main.js" as="script" />
				<link rel="preload" href="/_next/static/chunks/webpack.js" as="script" />
				
				{/* Preload critical components */}
				<link rel="modulepreload" href="/_next/static/chunks/components_dashboard_DashboardStats_tsx.js" />
				<link rel="modulepreload" href="/_next/static/chunks/components_dashboard_DataUsageChart_tsx.js" />
				<link rel="modulepreload" href="/_next/static/chunks/components_dashboard_UserActivityChart_tsx.js" />
			</Head>
			{children}
		</>
	);
};

export default PerformanceOptimizer;
