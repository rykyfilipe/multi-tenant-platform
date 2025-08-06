/** @format */

import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Next.js router
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		prefetch: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		refresh: vi.fn(),
	}),
	useSearchParams: () => new URLSearchParams(),
	usePathname: () => "/",
}));

// Mock Next.js image
vi.mock("next/image", () => ({
	default: ({ src, alt, ...props }: any) => {
		// eslint-disable-next-line @next/next/no-img-element
		return <img src={src} alt={alt} {...props} />;
	},
}));

// Mock Next.js link
vi.mock("next/link", () => ({
	default: ({ children, href, ...props }: any) => {
		return (
			<a href={href} {...props}>
				{children}
			</a>
		);
	},
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
		button: ({ children, ...props }: any) => (
			<button {...props}>{children}</button>
		),
		span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
	},
	AnimatePresence: ({ children }: any) => children,
}));

// Mock recharts
vi.mock("recharts", () => ({
	LineChart: ({ children }: any) => (
		<div data-testid='line-chart'>{children}</div>
	),
	Line: () => <div data-testid='line' />,
	XAxis: () => <div data-testid='x-axis' />,
	YAxis: () => <div data-testid='y-axis' />,
	CartesianGrid: () => <div data-testid='cartesian-grid' />,
	Tooltip: () => <div data-testid='tooltip' />,
	ResponsiveContainer: ({ children }: any) => (
		<div data-testid='responsive-container'>{children}</div>
	),
	BarChart: ({ children }: any) => (
		<div data-testid='bar-chart'>{children}</div>
	),
	Bar: () => <div data-testid='bar' />,
	PieChart: ({ children }: any) => (
		<div data-testid='pie-chart'>{children}</div>
	),
	Pie: () => <div data-testid='pie' />,
	Cell: () => <div data-testid='cell' />,
}));

// Mock @vercel/analytics
vi.mock("@vercel/analytics", () => ({
	Analytics: () => null,
	track: vi.fn(),
}));

// Mock react-hook-form
vi.mock("react-hook-form", () => ({
	useForm: () => ({
		register: vi.fn(),
		handleSubmit: vi.fn((fn) => fn),
		formState: { errors: {} },
		watch: vi.fn(),
		setValue: vi.fn(),
		reset: vi.fn(),
		control: {},
	}),
	Controller: ({ render }: any) =>
		render({ field: { onChange: vi.fn(), value: "" } }),
}));

// Mock next-auth
vi.mock("next-auth/react", () => ({
	useSession: () => ({
		data: null,
		status: "unauthenticated",
	}),
	signIn: vi.fn(),
	signOut: vi.fn(),
}));

// Mock stripe
vi.mock("@stripe/stripe-js", () => ({
	loadStripe: vi.fn(() =>
		Promise.resolve({
			redirectToCheckout: vi.fn(),
			createPortal: vi.fn(),
		}),
	),
}));

// Mock @radix-ui/react-slot
vi.mock("@radix-ui/react-slot", () => ({
	Slot: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

// Mock class-variance-authority
vi.mock("class-variance-authority", () => ({
	cva: vi.fn(() => "mock-classes"),
}));

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

global.matchMedia = vi.fn().mockImplementation((query) => ({
	matches: false,
	media: query,
	onchange: null,
	addListener: vi.fn(),
	removeListener: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	dispatchEvent: vi.fn(),
}));
