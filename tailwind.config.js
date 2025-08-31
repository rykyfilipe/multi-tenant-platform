/**
 * @format
 * @type {import('tailwindcss').Config}
 */

module.exports = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				card: "hsl(var(--card))",
				"card-foreground": "hsl(var(--card-foreground))",
				popover: "hsl(var(--popover))",
				"popover-foreground": "hsl(var(--popover-foreground))",
				primary: "hsl(var(--primary))",
				"primary-foreground": "hsl(var(--primary-foreground))",
				secondary: "hsl(var(--secondary))",
				"secondary-foreground": "hsl(var(--secondary-foreground))",
				muted: "hsl(var(--muted))",
				"muted-foreground": "hsl(var(--muted-foreground))",
				accent: "hsl(var(--accent))",
				"accent-foreground": "hsl(var(--accent-foreground))",
				destructive: "hsl(var(--destructive))",
				"destructive-foreground": "hsl(var(--destructive-foreground))",
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				chart: "hsl(var(--chart))",
				// Sidebar specific colors
				"sidebar-primary": "hsl(var(--sidebar-primary))",
				"sidebar-primary-foreground": "hsl(var(--sidebar-primary-foreground))",
				"sidebar-accent": "hsl(var(--sidebar-accent))",
				"sidebar-accent-foreground": "hsl(var(--sidebar-accent-foreground))",
				"sidebar-border": "hsl(var(--sidebar-border))",
			},
			borderRadius: {
				"2xl": "1.5rem",
				"3xl": "2rem",
			},
			animation: {
				fadeInUp: "fadeInUp 0.6s ease-out",
				slideInLeft: "slideInLeft 0.6s ease-out",
				scaleIn: "scaleIn 0.4s ease-out",
				glowPulse: "glowPulse 2s ease-in-out infinite",
				float: "float 3s ease-in-out infinite",
			},
			keyframes: {
				fadeInUp: {
					"0%": { opacity: "0", transform: "translateY(20px)" },
					"100%": { opacity: "1", transform: "translateY(0)" },
				},
				slideInLeft: {
					"0%": { opacity: "0", transform: "translateX(-20px)" },
					"100%": { opacity: "1", transform: "translateX(0)" },
				},
				scaleIn: {
					"0%": { opacity: "0", transform: "scale(0.9)" },
					"100%": { opacity: "1", transform: "scale(1)" },
				},
				glowPulse: {
					"0%, 100%": { boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)" },
					"50%": { boxShadow: "0 0 40px rgba(59, 130, 246, 0.8)" },
				},
				float: {
					"0%, 100%": { transform: "translateY(0px)" },
					"50%": { transform: "translateY(-10px)" },
				},
			},
			backdropBlur: {
				"2xl": "40px",
			},
			boxShadow: {
				glass:
					"0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
				neumorphic:
					"20px 20px 60px rgba(0, 0, 0, 0.1), inset 1px 1px 0 rgba(255, 255, 255, 0.8)",
				"neumorphic-dark":
					"20px 20px 60px rgba(0, 0, 0, 0.3), inset 1px 1px 0 rgba(255, 255, 255, 0.1)",
				premium:
					"0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.05)",
				"premium-hover":
					"0 25px 50px rgba(0, 0, 0, 0.15), 0 12px 24px rgba(0, 0, 0, 0.1)",
			},
		},
	},
	plugins: [],
};
