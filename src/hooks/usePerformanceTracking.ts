/** @format */

import { useCallback, useEffect, useRef } from "react";
import { performanceMonitor } from "@/lib/performance-monitor";

interface PerformanceTrackingOptions {
	componentName: string;
	trackRenders?: boolean;
	trackEffects?: boolean;
	logSlowOperations?: boolean;
	slowThreshold?: number;
}

export function usePerformanceTracking(options: PerformanceTrackingOptions) {
	const {
		componentName,
		trackRenders = true,
		trackEffects = false,
		logSlowOperations = true,
		slowThreshold = 100,
	} = options;

	const renderStartTime = useRef<number>(0);
	const effectStartTime = useRef<number>(0);
	const renderCount = useRef<number>(0);

	// Track component renders
	useEffect(() => {
		if (trackRenders && typeof window !== "undefined") {
			const endTime = performance.now();
			const duration = endTime - renderStartTime.current;
			renderCount.current++;

			performanceMonitor.trackComponentRender(
				componentName,
				renderStartTime.current,
				{
					renderCount: renderCount.current,
					isMount: renderCount.current === 1,
				},
			);

			if (logSlowOperations && duration > slowThreshold) {
				console.warn(
					`🐌 Slow render detected in ${componentName}: ${duration.toFixed(
						2,
					)}ms (render #${renderCount.current})`,
				);
			}
		}
	});

	// Mark render start time
	if (trackRenders && typeof window !== "undefined") {
		renderStartTime.current = performance.now();
	}

	// Track effect performance
	const trackEffect = useCallback(
		(effectName: string, effectFn: () => void | Promise<void>) => {
			if (!trackEffects || typeof window === "undefined") {
				return effectFn();
			}

			const startTime = performance.now();
			const result = effectFn();

			// Handle both sync and async effects
			if (result instanceof Promise) {
				return result.finally(() => {
					const duration = performance.now() - startTime;
					performanceMonitor.trackComponentRender(
						`${componentName}_EFFECT_${effectName}`,
						startTime,
						{
							isAsync: true,
						},
					);

					if (logSlowOperations && duration > slowThreshold) {
						console.warn(
							`🐌 Slow effect detected in ${componentName}.${effectName}: ${duration.toFixed(
								2,
							)}ms`,
						);
					}
				});
			} else {
				const duration = performance.now() - startTime;
				performanceMonitor.trackComponentRender(
					`${componentName}_EFFECT_${effectName}`,
					startTime,
					{
						isAsync: false,
					},
				);

				if (logSlowOperations && duration > slowThreshold) {
					console.warn(
						`🐌 Slow effect detected in ${componentName}.${effectName}: ${duration.toFixed(
							2,
						)}ms`,
					);
				}

				return result;
			}
		},
		[componentName, trackEffects, logSlowOperations, slowThreshold],
	);

	// Track API calls
	const trackAPICall = useCallback(
		async (
			apiName: string,
			apiCall: () => Promise<any>,
			metadata?: Record<string, any>,
		) => {
			const startTime = Date.now();
			try {
				const result = await apiCall();
				performanceMonitor.trackAPIRequest(
					"COMPONENT",
					`${componentName}_${apiName}`,
					startTime,
					200,
					JSON.stringify(result).length,
					false,
					metadata,
				);
				return result;
			} catch (error) {
				performanceMonitor.trackAPIRequest(
					"COMPONENT",
					`${componentName}_${apiName}`,
					startTime,
					500,
					0,
					false,
					{ ...metadata, error: String(error) },
				);
				throw error;
			}
		},
		[componentName],
	);

	// Track expensive computations
	const trackComputation = useCallback(
		<T>(
			computationName: string,
			computation: () => T,
			metadata?: Record<string, any>,
		): T => {
			if (typeof window === "undefined") {
				return computation();
			}

			const startTime = performance.now();
			const result = computation();
			const duration = performance.now() - startTime;

			performanceMonitor.trackComponentRender(
				`${componentName}_COMPUTE_${computationName}`,
				startTime,
				metadata,
			);

			if (logSlowOperations && duration > slowThreshold) {
				console.warn(
					`🐌 Slow computation detected in ${componentName}.${computationName}: ${duration.toFixed(
						2,
					)}ms`,
				);
			}

			return result;
		},
		[componentName, logSlowOperations, slowThreshold],
	);

	return {
		trackEffect,
		trackAPICall,
		trackComputation,
		renderCount: renderCount.current,
	};
}

// Simple hook for automatic component performance tracking
export function useAutoPerformanceTracking(componentName: string) {
	useEffect(() => {
		if (typeof window === "undefined") return;

		const mountTime = performance.now();

		// Track component mount
		performanceMonitor.trackComponentRender(componentName, mountTime, {
			type: "mount",
			timestamp: Date.now(),
		});

		// Track component unmount
		return () => {
			const unmountTime = performance.now();
			const unmountDuration = unmountTime - mountTime;

			// Only track unmount if it's a reasonable duration (component wasn't unmounted for too long)
			if (unmountDuration < 60000) {
				// Less than 1 minute
				performanceMonitor.trackComponentRender(
					`${componentName}_unmount`,
					unmountTime,
					{
						type: "unmount",
						lifetime: unmountDuration,
						timestamp: Date.now(),
					},
				);
			}
		};
	}, [componentName]);

	// Track re-renders
	useEffect(() => {
		if (typeof window === "undefined") return;

		const renderTime = performance.now();

		performanceMonitor.trackComponentRender(
			`${componentName}_render`,
			renderTime,
			{
				type: "render",
				timestamp: Date.now(),
			},
		);
	});
}
