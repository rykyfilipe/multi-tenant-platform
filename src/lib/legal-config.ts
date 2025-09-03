/** @format */

// Legal Documents Configuration
// Update this file with your company information to automatically populate all legal documents
export const legalConfig = {
	// Company Information
	company: {
		name: "YDV - Your Data Your View",
		legalName: "YDV - Your Data Your View SRL",
		website: "https://ydv.digital",
		email: {
			legal: "legal@ydv.digital",
			support: "support@ydv.digital",
			privacy: "privacy@ydv.digital",
			general: "contact@ydv.digital",
			billing: "billing@ydv.digital",
			security: "security@ydv.digital",
			compliance: "compliance@ydv.digital",
			abuse: "abuse@ydv.digital",
			dpo: "dpo@ydv.digital",
			rights: "rights@ydv.digital",
			sla: "sla@ydv.digital",
			emergency: "emergency@ydv.digital",
			escalation: "escalation@ydv.digital",
		},
		phone: "+40 750 406 066",
		address: {
			street: "Strada Scolii 2",
			city: "Suceava",
			state: "Suceava",
			postalCode: "720000",
			country: "Romania",
		},
		taxId: "RO12345678", // Replace with actual CUI
		registrationNumber: "J33/123/2024", // Replace with actual registration number
		jurisdiction: "Romania",
		timezone: "EET (UTC+2) / EEST (UTC+3)",
		hostingLocation: "European Union (Google Cloud Europe-west1)",
		backupLocation: "European Union (Google Cloud Europe-west1)",
		cdnLocations: "European Union, United States, Asia Pacific",
	},

	// Legal and Compliance
	legal: {
		governingLaw: "Laws of Romania and applicable EU regulations (GDPR)",
		arbitrationOrganization: "Bucharest International Arbitration Court",
		arbitrationLocation: "Bucharest, Romania",
		dataProtectionOfficer: "YDV Data Protection Team", // Replace with actual DPO name
		representativeEU: "Not required (Company is EU-based in Romania)",
	},

	// Service Providers
	services: {
		cloudProvider: "Google Cloud (Cloud SQL, Storage, Compute Engine)",
		emailProvider:
			"SendGrid (transactional emails), Nodemailer (system emails)",
		analyticsProvider:
			"Google Analytics (Vercel Analytics), Vercel Speed Insights",
		paymentProcessor: "Stripe (subscriptions, payments, webhooks)",
		hostingProvider: "Vercel (frontend), Google Cloud (backend)",
		supportProvider: "Intercom (customer support), Built-in help system",
		monitoringProvider: "DataDog (performance monitoring), Vercel Analytics",
		authenticationProvider: "NextAuth.js (Google OAuth, credentials)",
		databaseProvider: "PostgreSQL with Prisma ORM",
		fileStorageProvider: "Cloudinary (profile images, uploads)",
		realTimeProvider: "Socket.io (real-time collaboration)",
	},

	// Business Policies
	policies: {
		refundPeriod: "30 days",
		cancellationNotice: "30 days",
		dataRetentionPeriod: "90 days after account cancellation",
		uptimeGuarantee: "99.9%",
		supportResponseTime: "24 hours during business days",
		concurrentUsers: "1000+ per tenant",
		dataVolume: "10+ million records per tenant",
		apiRateLimit: "1000 requests per minute",
		storageGrowth: "10GB per month included, additional storage billed",
		maxTablesPerDatabase: "100 tables per database",
		maxColumnsPerTable: "50 columns per table",
		maxRowsPerTable: "1 million rows per table (configurable)",
		backupFrequency: "Daily automated backups with 30-day retention",
		sslEncryption: "End-to-end encryption for all data in transit and at rest",
	},

	// Dates
	dates: {
		effectiveDate: "January 1, 2025",
		lastUpdated: "January 1, 2025",
		version: "1.0",
	},

	// Platform Specific Information
	platform: {
		serviceDescription:
			"Multi-tenant SaaS database management platform for businesses",
		mainFeatures: [
			"Create and manage custom databases and tables with flexible schemas",
			"Store, organize, and analyze business data with real-time analytics",
			"Manage user permissions and access controls at table and column level",
			"Integrate with third-party services via REST API",
			"Export and import data in various formats (CSV, JSON, Excel)",
			"Collaborate with team members on data management and visualization",
			"Build custom analytics and reports without coding",
			"Multi-tenant architecture with isolated data per organization",
			"Real-time data synchronization and collaboration",
			"Advanced filtering, sorting, and data manipulation tools",
		],
		dataTypes: [
			"Database structures and table schemas with custom column types",
			"Business records and transactional data in flexible JSON format",
			"User permissions and access controls (ADMIN, EDITOR, VIEWER roles)",
			"Custom configurations and settings per tenant",
			"Integration data with scoped permissions",
			"User profile information and authentication data",
			"Tenant-specific settings and module configurations",
			"Subscription and billing information via Stripe",
			"Data import/export history and audit logs",
			"Real-time notifications and collaboration data",
		],
	},

	// Analytics and Opt-out Links
	analytics: {
		optOutLink: "https://tools.google.com/dlpage/gaoptout",
		advertisingOptOutLink: "https://www.youronlinechoices.com",
		socialMediaOptOutLink: "https://www.facebook.com/settings?tab=ads",
	},
};

// Helper function to get formatted company address
export const getCompanyAddress = () => {
	const { address } = legalConfig.company;
	return `${address.street}, ${address.city}, ${address.state} ${address.postalCode}, ${address.country}`;
};

// Helper function to get full company name with legal name
export const getFullCompanyName = () => {
	if (legalConfig.company.legalName !== legalConfig.company.name) {
		return `${legalConfig.company.name} (${legalConfig.company.legalName})`;
	}
	return legalConfig.company.name;
};
