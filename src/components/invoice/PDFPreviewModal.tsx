/** @format */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, 
  X, 
  Eye, 
  FileText, 
  Globe, 
  Loader2,
  Maximize2,
  Minimize2,
  RotateCw,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { InvoiceHTMLPreview } from './InvoiceHTMLPreview';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: number;
  invoiceNumber: string;
  onDownload?: (invoiceId: number, invoiceNumber: string, language?: string) => void;
}

export function PDFPreviewModal({ 
  isOpen, 
  onClose, 
  invoiceId, 
  invoiceNumber, 
  onDownload 
}: PDFPreviewModalProps) {
  const { t } = useLanguage();
  const { token, tenant } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [tenantBranding, setTenantBranding] = useState<any>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [zoom, setZoom] = useState(100);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ro', name: 'Română', flag: '🇷🇴' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
  ];

  // Fetch invoice data for HTML preview
  useEffect(() => {
    if (isOpen && invoiceId && tenant?.id) {
      const fetchInvoiceData = async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          // Fetch invoice data
          const response = await fetch(
            `/api/tenants/${tenant.id}/invoices/${invoiceId}?language=${selectedLanguage}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to fetch invoice data (${response.status})`);
          }

          const data = await response.json();
          // Transform the data to match our component interface
          const transformedData = {
            invoice: data.invoice,
            customer: data.customer,
            items: data.items.map((item: any) => ({
              product_name: item.product_name || 'Product',
              description: item.description || item.product_description || '',
              quantity: Number(item.quantity) || 0,
              unit_price: Number(item.price) || 0,
              total: Number(item.quantity) * Number(item.price) || 0,
              vat_rate: Number(item.product_vat) || 0
            })),
            totals: {
              subtotal: data.totals.subtotal || 0,
              vatTotal: data.totals.vat_total || 0,
              grandTotal: data.totals.grand_total || 0
            }
          };
          setInvoiceData(transformedData);
          
          // Fetch tenant branding
          const brandingResponse = await fetch(
            `/api/tenants/${tenant.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          
          if (brandingResponse.ok) {
            const brandingData = await brandingResponse.json();
            setTenantBranding(brandingData);
          }
          
          // Set basic translations
          setTranslations({
            invoice: 'Invoice',
            invoiceNumber: 'Invoice #',
            company: 'From',
            customer: 'Bill To',
            date: 'Invoice Date',
            dueDate: 'Due Date',
            paymentTerms: 'Payment Terms',
            item: 'Item',
            description: 'Description',
            quantity: 'Qty',
            unitPrice: 'Unit Price',
            total: 'Total',
            subtotal: 'Subtotal',
            tax: 'VAT',
            grandTotal: 'Total',
            thankYou: 'Thank you for your business!',
            download: 'Download PDF'
          });
          
        } catch (err) {
          console.error('Error fetching invoice data:', err);
          setError(err instanceof Error ? err.message : 'Failed to load invoice data');
        } finally {
          setIsLoading(false);
        }
      };

      fetchInvoiceData();
    }
  }, [isOpen, invoiceId, tenant?.id, selectedLanguage, token]);

  const handleDownload = () => {
    if (onDownload) {
      onDownload(invoiceId, invoiceNumber, selectedLanguage);
    }
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(Math.max(25, Math.min(200, newZoom)));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const resetZoom = () => {
    setZoom(100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className={`relative bg-background border rounded-lg shadow-2xl overflow-hidden ${
          isFullscreen 
            ? 'w-[98vw] h-[98vh] max-w-[98vw] max-h-[98vh]' 
            : 'w-[95vw] h-[95vh] max-w-[95vw] max-h-[95vh]'
        }`}
      >
        {/* Header */}
        <div className="flex flex-row items-center justify-between p-6 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {t('invoice.preview.title', { number: invoiceNumber })}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('invoice.preview.subtitle')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-32 h-9">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleZoomChange(zoom - 25)}
                disabled={zoom <= 25}
                className="h-7 w-7 p-0"
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetZoom}
                className="h-7 px-2 text-xs"
              >
                {zoom}%
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleZoomChange(zoom + 25)}
                disabled={zoom >= 200}
                className="h-7 w-7 p-0"
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="h-9"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="h-9"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('invoice.preview.download')}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-9 w-9 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-hidden bg-muted/20" style={{ height: 'calc(100% - 140px)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t('invoice.preview.loading')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('invoice.preview.generating', { language: languages.find(l => l.code === selectedLanguage)?.name })}
                  </p>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <div className="p-4 bg-destructive/10 rounded-full w-fit mx-auto">
                  <FileText className="h-8 w-8 text-destructive" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">{t('invoice.preview.error')}</p>
                  <p className="text-xs text-muted-foreground">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="mt-2"
                  >
                    <RotateCw className="h-4 w-4 mr-2" />
                    {t('invoice.preview.retry')}
                  </Button>
                </div>
              </div>
            </div>
          ) : invoiceData && tenantBranding ? (
            <div className="h-full overflow-auto p-2">
              <InvoiceHTMLPreview
                invoiceData={invoiceData}
                tenantBranding={tenantBranding}
                translations={translations}
                zoom={zoom}
                onDownload={handleDownload}
              />
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t bg-muted/30 p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-xs">
                {t('invoice.preview.language')}: {languages.find(l => l.code === selectedLanguage)?.name}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {t('invoice.preview.zoom')}: {zoom}%
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-3 w-3" />
              <span>{t('invoice.preview.previewMode')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
