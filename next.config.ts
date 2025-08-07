/** @format */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	eslint: {
		ignoreDuringBuilds: true,
	},
	webpack: (config, { isServer }) => {
		// Avoid scanning unnecessary system directories
		config.snapshot = {
			...(config.snapshot || {}),
			managedPaths: [],
			immutablePaths: [],
		};

		// Exclude problematic system directories
		config.watchOptions = {
			...(config.watchOptions || {}),
			ignored: [
				"**/node_modules",
				"**/.git",
				"**/C:/Users/**/Application Data",
				"**/C:/Users/**/AppData",
				"**/C:/ProgramData",
			],
		};

		return config;
	},
};

export default nextConfig;
