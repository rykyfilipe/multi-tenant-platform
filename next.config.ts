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
		return config;
	},
};

export default nextConfig;
