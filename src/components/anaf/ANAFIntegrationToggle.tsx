/** @format */

import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertCircle, 
  CheckCircle, 
  ExternalLink, 
  Loader2,
  Settings,
  Shield
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';

interface ANAFIntegrationToggleProps {
  onToggle: (enabled: boolean) => void;
  isEnabled: boolean;
  isAuthenticated: boolean;
  onAuthenticate: () => void;
  onDisconnect: () => void;
  isLoading?: boolean;
}

export function ANAFIntegrationToggle({
  onToggle,
  isEnabled,
  isAuthenticated,
  onAuthenticate,
  onDisconnect,
  isLoading = false
}: ANAFIntegrationToggleProps) {
  const { t } = useLanguage();
  const { token, tenant } = useApp();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  const handleToggle = (checked: boolean) => {
    if (checked && !isAuthenticated) {
      // If trying to enable but not authenticated, show auth prompt
      onAuthenticate();
      return;
    }
    onToggle(checked);
  };

  const handleAuthenticate = async () => {
    try {
      setIsCheckingAuth(true);
      await onAuthenticate();
    } finally {
      setIsCheckingAuth(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {t('anaf.integration.title')}
              </CardTitle>
              <CardDescription>
                {t('anaf.integration.description')}
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant={isAuthenticated ? "default" : "secondary"}
            className="flex items-center gap-1"
          >
            {isAuthenticated ? (
              <>
                <CheckCircle className="h-3 w-3" />
                {t('anaf.integration.authenticated')}
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3" />
                {t('anaf.integration.not_authenticated')}
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Authentication Status */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {t('anaf.integration.authentication_status')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onDisconnect}
                disabled={isLoading}
              >
                {t('anaf.integration.disconnect')}
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleAuthenticate}
                disabled={isLoading || isCheckingAuth}
              >
                {isCheckingAuth ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('anaf.integration.connecting')}
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t('anaf.integration.connect')}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Auto-submit Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="anaf-auto-submit" className="text-sm font-medium">
              {t('anaf.integration.auto_submit_title')}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t('anaf.integration.auto_submit_description')}
            </p>
          </div>
          <Switch
            id="anaf-auto-submit"
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={!isAuthenticated || isLoading}
          />
        </div>

        {/* Features List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            {t('anaf.integration.features_title')}
          </h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              {t('anaf.integration.feature_oauth')}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              {t('anaf.integration.feature_digital_signature')}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              {t('anaf.integration.feature_xml_generation')}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              {t('anaf.integration.feature_status_tracking')}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              {t('anaf.integration.feature_response_download')}
            </li>
          </ul>
        </div>

        {/* Warning for unauthenticated users */}
        {!isAuthenticated && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">
                  {t('anaf.integration.auth_required_title')}
                </p>
                <p className="text-amber-700 mt-1">
                  {t('anaf.integration.auth_required_description')}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
