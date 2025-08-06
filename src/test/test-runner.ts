/** @format */

import { run } from "vitest/run";
import { resolve } from "path";

async function runTests() {
	try {
		const result = await run({
			root: resolve(__dirname, "../.."),
			config: resolve(__dirname, "../../vitest.config.ts"),
			coverage: {
				enabled: true,
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
			testNamePattern: "",
			run: true,
			watch: false,
			ui: false,
			open: false,
			api: false,
			mode: "run",
		});

		if (result.exitCode === 0) {
			console.log("✅ All tests passed with 100% coverage!");
			process.exit(0);
		} else {
			console.error("❌ Some tests failed or coverage is below 100%");
			process.exit(1);
		}
	} catch (error) {
		console.error("❌ Test runner failed:", error);
		process.exit(1);
	}
}

runTests();
