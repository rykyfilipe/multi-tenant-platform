/** @format */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ro', name: 'Română', flag: '🇷🇴' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
  ];

  // Generate PDF URL with language parameter
  useEffect(() => {
    if (isOpen && invoiceId && tenant?.id) {
      const generatePDFUrl = async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          // Generate PDF with selected language
          const response = await fetch(
            `/api/tenants/${tenant.id}/invoices/${invoiceId}/download?language=${selectedLanguage}&enhanced=true&preview=true`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to generate PDF preview (${response.status})`);
          }

          const blob = await response.blob();
          
          // Check if the response is actually a PDF
          if (blob.type !== 'application/pdf') {
            throw new Error('Invalid PDF response from server');
          }
          
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
        } catch (err) {
          console.error('Error generating PDF preview:', err);
          setError(err instanceof Error ? err.message : 'Failed to load PDF preview');
        } finally {
          setIsLoading(false);
        }
      };

      generatePDFUrl();
    }

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`${isFullscreen ? 'max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh]' : 'max-w-6xl max-h-[90vh] w-[90vw]'} p-0 overflow-hidden`}
      >
        <DialogHeader className="flex flex-row items-center justify-between p-6 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                {t('invoice.preview.title', { number: invoiceNumber })}
              </DialogTitle>
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
        </DialogHeader>

        {/* PDF Content */}
        <div className="flex-1 overflow-hidden bg-muted/20">
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
          ) : pdfUrl ? (
            <div className="h-full overflow-auto p-4">
              <div 
                className="mx-auto bg-white shadow-lg rounded-lg overflow-hidden"
                style={{ 
                  width: `${zoom}%`,
                  maxWidth: '100%',
                  transition: 'width 0.3s ease'
                }}
              >
                <iframe
                  src={pdfUrl}
                  className="w-full h-[80vh] border-0"
                  title={`Invoice ${invoiceNumber} Preview`}
                  onLoad={() => setIsLoading(false)}
                />
              </div>
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
      </DialogContent>
    </Dialog>
  );
}
