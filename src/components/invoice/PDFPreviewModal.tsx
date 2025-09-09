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
          
          // Set translations based on selected language
          const getTranslations = (lang: string) => {
            const translations: Record<string, Record<string, string>> = {
              en: {
                invoice: 'Invoice',
                invoiceNumber: 'Invoice #',
                company: 'From',
                customer: 'Bill To',
                date: 'Date',
                dueDate: 'Due Date',
                paymentTerms: 'Payment Terms',
                item: 'Item',
                description: 'Description',
                quantity: 'Qty',
                unitPrice: 'Price',
                total: 'Total',
                subtotal: 'SUB TOTAL',
                tax: 'Tax VAT 18%',
                grandTotal: 'GRAND TOTAL',
                thankYou: 'Thank you for your business!',
                download: 'Download PDF'
              },
              ro: {
                invoice: 'Factură',
                invoiceNumber: 'Factura #',
                company: 'De la',
                customer: 'Facturat către',
                date: 'Data',
                dueDate: 'Data scadenței',
                paymentTerms: 'Termeni de plată',
                item: 'Articol',
                description: 'Descriere',
                quantity: 'Cantitate',
                unitPrice: 'Preț',
                total: 'Total',
                subtotal: 'SUBTOTAL',
                tax: 'TVA 18%',
                grandTotal: 'TOTAL GENERAL',
                thankYou: 'Vă mulțumim pentru încredere!',
                download: 'Descarcă PDF'
              },
              es: {
                invoice: 'Factura',
                invoiceNumber: 'Factura #',
                company: 'De',
                customer: 'Facturar a',
                date: 'Fecha',
                dueDate: 'Fecha de vencimiento',
                paymentTerms: 'Términos de pago',
                item: 'Artículo',
                description: 'Descripción',
                quantity: 'Cantidad',
                unitPrice: 'Precio',
                total: 'Total',
                subtotal: 'SUBTOTAL',
                tax: 'IVA 18%',
                grandTotal: 'TOTAL GENERAL',
                thankYou: '¡Gracias por su confianza!',
                download: 'Descargar PDF'
              },
              fr: {
                invoice: 'Facture',
                invoiceNumber: 'Facture #',
                company: 'De',
                customer: 'Facturer à',
                date: 'Date',
                dueDate: 'Date d\'échéance',
                paymentTerms: 'Conditions de paiement',
                item: 'Article',
                description: 'Description',
                quantity: 'Quantité',
                unitPrice: 'Prix',
                total: 'Total',
                subtotal: 'SOUS-TOTAL',
                tax: 'TVA 18%',
                grandTotal: 'TOTAL GÉNÉRAL',
                thankYou: 'Merci pour votre confiance!',
                download: 'Télécharger PDF'
              },
              de: {
                invoice: 'Rechnung',
                invoiceNumber: 'Rechnung #',
                company: 'Von',
                customer: 'Rechnung an',
                date: 'Datum',
                dueDate: 'Fälligkeitsdatum',
                paymentTerms: 'Zahlungsbedingungen',
                item: 'Artikel',
                description: 'Beschreibung',
                quantity: 'Menge',
                unitPrice: 'Preis',
                total: 'Gesamt',
                subtotal: 'ZWISCHENSUMME',
                tax: 'MwSt 18%',
                grandTotal: 'GESAMTSUMME',
                thankYou: 'Vielen Dank für Ihr Vertrauen!',
                download: 'PDF herunterladen'
              }
            };
            return translations[lang] || translations.en;
          };
          
          setTranslations(getTranslations(selectedLanguage));
          
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
            : 'w-[95vw] h-[90vh] max-w-[95vw] max-h-[90vh] min-w-[320px] min-h-[400px] sm:w-[70vw] sm:h-[80vh] sm:max-w-[70vw] sm:max-h-[80vh] sm:min-w-[600px] sm:min-h-[500px]'
        }`}
      >
        {/* Header */}
        <div className="flex flex-col gap-3 p-3 border-b bg-gradient-to-r from-primary/5 to-primary/10 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 bg-primary/10 rounded-lg sm:p-2">
              <FileText className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold truncate sm:text-xl">
                {t('invoice.preview.title', { number: invoiceNumber })}
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {t('invoice.preview.subtitle')}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            {/* Language Selector */}
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-full h-8 text-xs sm:w-32 sm:h-9 sm:text-sm">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
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
                className="h-6 w-6 p-0 sm:h-7 sm:w-7"
              >
                <ZoomOut className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetZoom}
                className="h-6 px-1.5 text-xs sm:h-7 sm:px-2"
              >
                {zoom}%
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleZoomChange(zoom + 25)}
                disabled={zoom >= 200}
                className="h-6 w-6 p-0 sm:h-7 sm:w-7"
              >
                <ZoomIn className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
              >
                {isFullscreen ? <Minimize2 className="h-3 w-3 sm:h-4 sm:w-4" /> : <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />}
                <span className="sr-only sm:not-sr-only sm:ml-2 sm:inline">
                  {isFullscreen ? 'Minimize' : 'Maximize'}
                </span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
              >
                <Download className="h-3 w-3 mr-1 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('invoice.preview.download')}</span>
                <span className="sm:hidden">PDF</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 sm:h-9 sm:w-9"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-hidden bg-muted/20" style={{ height: 'calc(100% - 120px)' }}>
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
        <div className="border-t bg-muted/30 p-2 sm:p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2 sm:gap-4">
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {t('invoice.preview.language')}: {languages.find(l => l.code === selectedLanguage)?.name}
              </Badge>
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                {t('invoice.preview.zoom')}: {zoom}%
              </Badge>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Eye className="h-3 w-3" />
              <span className="text-xs">{t('invoice.preview.previewMode')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
