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

interface TokenInfo {
  expiresAt: string;
  expiresIn: number; // seconds
  expiresInMinutes: number;
  willRefreshSoon: boolean;
  hasRefreshToken: boolean;
  isExpired: boolean;
}

interface ANAFAuthManagerProps {
  onAuthComplete?: () => void;
}

export function ANAFAuthManager({ onAuthComplete }: ANAFAuthManagerProps) {
  // OAuth2 State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Token State
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);

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

  // Current tab - Start with upload certificate (Step 1)
  const [activeTab, setActiveTab] = useState('upload');

  // Check OAuth2 authentication status
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Load certificate info on mount
  useEffect(() => {
    loadCertificateInfo();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsCheckingAuth(true);
      const response = await fetch('/api/anaf/auth/status');
      
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.authenticated || false);
        setTokenInfo(data.token || null);
        
        // Also update certificate info from status response
        if (data.certificate) {
          setCertificateInfo({
            isValid: data.certificate.isValid,
            commonName: data.certificate.commonName,
            organization: data.certificate.organization,
            validFrom: data.certificate.validFrom,
            validTo: data.certificate.validTo,
            daysUntilExpiry: data.certificate.daysUntilExpiry,
            issuer: data.certificate.issuer,
          });
        }
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

      // Auto-switch to OAuth2 tab (Step 2) after 2 seconds
      setTimeout(() => {
        setActiveTab('oauth');
        setUploadSuccess(false); // Clear success message
      }, 2000);
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

  // Utility function to format time duration
  const formatDuration = (seconds: number): string => {
    if (seconds <= 0) return 'Expirat';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minute`;
  };

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

      {/* Configuration Tabs - Step-by-step flow */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          {/* STEP 1: Upload Certificate - ALWAYS enabled */}
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" />
            <span>1. Upload Certificat</span>
          </TabsTrigger>
          
          {/* STEP 2: OAuth2 - Enabled only if certificate is valid */}
          <TabsTrigger 
            value="oauth" 
            className="gap-2" 
            disabled={!certificateInfo?.isValid}
          >
            <Shield className="h-4 w-4" />
            <span>2. OAuth2</span>
          </TabsTrigger>
          
          {/* STEP 3: Certificate Info - Enabled only if authenticated */}
          <TabsTrigger 
            value="certificate" 
            className="gap-2" 
            disabled={!isAuthenticated || !certificateInfo}
          >
            <FileKey className="h-4 w-4" />
            <span>3. Info Certificat</span>
          </TabsTrigger>
        </TabsList>

        {/* Upload Certificate Tab - STEP 1 */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-blue-500">Pasul 1</Badge>
                <div>
                  <CardTitle className="text-lg">Încărcare Certificat Digital</CardTitle>
                  <CardDescription>
                    Începeți prin a încărca certificatul digital PKCS#12 (.pfx sau .p12)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step indicator */}
              <Alert variant="default" className="border-blue-500 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <p className="font-semibold mb-2">🔐 Pasul 1: Încărcați certificatul digital</p>
                  <p className="text-sm">
                    Pentru a continua integrarea ANAF, trebuie să încărcați mai întâi certificatul digital. 
                    După ce certificatul este validat, veți putea continua cu autentificarea OAuth2.
                  </p>
                </AlertDescription>
              </Alert>

              {uploadSuccess && (
                <Alert variant="default" className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <p className="font-semibold">✅ Certificatul a fost încărcat și validat cu succes!</p>
                    <p className="text-sm mt-1">Acum puteți continua cu Pasul 2: Autentificare OAuth2</p>
                  </AlertDescription>
                </Alert>
              )}

              {uploadError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              {certificateInfo?.isValid && (
                <Alert variant="default" className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <p className="font-semibold">Certificat deja încărcat</p>
                    <p className="text-sm mt-1">
                      Aveți deja un certificat valid. Puteți continua cu Pasul 2 sau încărca un certificat nou.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleCertificateUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="certificate-file">Fișier Certificat *</Label>
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
                  <Label htmlFor="certificate-password">Parola Certificatului *</Label>
                  <Input
                    id="certificate-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Introduceți parola"
                    disabled={isUploading}
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Parola folosită pentru protecția certificatului
                  </p>
                </div>

                <Alert variant="default" className="border-yellow-500 bg-yellow-50">
                  <Lock className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 text-sm">
                    <p className="font-semibold mb-1">🔒 Securitate:</p>
                    Certificatul va fi criptat cu AES-256-GCM înainte de stocare. 
                    Parola nu este salvată și este folosită doar pentru validare.
                  </AlertDescription>
                </Alert>

                <div className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-medium text-sm">📋 Despre certificatul digital:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                      Certificatul trebuie obținut de la ANAF sau furnizori autorizați (ex: CertSign)
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                      Certificatul este folosit pentru autentificare mTLS și semnare XML
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
                  size="lg"
                  disabled={!selectedFile || !password || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Se încarcă și validează...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Încarcă și Validează Certificat
                    </>
                  )}
                </Button>

                {certificateInfo?.isValid && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setActiveTab('oauth')}
                  >
                    Continuă cu Pasul 2: OAuth2 →
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OAuth2 Tab - STEP 2 */}
        <TabsContent value="oauth" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-500">Pasul 2</Badge>
                <div>
                  <CardTitle className="text-lg">Autentificare OAuth2</CardTitle>
                  <CardDescription>
                    Conectați-vă cu contul ANAF pentru accesul la serviciul e-Factura
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Certificate check */}
              {!certificateInfo?.isValid && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold">❌ Certificat lipsă sau invalid</p>
                    <p className="text-sm mt-1">
                      Trebuie să completați Pasul 1 (Upload Certificat) înainte de a continua.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

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
                      <p className="font-semibold">✅ Autentificat cu succes la ANAF!</p>
                      <p className="text-sm mt-1">
                        Token-ul OAuth2 este activ. Acum puteți vizualiza informațiile despre certificat și trimite facturi.
                      </p>
                    </AlertDescription>
                  </Alert>

                  {/* Token Status Card */}
                  {tokenInfo && (
                    <div className="p-4 border rounded-lg bg-blue-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          🔑 Status Token OAuth2
                        </h4>
                        {tokenInfo.willRefreshSoon && (
                          <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
                            🔄 Se refreshează curând
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Status Token:</p>
                          <p className="font-medium flex items-center gap-1">
                            {tokenInfo.isExpired ? (
                              <>
                                <XCircle className="h-3 w-3 text-red-500" />
                                <span className="text-red-600">Expirat</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                <span className="text-green-600">Activ</span>
                              </>
                            )}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-muted-foreground">Expiră în:</p>
                          <p className="font-medium">
                            {formatDuration(tokenInfo.expiresIn)}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-muted-foreground">Data expirării:</p>
                          <p className="font-medium text-xs">
                            {new Date(tokenInfo.expiresAt).toLocaleString('ro-RO')}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-muted-foreground">Auto-refresh:</p>
                          <p className="font-medium flex items-center gap-1">
                            {tokenInfo.hasRefreshToken ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                <span className="text-green-600">Activat</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 text-red-500" />
                                <span className="text-red-600">Dezactivat</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {tokenInfo.willRefreshSoon && !tokenInfo.isExpired && (
                        <Alert variant="default" className="border-yellow-500 bg-yellow-50 py-2">
                          <AlertTriangle className="h-3 w-3 text-yellow-600" />
                          <AlertDescription className="text-yellow-800 text-xs">
                            Token-ul va fi refreshat automat în următoarele 5 minute pentru a menține conectarea activă.
                          </AlertDescription>
                        </Alert>
                      )}

                      {tokenInfo.isExpired && (
                        <Alert variant="destructive" className="py-2">
                          <XCircle className="h-3 w-3" />
                          <AlertDescription className="text-xs">
                            Token-ul a expirat. Vă rugăm să vă reconectați.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

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

                  <div className="p-4 border rounded-lg space-y-2 bg-green-50">
                    <h4 className="font-medium text-sm">✨ Configurare completă!</h4>
                    <p className="text-sm text-muted-foreground">
                      Puteți acum să:
                    </p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Vizualizați informațiile despre certificat (Pasul 3)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Trimiteți facturi către ANAF e-Factura
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Verificați statusul facturilor
                      </li>
                    </ul>
                  </div>

                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => setActiveTab('certificate')}
                  >
                    Continuă cu Pasul 3: Info Certificat →
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert variant="default" className="border-blue-500 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <p className="font-semibold mb-1">🔐 Pasul 2: Autentificare OAuth2</p>
                      <p className="text-sm">
                        După ce ați încărcat certificatul, trebuie să vă autentificați cu contul ANAF SPV 
                        pentru a activa integrarea e-Factura.
                      </p>
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
                        Securitate maximă cu mTLS
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Acces controlat și revocat oricând
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Conformitate ANAF 100%
                      </li>
                    </ul>
                  </div>

                  <Alert variant="default" className="border-yellow-500 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800 text-sm">
                      <p className="font-semibold mb-1">📋 Ce vă trebuie:</p>
                      <ul className="space-y-0.5 text-xs">
                        <li>✅ Cont ANAF SPV activ</li>
                        <li>✅ Certificat digital încărcat (Pasul 1)</li>
                        <li>✅ Aplicație înregistrată în portalul ANAF</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={handleOAuthConnect}
                    className="w-full gap-2"
                    size="lg"
                    disabled={!certificateInfo?.isValid}
                  >
                    <ExternalLink className="h-4 w-4" />
                    {certificateInfo?.isValid ? 'Conectare cu ANAF' : 'Completați Pasul 1 mai întâi'}
                  </Button>

                  {!certificateInfo?.isValid && (
                    <p className="text-xs text-center text-muted-foreground">
                      Certificatul trebuie să fie valid pentru a continua
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certificate Info Tab - STEP 3 */}
        <TabsContent value="certificate" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-purple-500">Pasul 3</Badge>
                  <div>
                    <CardTitle className="text-lg">Informații Certificat</CardTitle>
                    <CardDescription>
                      Detalii complete despre certificatul digital încărcat
                    </CardDescription>
                  </div>
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
              {/* Step completion indicator */}
              {!isAuthenticated && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold">❌ OAuth2 neconectat</p>
                    <p className="text-sm mt-1">
                      Trebuie să completați Pasul 2 (OAuth2) înainte de a vedea informațiile complete.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {isLoadingCert ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : certificateInfo ? (
                <div className="space-y-4">
                  {/* Success message */}
                  {isAuthenticated && certificateInfo.isValid && (
                    <Alert variant="default" className="border-green-500 bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <p className="font-semibold">🎉 Configurare completă!</p>
                        <p className="text-sm mt-1">
                          Integrarea ANAF e-Factura este activă. Puteți trimite facturi către SPV.
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Expiration Warning */}
                  {certificateInfo.isValid && certificateInfo.daysUntilExpiry <= 30 && (
                    <Alert variant="default" className="border-yellow-500 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        ⚠️ Certificatul expiră în {certificateInfo.daysUntilExpiry} zile. 
                        Încărcați un certificat nou cât mai curând (Pasul 1).
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Expired Warning */}
                  {!certificateInfo.isValid && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <p className="font-semibold">❌ Certificat expirat</p>
                        <p className="text-sm mt-1">
                          Încărcați un certificat nou în Pasul 1 pentru a continua integrarea ANAF.
                        </p>
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
