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
	{
		languageOptions: {
			parserOptions: {
				project: "./tsconfig.json",
				tsconfigRootDir: __dirname,
			},
		},
		rules: {
			// PHASE 1: Critical Security and Performance Rules
			"@typescript-eslint/no-explicit-any": "warn", // Allow any but warn
			"@typescript-eslint/no-unused-vars": "warn", // Warn about unused vars
			"no-console": "warn", // Warn about console statements
			"no-debugger": "error", // Error on debugger statements
			"no-alert": "warn", // Warn about alert statements
			"no-eval": "error", // Error on eval usage
			"no-implied-eval": "error", // Error on implied eval
			"no-new-func": "error", // Error on Function constructor
			
			// PHASE 1: React Security Rules
			"react/no-danger": "warn", // Warn about dangerouslySetInnerHTML
			"react/jsx-no-target-blank": "error", // Error on target="_blank" without rel
			"react/no-unescaped-entities": "warn", // Warn about unescaped entities
			
			// PHASE 1: Basic Code Quality
			"prefer-const": "warn", // Warn about let that could be const
			"no-var": "error", // Error on var usage
			"no-duplicate-imports": "error", // Error on duplicate imports
			"no-unused-expressions": "warn", // Warn about unused expressions
			
			// PHASE 1: TypeScript Critical Rules
			"@typescript-eslint/no-non-null-assertion": "warn", // Warn about non-null assertions
			// Note: prefer-nullish-coalescing and prefer-optional-chain require type info - enable in Phase 2
			
			// PHASE 1: Next.js Specific
			"@next/next/no-img-element": "warn", // Warn about img instead of Image
			"@next/next/no-html-link-for-pages": "error", // Error on html links to pages
			
			// PHASE 1: Disable Style Rules (to be enabled in Phase 2)
			"indent": "off",
			"quotes": "off",
			"semi": "off",
			"comma-dangle": "off",
			"object-curly-spacing": "off",
			"array-bracket-spacing": "off",
			"space-before-function-paren": "off",
			"space-before-blocks": "off",
			"keyword-spacing": "off",
			"space-infix-ops": "off",
			"space-unary-ops": "off",
			"spaced-comment": "off",
			"template-curly-spacing": "off",
			"arrow-spacing": "off",
			"block-spacing": "off",
			"brace-style": "off",
			"camelcase": "off",
			"comma-spacing": "off",
			"comma-style": "off",
			"computed-property-spacing": "off",
			"consistent-this": "off",
			"func-call-spacing": "off",
			"func-name-matching": "off",
			"func-names": "off",
			"func-style": "off",
			"id-blacklist": "off",
			"id-length": "off",
			"id-match": "off",
			"implicit-arrow-linebreak": "off",
			"jsx-quotes": "off",
			"key-spacing": "off",
			"line-comment-position": "off",
			"linebreak-style": "off",
			"lines-around-comment": "off",
			"lines-around-directive": "off",
			"max-depth": "off",
			"max-len": "off",
			"max-lines": "off",
			"max-nested-callbacks": "off",
			"max-params": "off",
			"max-statements": "off",
			"max-statements-per-line": "off",
			"multiline-comment-style": "off",
			"new-cap": "off",
			"new-parens": "off",
			"newline-after-var": "off",
			"newline-before-return": "off",
			"newline-per-chained-call": "off",
			"no-array-constructor": "off",
			"no-bitwise": "off",
			"no-continue": "off",
			"no-inline-comments": "off",
			"no-lonely-if": "off",
			"no-mixed-operators": "off",
			"no-mixed-requires": "off",
			"no-multi-assign": "off",
			"no-multiple-empty-lines": "off",
			"no-negated-condition": "off",
			"no-nested-ternary": "off",
			"no-new-object": "off",
			"no-plusplus": "off",
			"no-restricted-globals": "off",
			"no-restricted-imports": "off",
			"no-restricted-modules": "off",
			"no-restricted-properties": "off",
			"no-restricted-syntax": "off",
			"no-tabs": "off",
			"no-ternary": "off",
			"no-trailing-spaces": "off",
			"no-underscore-dangle": "off",
			"no-unneeded-ternary": "off",
			"no-whitespace-before-property": "off",
			"nonblock-statement-body-position": "off",
			"object-curly-newline": "off",
			"object-property-newline": "off",
			"one-var": "off",
			"one-var-declaration-per-line": "off",
			"operator-assignment": "off",
			"operator-linebreak": "off",
			"padded-blocks": "off",
			"padding-line-between-statements": "off",
			"prefer-object-spread": "off",
			"quote-props": "off",
			"require-jsdoc": "off",
			"semi-spacing": "off",
			"semi-style": "off",
			"sort-keys": "off",
			"sort-vars": "off",
			"space-before-blocks": "off",
			"space-in-parens": "off",
			"space-infix-ops": "off",
			"space-unary-ops": "off",
			"spaced-comment": "off",
			"switch-colon-spacing": "off",
			"template-tag-spacing": "off",
			"unicode-bom": "off",
			"wrap-regex": "off",
			
			// PHASE 1: Disable React Style Rules
			"react/jsx-key": "off",
			"react/jsx-no-undef": "off",
			"react/jsx-uses-react": "off",
			"react/jsx-uses-vars": "off",
			"react/no-array-index-key": "off",
			"react/no-children-prop": "off",
			"react/no-deprecated": "off",
			"react/no-direct-mutation-state": "off",
			"react/no-find-dom-node": "off",
			"react/no-is-mounted": "off",
			"react/no-render-return-value": "off",
			"react/no-string-refs": "off",
			"react/no-unknown-property": "off",
			"react/prop-types": "off",
			"react/react-in-jsx-scope": "off",
			"react/self-closing-comp": "off",
			"react/sort-comp": "off",
		},
	},
];

export default eslintConfig;