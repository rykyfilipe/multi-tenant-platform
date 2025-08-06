/** @format */

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./src/test/setup.tsx"],
		coverage: {
			reporter: ["text", "html", "lcov"],
			exclude: [
				"node_modules/",
				".next/",
				"tests/",
				"**/*.d.ts",
				"**/*.config.*",
				"**/coverage/**",
				"**/dist/**",
				"**/build/**",
				"**/.vercel/**",
				"**/prisma/**",
				"**/migrations/**",
			],
			include: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
			all: true,
			thresholds: {
				branches: 100,
				functions: 100,
				lines: 100,
				statements: 100,
			},
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
