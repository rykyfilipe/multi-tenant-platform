/** @format */

/**
 * Storage conversion utilities
 * Ensures consistent storage calculations across the application
 */

// Storage conversion constants
export const STORAGE_CONSTANTS = {
	BYTES_PER_KB: 1024,
	KB_PER_MB: 1024,
	MB_PER_GB: 1024,
} as const;

/**
 * Convert MB to bytes
 * @param mb - Megabytes
 * @returns bytes
 */
export function convertMBToBytes(mb: number): number {
	return mb * STORAGE_CONSTANTS.KB_PER_MB * STORAGE_CONSTANTS.BYTES_PER_KB;
}

/**
 * Convert MB to KB
 * @param mb - Megabytes
 * @returns kilobytes
 */
export function convertMBToKB(mb: number): number {
	return mb * STORAGE_CONSTANTS.KB_PER_MB;
}

/**
 * Convert bytes to MB
 * @param bytes - Bytes
 * @returns megabytes
 */
export function convertBytesToMB(bytes: number): number {
	return bytes / (STORAGE_CONSTANTS.KB_PER_MB * STORAGE_CONSTANTS.BYTES_PER_KB);
}

/**
 * Convert bytes to KB
 * @param bytes - Bytes
 * @returns kilobytes
 */
export function convertBytesToKB(bytes: number): number {
	return bytes / STORAGE_CONSTANTS.BYTES_PER_KB;
}

/**
 * Format storage size for display
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "10.5 MB", "1.2 GB")
 */
export function formatStorageSize(bytes: number): string {
	if (bytes === 0) return "0 B";
	
	const kb = bytes / STORAGE_CONSTANTS.BYTES_PER_KB;
	const mb = kb / STORAGE_CONSTANTS.KB_PER_MB;
	const gb = mb / STORAGE_CONSTANTS.MB_PER_GB;
	
	if (gb >= 1) {
		return `${gb.toFixed(2)} GB`;
	} else if (mb >= 1) {
		return `${mb.toFixed(2)} MB`;
	} else if (kb >= 1) {
		return `${kb.toFixed(2)} KB`;
	} else {
		return `${bytes} B`;
	}
}

/**
 * Get storage limit in bytes for a given plan
 * @param plan - Plan name (Free, Pro, Enterprise)
 * @returns Storage limit in bytes
 */
export function getStorageLimitBytes(plan: string | null): number {
	const limits = {
		Free: 10, // 10 MB
		Pro: 1024, // 1 GB
		Enterprise: 10240, // 10 GB
	};
	
	const planMB = limits[plan as keyof typeof limits] || limits.Free;
	return convertMBToBytes(planMB);
}

/**
 * Check if storage usage exceeds plan limit
 * @param usedBytes - Current usage in bytes
 * @param plan - Plan name
 * @returns Object with limit info and whether exceeded
 */
export function checkStorageLimit(usedBytes: number, plan: string | null) {
	const limitBytes = getStorageLimitBytes(plan);
	const usedMB = convertBytesToMB(usedBytes);
	const limitMB = convertBytesToMB(limitBytes);
	const percentage = (usedMB / limitMB) * 100;
	
	return {
		usedBytes,
		limitBytes,
		usedMB,
		limitMB,
		percentage: Math.min(percentage, 100),
		isOverLimit: usedBytes >= limitBytes,
		isNearLimit: percentage >= 80,
	};
}

/**
 * Validate file size against plan limits
 * @param fileSizeBytes - File size in bytes
 * @param currentUsageBytes - Current storage usage in bytes
 * @param plan - Plan name
 * @returns Validation result
 */
export function validateFileSize(
	fileSizeBytes: number,
	currentUsageBytes: number,
	plan: string | null
) {
	const limitBytes = getStorageLimitBytes(plan);
	const totalAfterUpload = currentUsageBytes + fileSizeBytes;
	
	return {
		allowed: totalAfterUpload <= limitBytes,
		fileSizeMB: convertBytesToMB(fileSizeBytes),
		currentUsageMB: convertBytesToMB(currentUsageBytes),
		limitMB: convertBytesToMB(limitBytes),
		remainingMB: convertBytesToMB(limitBytes - currentUsageBytes),
		wouldExceed: totalAfterUpload > limitBytes,
	};
}
