/** @format */

// PDF Template System for Professional Invoices
export interface PDFTemplate {
	id: string;
	name: string;
	description: string;
	category: 'modern' | 'classic' | 'luxury' | 'compact' | 'detailed';
	preview: string;
	features: string[];
	colors: {
		primary: string;
		secondary: string;
		accent: string;
		text: string;
		background: string;
	};
	fonts: {
		header: string;
		body: string;
		monospace: string;
	};
	layout: {
		headerHeight: number;
		footerHeight: number;
		sidebarWidth: number;
		margins: {
			top: number;
			right: number;
			bottom: number;
			left: number;
		};
	};
}

export const PDF_TEMPLATES: PDFTemplate[] = [
	{
		id: 'modern',
		name: 'Modern',
		description: 'Clean and minimalist design with modern typography',
		category: 'modern',
		preview: '/templates/modern-preview.png',
		features: [
			'Clean typography',
			'Minimalist layout',
			'Modern color scheme',
			'Responsive design',
			'Professional appearance'
		],
		colors: {
			primary: '#2563eb',
			secondary: '#64748b',
			accent: '#0ea5e9',
			text: '#1e293b',
			background: '#ffffff'
		},
		fonts: {
			header: 'Helvetica-Bold',
			body: 'Helvetica',
			monospace: 'Courier'
		},
		layout: {
			headerHeight: 120,
			footerHeight: 80,
			sidebarWidth: 0,
			margins: {
				top: 40,
				right: 40,
				bottom: 40,
				left: 40
			}
		}
	},
	{
		id: 'classic',
		name: 'Classic',
		description: 'Traditional business style with formal layout',
		category: 'classic',
		preview: '/templates/classic-preview.png',
		features: [
			'Traditional business style',
			'Formal layout',
			'Professional typography',
			'Classic color scheme',
			'Corporate appearance'
		],
		colors: {
			primary: '#1f2937',
			secondary: '#6b7280',
			accent: '#dc2626',
			text: '#111827',
			background: '#ffffff'
		},
		fonts: {
			header: 'Times-Bold',
			body: 'Times-Roman',
			monospace: 'Courier'
		},
		layout: {
			headerHeight: 140,
			footerHeight: 100,
			sidebarWidth: 0,
			margins: {
				top: 50,
				right: 50,
				bottom: 50,
				left: 50
			}
		}
	},
	{
		id: 'luxury',
		name: 'Luxury',
		description: 'Premium design with elegant accents and sophisticated layout',
		category: 'luxury',
		preview: '/templates/luxury-preview.png',
		features: [
			'Premium design',
			'Elegant accents',
			'Sophisticated layout',
			'Luxury color scheme',
			'High-end appearance'
		],
		colors: {
			primary: '#7c3aed',
			secondary: '#a78bfa',
			accent: '#f59e0b',
			text: '#1f2937',
			background: '#fefefe'
		},
		fonts: {
			header: 'Helvetica-Bold',
			body: 'Helvetica',
			monospace: 'Courier-Bold'
		},
		layout: {
			headerHeight: 160,
			footerHeight: 120,
			sidebarWidth: 0,
			margins: {
				top: 60,
				right: 60,
				bottom: 60,
				left: 60
			}
		}
	},
	{
		id: 'compact',
		name: 'Compact',
		description: 'Space-efficient design for short invoices',
		category: 'compact',
		preview: '/templates/compact-preview.png',
		features: [
			'Space-efficient design',
			'Compact layout',
			'Essential information only',
			'Quick generation',
			'Mobile-friendly'
		],
		colors: {
			primary: '#059669',
			secondary: '#6b7280',
			accent: '#10b981',
			text: '#374151',
			background: '#ffffff'
		},
		fonts: {
			header: 'Helvetica-Bold',
			body: 'Helvetica',
			monospace: 'Courier'
		},
		layout: {
			headerHeight: 80,
			footerHeight: 60,
			sidebarWidth: 0,
			margins: {
				top: 30,
				right: 30,
				bottom: 30,
				left: 30
			}
		}
	},
	{
		id: 'detailed',
		name: 'Detailed',
		description: 'Comprehensive layout for complex invoices with extensive information',
		category: 'detailed',
		preview: '/templates/detailed-preview.png',
		features: [
			'Comprehensive layout',
			'Detailed information',
			'Multiple sections',
			'Professional appearance',
			'Full documentation'
		],
		colors: {
			primary: '#1e40af',
			secondary: '#64748b',
			accent: '#3b82f6',
			text: '#1e293b',
			background: '#ffffff'
		},
		fonts: {
			header: 'Helvetica-Bold',
			body: 'Helvetica',
			monospace: 'Courier'
		},
		layout: {
			headerHeight: 180,
			footerHeight: 140,
			sidebarWidth: 200,
			margins: {
				top: 50,
				right: 50,
				bottom: 50,
				left: 50
			}
		}
	}
];

export interface PDFCustomization {
	templateId: string;
	colors: {
		primary: string;
		secondary: string;
		accent: string;
		text: string;
		background: string;
	};
	fonts: {
		header: string;
		body: string;
		monospace: string;
	};
	layout: {
		headerHeight: number;
		footerHeight: number;
		sidebarWidth: number;
		margins: {
			top: number;
			right: number;
			bottom: number;
			left: number;
		};
	};
	branding: {
		logoUrl?: string;
		logoPosition: 'left' | 'center' | 'right';
		logoSize: 'small' | 'medium' | 'large';
		showCompanyInfo: boolean;
		showContactInfo: boolean;
	};
	features: {
		showQRCode: boolean;
		showBarcode: boolean;
		showWatermark: boolean;
		watermarkText?: string;
		watermarkOpacity: number;
		showPageNumbers: boolean;
		showDigitalSignature: boolean;
		signatureImage?: string;
	};
	language: string;
	currency: string;
}

export const DEFAULT_PDF_CUSTOMIZATION: PDFCustomization = {
	templateId: 'modern',
	colors: {
		primary: '#2563eb',
		secondary: '#64748b',
		accent: '#0ea5e9',
		text: '#1e293b',
		background: '#ffffff'
	},
	fonts: {
		header: 'Helvetica-Bold',
		body: 'Helvetica',
		monospace: 'Courier'
	},
	layout: {
		headerHeight: 120,
		footerHeight: 80,
		sidebarWidth: 0,
		margins: {
			top: 40,
			right: 40,
			bottom: 40,
			left: 40
		}
	},
	branding: {
		logoPosition: 'left',
		logoSize: 'medium',
		showCompanyInfo: true,
		showContactInfo: true
	},
	features: {
		showQRCode: true,
		showBarcode: false,
		showWatermark: false,
		watermarkOpacity: 0.3,
		showPageNumbers: true,
		showDigitalSignature: false
	},
	language: 'en',
	currency: 'USD'
};

export function getTemplateById(id: string): PDFTemplate | undefined {
	return PDF_TEMPLATES.find(template => template.id === id);
}

export function getTemplatesByCategory(category: string): PDFTemplate[] {
	return PDF_TEMPLATES.filter(template => template.category === category);
}

export function getAllTemplates(): PDFTemplate[] {
	return PDF_TEMPLATES;
}
