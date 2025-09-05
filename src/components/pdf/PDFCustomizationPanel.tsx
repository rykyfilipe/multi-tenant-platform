/** @format */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
	Palette, 
	Type, 
	Layout, 
	Settings, 
	Eye, 
	Download, 
	QrCode, 
	Barcode, 
	Water, 
	Signature,
	FileText
} from "lucide-react";
import { PDFCustomization, DEFAULT_PDF_CUSTOMIZATION, getTemplateById } from "@/lib/pdf-templates";
import { useLanguage } from "@/contexts/LanguageContext";

interface PDFCustomizationPanelProps {
	templateId: string;
	customization: PDFCustomization;
	onCustomizationChange: (customization: PDFCustomization) => void;
	onPreview: () => void;
	onSave: () => void;
	onReset: () => void;
}

export function PDFCustomizationPanel({
	templateId,
	customization,
	onCustomizationChange,
	onPreview,
	onSave,
	onReset,
}: PDFCustomizationPanelProps) {
	const { t } = useLanguage();
	const [activeTab, setActiveTab] = useState("colors");

	const template = getTemplateById(templateId);

	const updateCustomization = (updates: Partial<PDFCustomization>) => {
		onCustomizationChange({
			...customization,
			...updates
		});
	};

	const updateColors = (colorKey: keyof PDFCustomization['colors'], value: string) => {
		updateCustomization({
			colors: {
				...customization.colors,
				[colorKey]: value
			}
		});
	};

	const updateFonts = (fontKey: keyof PDFCustomization['fonts'], value: string) => {
		updateCustomization({
			fonts: {
				...customization.fonts,
				[fontKey]: value
			}
		});
	};

	const updateLayout = (layoutKey: keyof PDFCustomization['layout'], value: any) => {
		updateCustomization({
			layout: {
				...customization.layout,
				[layoutKey]: value
			}
		});
	};

	const updateBranding = (brandingKey: keyof PDFCustomization['branding'], value: any) => {
		updateCustomization({
			branding: {
				...customization.branding,
				[brandingKey]: value
			}
		});
	};

	const updateFeatures = (featureKey: keyof PDFCustomization['features'], value: any) => {
		updateCustomization({
			features: {
				...customization.features,
				[featureKey]: value
			}
		});
	};

	const fontOptions = [
		{ value: 'Helvetica', label: 'Helvetica' },
		{ value: 'Helvetica-Bold', label: 'Helvetica Bold' },
		{ value: 'Times-Roman', label: 'Times Roman' },
		{ value: 'Times-Bold', label: 'Times Bold' },
		{ value: 'Courier', label: 'Courier' },
		{ value: 'Courier-Bold', label: 'Courier Bold' },
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-foreground">
						{t("pdf.customization.title")}
					</h2>
					<p className="text-muted-foreground">
						{t("pdf.customization.description")}
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={onReset}>
						{t("common.reset")}
					</Button>
					<Button variant="outline" onClick={onPreview}>
						<Eye className="w-4 h-4 mr-2" />
						{t("common.preview")}
					</Button>
					<Button onClick={onSave}>
						<Download className="w-4 h-4 mr-2" />
						{t("common.save")}
					</Button>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full grid-cols-5">
					<TabsTrigger value="colors" className="flex items-center gap-2">
						<Palette className="w-4 h-4" />
						{t("pdf.customization.tabs.colors")}
					</TabsTrigger>
					<TabsTrigger value="fonts" className="flex items-center gap-2">
						<Type className="w-4 h-4" />
						{t("pdf.customization.tabs.fonts")}
					</TabsTrigger>
					<TabsTrigger value="layout" className="flex items-center gap-2">
						<Layout className="w-4 h-4" />
						{t("pdf.customization.tabs.layout")}
					</TabsTrigger>
					<TabsTrigger value="branding" className="flex items-center gap-2">
						<Settings className="w-4 h-4" />
						{t("pdf.customization.tabs.branding")}
					</TabsTrigger>
					<TabsTrigger value="features" className="flex items-center gap-2">
						<FileText className="w-4 h-4" />
						{t("pdf.customization.tabs.features")}
					</TabsTrigger>
				</TabsList>

				{/* Colors Tab */}
				<TabsContent value="colors" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Palette className="w-5 h-5" />
								{t("pdf.customization.colors.title")}
							</CardTitle>
							<CardDescription>
								{t("pdf.customization.colors.description")}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{Object.entries(customization.colors).map(([key, value]) => (
									<div key={key} className="space-y-2">
										<Label htmlFor={`color-${key}`} className="capitalize">
											{key.replace(/([A-Z])/g, ' $1').trim()}
										</Label>
										<div className="flex items-center gap-2">
											<Input
												id={`color-${key}`}
												type="color"
												value={value}
												onChange={(e) => updateColors(key as keyof PDFCustomization['colors'], e.target.value)}
												className="w-16 h-10 p-1 border rounded"
											/>
											<Input
												value={value}
												onChange={(e) => updateColors(key as keyof PDFCustomization['colors'], e.target.value)}
												className="flex-1"
											/>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Fonts Tab */}
				<TabsContent value="fonts" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Type className="w-5 h-5" />
								{t("pdf.customization.fonts.title")}
							</CardTitle>
							<CardDescription>
								{t("pdf.customization.fonts.description")}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{Object.entries(customization.fonts).map(([key, value]) => (
									<div key={key} className="space-y-2">
										<Label htmlFor={`font-${key}`} className="capitalize">
											{key.replace(/([A-Z])/g, ' $1').trim()}
										</Label>
										<Select
											value={value}
											onValueChange={(newValue) => updateFonts(key as keyof PDFCustomization['fonts'], newValue)}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{fontOptions.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Layout Tab */}
				<TabsContent value="layout" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Layout className="w-5 h-5" />
								{t("pdf.customization.layout.title")}
							</CardTitle>
							<CardDescription>
								{t("pdf.customization.layout.description")}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Header Height */}
							<div className="space-y-2">
								<Label>Header Height: {customization.layout.headerHeight}px</Label>
								<Slider
									value={[customization.layout.headerHeight]}
									onValueChange={([value]) => updateLayout('headerHeight', value)}
									min={60}
									max={200}
									step={10}
									className="w-full"
								/>
							</div>

							{/* Footer Height */}
							<div className="space-y-2">
								<Label>Footer Height: {customization.layout.footerHeight}px</Label>
								<Slider
									value={[customization.layout.footerHeight]}
									onValueChange={([value]) => updateLayout('footerHeight', value)}
									min={40}
									max={150}
									step={10}
									className="w-full"
								/>
							</div>

							{/* Sidebar Width */}
							<div className="space-y-2">
								<Label>Sidebar Width: {customization.layout.sidebarWidth}px</Label>
								<Slider
									value={[customization.layout.sidebarWidth]}
									onValueChange={([value]) => updateLayout('sidebarWidth', value)}
									min={0}
									max={300}
									step={20}
									className="w-full"
								/>
							</div>

							{/* Margins */}
							<div className="space-y-4">
								<h4 className="font-medium">Margins</h4>
								<div className="grid grid-cols-2 gap-4">
									{Object.entries(customization.layout.margins).map(([key, value]) => (
										<div key={key} className="space-y-2">
											<Label className="capitalize">
												{key}: {value}px
											</Label>
											<Slider
												value={[value]}
												onValueChange={([newValue]) => 
													updateLayout('margins', {
														...customization.layout.margins,
														[key]: newValue
													})
												}
												min={20}
												max={100}
												step={5}
												className="w-full"
											/>
										</div>
									))}
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Branding Tab */}
				<TabsContent value="branding" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Settings className="w-5 h-5" />
								{t("pdf.customization.branding.title")}
							</CardTitle>
							<CardDescription>
								{t("pdf.customization.branding.description")}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Logo Position */}
							<div className="space-y-2">
								<Label>Logo Position</Label>
								<Select
									value={customization.branding.logoPosition}
									onValueChange={(value) => updateBranding('logoPosition', value)}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="left">Left</SelectItem>
										<SelectItem value="center">Center</SelectItem>
										<SelectItem value="right">Right</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Logo Size */}
							<div className="space-y-2">
								<Label>Logo Size</Label>
								<Select
									value={customization.branding.logoSize}
									onValueChange={(value) => updateBranding('logoSize', value)}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="small">Small</SelectItem>
										<SelectItem value="medium">Medium</SelectItem>
										<SelectItem value="large">Large</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Show Company Info */}
							<div className="flex items-center justify-between">
								<Label>Show Company Information</Label>
								<Switch
									checked={customization.branding.showCompanyInfo}
									onCheckedChange={(checked) => updateBranding('showCompanyInfo', checked)}
								/>
							</div>

							{/* Show Contact Info */}
							<div className="flex items-center justify-between">
								<Label>Show Contact Information</Label>
								<Switch
									checked={customization.branding.showContactInfo}
									onCheckedChange={(checked) => updateBranding('showContactInfo', checked)}
								/>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Features Tab */}
				<TabsContent value="features" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<FileText className="w-5 h-5" />
								{t("pdf.customization.features.title")}
							</CardTitle>
							<CardDescription>
								{t("pdf.customization.features.description")}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* QR Code */}
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<QrCode className="w-4 h-4" />
									<Label>QR Code</Label>
								</div>
								<Switch
									checked={customization.features.showQRCode}
									onCheckedChange={(checked) => updateFeatures('showQRCode', checked)}
								/>
							</div>

							{/* Barcode */}
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Barcode className="w-4 h-4" />
									<Label>Barcode</Label>
								</div>
								<Switch
									checked={customization.features.showBarcode}
									onCheckedChange={(checked) => updateFeatures('showBarcode', checked)}
								/>
							</div>

							{/* Watermark */}
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Water className="w-4 h-4" />
										<Label>Watermark</Label>
									</div>
									<Switch
										checked={customization.features.showWatermark}
										onCheckedChange={(checked) => updateFeatures('showWatermark', checked)}
									/>
								</div>
								
								{customization.features.showWatermark && (
									<div className="space-y-2 pl-6">
										<Label>Watermark Text</Label>
										<Input
											value={customization.features.watermarkText || ''}
											onChange={(e) => updateFeatures('watermarkText', e.target.value)}
											placeholder="DRAFT, PAID, OVERDUE, etc."
										/>
										<div className="space-y-2">
											<Label>Opacity: {Math.round(customization.features.watermarkOpacity * 100)}%</Label>
											<Slider
												value={[customization.features.watermarkOpacity]}
												onValueChange={([value]) => updateFeatures('watermarkOpacity', value)}
												min={0.1}
												max={1}
												step={0.1}
												className="w-full"
											/>
										</div>
									</div>
								)}
							</div>

							{/* Digital Signature */}
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Signature className="w-4 h-4" />
									<Label>Digital Signature</Label>
								</div>
								<Switch
									checked={customization.features.showDigitalSignature}
									onCheckedChange={(checked) => updateFeatures('showDigitalSignature', checked)}
								/>
							</div>

							{/* Page Numbers */}
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<FileText className="w-4 h-4" />
									<Label>Page Numbers</Label>
								</div>
								<Switch
									checked={customization.features.showPageNumbers}
									onCheckedChange={(checked) => updateFeatures('showPageNumbers', checked)}
								/>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
