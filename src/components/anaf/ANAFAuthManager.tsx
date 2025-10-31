/** @format */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  CheckCircle2,
  Shield,
  FileKey,
  ExternalLink,
  Loader2,
  Upload,
  XCircle,
  AlertTriangle,
  Lock,
  Calendar,
  User,
  Building,
  Info,
} from 'lucide-react';

interface CertificateInfo {
  isValid: boolean;
  commonName: string;
  organization: string;
  validFrom: string;
  validTo: string;
  daysUntilExpiry: number;
  issuer: string;
}

interface ANAFAuthManagerProps {
  onAuthComplete?: () => void;
}

export function ANAFAuthManager({ onAuthComplete }: ANAFAuthManagerProps) {
  // OAuth2 State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Certificate State
  const [certificateInfo, setCertificateInfo] = useState<CertificateInfo | null>(null);
  const [isLoadingCert, setIsLoadingCert] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);

  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Current tab
  const [activeTab, setActiveTab] = useState('oauth');

  // Check OAuth2 authentication status
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Load certificate info
  useEffect(() => {
    if (isAuthenticated) {
      loadCertificateInfo();
    }
  }, [isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      setIsCheckingAuth(true);
      const response = await fetch('/api/anaf/auth/status');
      
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.authenticated || false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthError('Nu s-a putut verifica statusul de autentificare');
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const loadCertificateInfo = async () => {
    try {
      setIsLoadingCert(true);
      const response = await fetch('/api/anaf/certificate/info');
      
      if (response.ok) {
        const data = await response.json();
        setCertificateInfo(data.certificate || null);
      } else if (response.status !== 404) {
        setCertError('Nu s-a putut încărca informațiile despre certificat');
      }
    } catch (error) {
      console.error('Error loading certificate:', error);
      setCertError('Eroare la încărcarea certificatului');
    } finally {
      setIsLoadingCert(false);
    }
  };

  const handleOAuthConnect = async () => {
    try {
      setAuthError(null);
      
      // Redirect to OAuth2 flow
      const response = await fetch('/api/anaf/auth/login');
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setAuthError('Nu s-a putut inițializa autentificarea');
      }
    } catch (error) {
      console.error('Error connecting to ANAF:', error);
      setAuthError('Eroare la conectarea cu ANAF');
    }
  };

  const handleOAuthDisconnect = async () => {
    try {
      setAuthError(null);
      
      const response = await fetch('/api/anaf/auth/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        setIsAuthenticated(false);
        setCertificateInfo(null);
      } else {
        setAuthError('Nu s-a putut deconecta de la ANAF');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      setAuthError('Eroare la deconectare');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
      setUploadSuccess(false);
    }
  };

  const handleCertificateUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !password) {
      setUploadError('Selectați un certificat și introduceți parola');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadSuccess(false);

      const formData = new FormData();
      formData.append('certificate', selectedFile);
      formData.append('password', password);

      const response = await fetch('/api/anaf/certificate/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Eroare la încărcarea certificatului');
      }

      setUploadSuccess(true);
      setSelectedFile(null);
      setPassword('');
      
      // Reload certificate info
      await loadCertificateInfo();
      
      // Call callback
      onAuthComplete?.();

      // Switch to certificate info tab
      setTimeout(() => {
        setActiveTab('certificate');
      }, 1000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Eroare necunoscută');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRevokeCertificate = async () => {
    if (!confirm('Sigur doriți să revocați certificatul? Va trebui să încărcați unul nou pentru a utiliza integrarea ANAF.')) {
      return;
    }

    try {
      const response = await fetch('/api/anaf/certificate/revoke', {
        method: 'POST',
      });

      if (response.ok) {
        setCertificateInfo(null);
        setActiveTab('upload');
      } else {
        setCertError('Nu s-a putut revoca certificatul');
      }
    } catch (error) {
      console.error('Error revoking certificate:', error);
      setCertError('Eroare la revocare');
    }
  };

  const isFullyConfigured = isAuthenticated && certificateInfo?.isValid;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Integrare ANAF e-Factura</CardTitle>
                <CardDescription>
                  Configurare autentificare OAuth2 și certificat digital
                </CardDescription>
              </div>
            </div>
            {isFullyConfigured ? (
              <Badge variant="default" className="flex items-center gap-1 bg-green-500 hover:bg-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Complet Configurat
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Necesită Configurare
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Configuration Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* OAuth2 Status */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isAuthenticated ? 'bg-green-500/10' : 'bg-muted'}`}>
                  <Shield className={`h-5 w-5 ${isAuthenticated ? 'text-green-600' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="font-medium text-sm">Autentificare OAuth2</p>
                  <p className="text-xs text-muted-foreground">
                    {isAuthenticated ? 'Conectat' : 'Neconectat'}
                  </p>
                </div>
              </div>
              {isAuthenticated ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {/* Certificate Status */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${certificateInfo?.isValid ? 'bg-green-500/10' : 'bg-muted'}`}>
                  <FileKey className={`h-5 w-5 ${certificateInfo?.isValid ? 'text-green-600' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="font-medium text-sm">Certificat Digital</p>
                  <p className="text-xs text-muted-foreground">
                    {certificateInfo?.isValid ? 'Activ' : 'Lipsește'}
                  </p>
                </div>
              </div>
              {certificateInfo?.isValid ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Success Message */}
          {isFullyConfigured && (
            <Alert variant="default" className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Configurarea ANAF este completă! Puteți trimite facturi către e-Factura.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="oauth" className="gap-2">
            <Shield className="h-4 w-4" />
            OAuth2
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2" disabled={!isAuthenticated}>
            <Upload className="h-4 w-4" />
            Upload Certificat
          </TabsTrigger>
          <TabsTrigger value="certificate" className="gap-2" disabled={!certificateInfo}>
            <FileKey className="h-4 w-4" />
            Info Certificat
          </TabsTrigger>
        </TabsList>

        {/* OAuth2 Tab */}
        <TabsContent value="oauth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Autentificare OAuth2</CardTitle>
              <CardDescription>
                Conectați-vă cu contul ANAF pentru accesul la serviciul e-Factura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {authError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}

              {isCheckingAuth ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : isAuthenticated ? (
                <div className="space-y-4">
                  <Alert variant="default" className="border-green-500 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Autentificat cu succes la ANAF. Acum puteți încărca certificatul digital.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">Status: Conectat</p>
                      <p className="text-sm text-muted-foreground">
                        Token-ul OAuth2 este activ
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleOAuthDisconnect}
                      disabled={isCheckingAuth}
                    >
                      Deconectare
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg space-y-2">
                    <h4 className="font-medium text-sm">Pași următori:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Accesați tab-ul "Upload Certificat"</li>
                      <li>Încărcați certificatul digital (.pfx sau .p12)</li>
                      <li>Introduceți parola certificatului</li>
                      <li>Trimiteți facturi către ANAF</li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert variant="default" className="border-blue-500 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Pentru a utiliza integrarea ANAF e-Factura, trebuie să vă autentificați cu contul SPV.
                    </AlertDescription>
                  </Alert>

                  <div className="p-4 border rounded-lg space-y-3">
                    <h4 className="font-medium">Ce este OAuth2?</h4>
                    <p className="text-sm text-muted-foreground">
                      OAuth2 este un protocol de autentificare securizat care vă permite să acordați aplicației 
                      acces la serviciul ANAF e-Factura fără a împărtăși parola.
                    </p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Securitate maximă
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Acces controlat
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Conformitate ANAF
                      </li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleOAuthConnect}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Conectare cu ANAF
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload Certificate Tab */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Încărcare Certificat Digital</CardTitle>
              <CardDescription>
                Încărcați certificatul digital PKCS#12 (.pfx sau .p12) pentru semnarea facturilor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {uploadSuccess && (
                <Alert variant="default" className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Certificatul a fost încărcat și validat cu succes!
                  </AlertDescription>
                </Alert>
              )}

              {uploadError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleCertificateUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="certificate-file">Fișier Certificat</Label>
                  <Input
                    id="certificate-file"
                    type="file"
                    accept=".pfx,.p12"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Fișiere acceptate: .pfx, .p12 (max 10MB)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certificate-password">Parola Certificatului</Label>
                  <Input
                    id="certificate-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Introduceți parola"
                    disabled={isUploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Parola folosită pentru protecția certificatului
                  </p>
                </div>

                <Alert variant="default" className="border-yellow-500 bg-yellow-50">
                  <Lock className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 text-sm">
                    <p className="font-semibold mb-1">Securitate:</p>
                    Certificatul va fi criptat cu AES-256-GCM înainte de stocare. 
                    Parola nu este salvată și este folosită doar pentru validare.
                  </AlertDescription>
                </Alert>

                <div className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-medium text-sm">Despre certificatul digital:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                      Certificatul trebuie obținut de la ANAF sau furnizori autorizați (ex: CertSign)
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                      Certificatul este folosit pentru semnarea digitală a facturilor
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                      Verificați data de expirare înainte de încărcare
                    </li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!selectedFile || !password || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Se încarcă...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Încarcă Certificat
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certificate Info Tab */}
        <TabsContent value="certificate" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Informații Certificat</CardTitle>
                  <CardDescription>
                    Detalii despre certificatul digital încărcat
                  </CardDescription>
                </div>
                {certificateInfo?.isValid ? (
                  <Badge variant="default" className="flex items-center gap-1 bg-green-500 hover:bg-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Activ
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    Expirat
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingCert ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : certificateInfo ? (
                <div className="space-y-4">
                  {/* Expiration Warning */}
                  {certificateInfo.isValid && certificateInfo.daysUntilExpiry <= 30 && (
                    <Alert variant="default" className="border-yellow-500 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        Certificatul expiră în {certificateInfo.daysUntilExpiry} zile. 
                        Încărcați un certificat nou cât mai curând.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Expired Warning */}
                  {!certificateInfo.isValid && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        Certificatul a expirat. Încărcați un certificat nou pentru a continua integrarea ANAF.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Certificate Details */}
                  <div className="grid gap-4">
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Nume Comun</p>
                        <p className="font-medium">{certificateInfo.commonName}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Organizație</p>
                        <p className="font-medium">{certificateInfo.organization}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Valabilitate</p>
                        <p className="text-sm">
                          <span className="font-medium">De la:</span> {new Date(certificateInfo.validFrom).toLocaleDateString('ro-RO')}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Până la:</span> {new Date(certificateInfo.validTo).toLocaleDateString('ro-RO')}
                        </p>
                        {certificateInfo.isValid && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Expiră în {certificateInfo.daysUntilExpiry} zile
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Emitent</p>
                        <p className="font-medium text-sm">{certificateInfo.issuer}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t">
                    <Button
                      variant="destructive"
                      onClick={handleRevokeCertificate}
                      className="w-full"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Revocă Certificat
                    </Button>
                  </div>
                </div>
              ) : (
                <Alert variant="default" className="border-blue-500 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Nu există certificat încărcat. Accesați tab-ul "Upload Certificat" pentru a încărca unul.
                  </AlertDescription>
                </Alert>
              )}

              {certError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{certError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
