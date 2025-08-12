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

module.exports = {
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: securityHeaders,
			},
		];
	},
	// Enforce HTTPS in production
	...(process.env.NODE_ENV === "production" && {
		experimental: {
			forceSwcTransforms: true,
		},
	}),
	// Webpack configuration to fix Windows permission issues
	webpack: (config: any, { isServer }: { isServer: boolean }) => {
		// Exclude problematic Windows directories
		config.watchOptions = {
			poll: 1000,
			aggregateTimeout: 300,
			ignored: [
				'**/node_modules',
				'**/.git',
				'**/dist',
				'**/build',
				'**/.next',
				'**/C:/Users/**/Cookies',
				'**/C:/Users/**/Application Data',
				'**/C:/Users/**/Local Settings',
				'**/C:/Users/**/AppData',
			],
		};
		
		return config;
	},
};
