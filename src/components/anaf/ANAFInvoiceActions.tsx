/** @format */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Send, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  MoreVertical,
  Loader2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { ANAFSubmissionStatus } from '@/lib/anaf/types';

interface ANAFInvoiceActionsProps {
  invoiceId: number;
  invoiceNumber: string;
  currentStatus?: ANAFSubmissionStatus;
  onStatusChange?: (status: ANAFSubmissionStatus) => void;
  onSendToANAF?: (invoiceId: number, submissionType: 'manual') => Promise<void>;
  onCheckStatus?: (invoiceId: number) => Promise<void>;
  onDownloadResponse?: (invoiceId: number) => Promise<void>;
  isAuthenticated?: boolean;
  isLoading?: boolean;
}

export function ANAFInvoiceActions({
  invoiceId,
  invoiceNumber,
  currentStatus,
  onStatusChange,
  onSendToANAF,
  onCheckStatus,
  onDownloadResponse,
  isAuthenticated = false,
  isLoading = false
}: ANAFInvoiceActionsProps) {
  const { t } = useLanguage();
  const { token, tenant } = useApp();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);

  const handleSendToANAF = async () => {
    if (!onSendToANAF) {
      console.log('Send to ANAF not implemented');
      return;
    }
    
    try {
      setIsActionLoading(true);
      await onSendToANAF(invoiceId, 'manual');
      setShowSendDialog(false);
    } catch (error) {
      console.error('Error sending to ANAF:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!onCheckStatus) {
      console.log('Check status not implemented');
      return;
    }
    
    try {
      setIsActionLoading(true);
      await onCheckStatus(invoiceId);
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDownloadResponse = async () => {
    if (!onDownloadResponse) {
      console.log('Download response not implemented');
      return;
    }
    
    try {
      setIsActionLoading(true);
      await onDownloadResponse(invoiceId);
    } catch (error) {
      console.error('Error downloading response:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusBadge = (status?: ANAFSubmissionStatus) => {
    if (!status) return null;

    const statusConfig = {
      pending: { 
        variant: 'secondary' as const, 
        icon: Clock, 
        text: t('anaf.status.pending') 
      },
      processing: { 
        variant: 'default' as const, 
        icon: RefreshCw, 
        text: t('anaf.status.processing') 
      },
      accepted: { 
        variant: 'default' as const, 
        icon: CheckCircle, 
        text: t('anaf.status.accepted') 
      },
      rejected: { 
        variant: 'destructive' as const, 
        icon: XCircle, 
        text: t('anaf.status.rejected') 
      },
      error: { 
        variant: 'destructive' as const, 
        icon: AlertTriangle, 
        text: t('anaf.status.error') 
      },
      timeout: { 
        variant: 'destructive' as const, 
        icon: AlertTriangle, 
        text: t('anaf.status.timeout') 
      },
    };

    const config = statusConfig[status];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const canSend = isAuthenticated && (!currentStatus || currentStatus === 'error' || currentStatus === 'timeout');
  const canCheckStatus = isAuthenticated && currentStatus && currentStatus !== 'error' && currentStatus !== 'timeout';
  const canDownload = isAuthenticated && currentStatus === 'accepted';

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-muted-foreground">
          {t('anaf.actions.not_authenticated')}
        </Badge>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Status Badge */}
        {getStatusBadge(currentStatus)}

        {/* Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading || isActionLoading}
            >
              {isActionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreVertical className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canSend && (
              <DropdownMenuItem onClick={() => setShowSendDialog(true)}>
                <Send className="h-4 w-4 mr-2" />
                {t('anaf.actions.send_to_anaf')}
              </DropdownMenuItem>
            )}
            
            {canCheckStatus && (
              <DropdownMenuItem onClick={handleCheckStatus}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('anaf.actions.check_status')}
              </DropdownMenuItem>
            )}
            
            {canDownload && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDownloadResponse}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('anaf.actions.download_response')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Send to ANAF Confirmation Dialog */}
      <AlertDialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('anaf.dialogs.send_title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('anaf.dialogs.send_description', { invoiceNumber })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('anaf.dialogs.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSendToANAF}>
              {isActionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('anaf.dialogs.sending')}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t('anaf.dialogs.send')}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
