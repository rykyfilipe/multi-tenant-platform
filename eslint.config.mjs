/** @format */

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
});

const eslintConfig = [
	{
		ignores: [
			// Dependencies
			"node_modules/",
			".next/",
			"out/",
			"build/",
			"dist/",
			// Minified files
			"**/*.min.js",
			"**/*.bundle.js",
			// Generated files
			".next/",
			"coverage/",
			// Generated Prisma files
			"src/generated/**",
			"prisma/generated/**",
			// Other generated files
			"**/*.generated.*",
			"**/*.gen.*",
		],
	},
	...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
