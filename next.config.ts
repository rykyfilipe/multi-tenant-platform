/** @format */

const securityHeaders = [
	{
		key: "Content-Security-Policy",
		value:
			"default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.stripe.com https://va.vercel-scripts.com https://vercel.live; frame-src https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;",
	},
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{ key: "X-XSS-Protection", value: "1; mode=block" },
	{
		key: "Strict-Transport-Security",
		value: "max-age=31536000; includeSubDomains; preload",
	},
	{
		key: "Permissions-Policy",
		value:
			"camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
	},
	{ key: "X-Permitted-Cross-Domain-Policies", value: "none" },
	{ key: "X-Download-Options", value: "noopen" },
	{ key: "X-DNS-Prefetch-Control", value: "off" },
];

const performanceHeaders = [
	{ key: "Cache-Control", value: "public, max-age=31536000, immutable" },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "X-XSS-Protection", value: "1; mode=block" },
];

module.exports = {
	eslint: { ignoreDuringBuilds: true },
	typescript: { ignoreBuildErrors: true },
	
	// Enhanced configuration for OAuth and HTTPS
	async redirects() {
		return [
			// Force HTTPS in production
			...(process.env.NODE_ENV === "production" ? [
				{
					source: "/(.*)",
					has: [
						{
							type: "header",
							key: "x-forwarded-proto",
							value: "http",
						},
					],
					destination: "https://:path*",
					permanent: true,
				},
			] : []),
		];
	},

	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "res.cloudinary.com",
				port: "",
				pathname: "/**",
			},
		],
		formats: ["image/webp", "image/avif"],
		minimumCacheTTL: 60 * 60 * 24 * 30,
	},

	experimental: {
		forceSwcTransforms: true,
		// NU mai include `legacyBrowsers` sau `optimizeCss`
	},

	compress: true,

	async headers() {
		return [
			{
				source: "/(.*)",
				headers: securityHeaders,
			},
			{
				source: "/_next/static/(.*)",
				headers: performanceHeaders,
			},
			{
				source: "/api/(.*)",
				headers: [
					{ key: "Cache-Control", value: "public, max-age=60, s-maxage=300" },
				],
			},
			// Enhanced headers for OAuth endpoints
			{
				source: "/api/auth/(.*)",
				headers: [
					{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
					{ key: "Pragma", value: "no-cache" },
					{ key: "Expires", value: "0" },
					// Allow cross-origin for OAuth callbacks
					{ key: "Access-Control-Allow-Origin", value: "*" },
					{ key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
					{ key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
					{ key: "Access-Control-Allow-Credentials", value: "true" },
					// Mobile-specific headers
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "X-Frame-Options", value: "SAMEORIGIN" },
					{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
				],
			},
		];
	},

	webpack: (
		config: any,
		{ isServer, dev }: { isServer: boolean; dev: boolean },
	) => {
		config.watchOptions = {
			poll: 1000,
			aggregateTimeout: 300,
			ignored: [
				"**/node_modules",
				"**/.git",
				"**/dist",
				"**/build",
				"**/.next",
			],
		};

		if (!dev && !isServer) {
			config.optimization = {
				...config.optimization,
				usedExports: true,
				sideEffects: false,
			};

			config.optimization.splitChunks = {
				chunks: "all",
				cacheGroups: {
					vendor: {
						test: /[\\/]node_modules[\\/]/,
						name: "vendors",
						priority: 10,
						enforce: true,
					},
					common: {
						name: "common",
						minChunks: 2,
						priority: 5,
						reuseExistingChunk: true,
					},
				},
			};
		}

		return config;
	},
};
