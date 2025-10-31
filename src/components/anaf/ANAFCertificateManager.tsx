/**
 * ANAF Certificate Manager Component
 * 
 * Complete UI for managing ANAF digital certificates:
 * - Upload certificate
 * - View certificate info
 * - Certificate expiration warnings
 * - Revoke certificate
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle2, AlertTriangle, XCircle, Info, FileKey } from 'lucide-react';

interface CertificateInfo {
  subject: {
    commonName: string;
    organization?: string;
    country?: string;
  };
  issuer: {
    commonName: string;
    organization?: string;
  };
  validFrom: string;
  validTo: string;
  serialNumber: string;
  thumbprint: string;
  isValid: boolean;
  daysUntilExpiry: number;
}

interface CertificateManagerProps {
  onCertificateUploaded?: (info: CertificateInfo) => void;
}

export function ANAFCertificateManager({ onCertificateUploaded }: CertificateManagerProps) {
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [uploading, setUploading] = useState(false);
  const [certificateInfo, setCertificateInfo] = useState<CertificateInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Load existing certificate info on mount
  useEffect(() => {
    loadCertificateInfo();
  }, []);

  const loadCertificateInfo = async () => {
    try {
      const response = await fetch('/api/anaf/certificate/info');
      if (response.ok) {
        const data = await response.json();
        if (data.info) {
          setCertificateInfo(data.info);
        }
      }
    } catch (error) {
      console.error('Failed to load certificate info:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file extension
      const validExtensions = ['.pfx', '.p12'];
      const fileName = file.name.toLowerCase();
      const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
      
      if (!hasValidExtension) {
        setError('Please select a valid certificate file (.pfx or .p12)');
        return;
      }
      
      setCertificateFile(file);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!certificateFile || !password) {
      setError('Please select a certificate file and enter the password');
      return;
    }

    setUploading(true);
    setError(null);
    setWarnings([]);

    try {
      const formData = new FormData();
      formData.append('certificate', certificateFile);
      formData.append('password', password);

      const response = await fetch('/api/anaf/certificate/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setCertificateInfo(data.info);
        setWarnings(data.warnings || []);
        setPassword(''); // Clear password for security
        setCertificateFile(null);
        
        if (onCertificateUploaded) {
          onCertificateUploaded(data.info);
        }
      } else {
        setError(data.message || 'Failed to upload certificate');
      }
    } catch (error) {
      setError('Failed to upload certificate. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm('Are you sure you want to revoke this certificate? You will need to upload a new one to use ANAF integration.')) {
      return;
    }

    try {
      const response = await fetch('/api/anaf/certificate/revoke', {
        method: 'POST',
      });

      if (response.ok) {
        setCertificateInfo(null);
        setWarnings([]);
        setError(null);
      }
    } catch (error) {
      setError('Failed to revoke certificate');
      console.error('Revoke error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Certificate Status */}
      {certificateInfo && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileKey className="h-5 w-5" />
                <CardTitle>Digital Certificate</CardTitle>
              </div>
              {certificateInfo.isValid ? (
                <Badge variant="default" className="flex items-center gap-1 bg-green-500 hover:bg-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Active
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  Expired
                </Badge>
              )}
            </div>
            <CardDescription>
              Your ANAF digital certificate for e-Factura integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Expiration Warning */}
            {certificateInfo.isValid && certificateInfo.daysUntilExpiry <= 30 && (
              <Alert variant="default" className="border-yellow-500 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Certificate expires in {certificateInfo.daysUntilExpiry} days. Please upload a new certificate soon.
                </AlertDescription>
              </Alert>
            )}

            {/* Expired Alert */}
            {!certificateInfo.isValid && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Certificate has expired. Please upload a new certificate to continue using ANAF integration.
                </AlertDescription>
              </Alert>
            )}

            {/* Certificate Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Subject</Label>
                <p className="font-medium">{certificateInfo.subject.commonName}</p>
                {certificateInfo.subject.organization && (
                  <p className="text-sm text-muted-foreground">{certificateInfo.subject.organization}</p>
                )}
              </div>

              <div>
                <Label className="text-muted-foreground">Issuer</Label>
                <p className="font-medium">{certificateInfo.issuer.commonName}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Valid From</Label>
                <p className="font-medium">{formatDate(certificateInfo.validFrom)}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Valid Until</Label>
                <p className="font-medium">{formatDate(certificateInfo.validTo)}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Serial Number</Label>
                <p className="font-mono text-xs">{certificateInfo.serialNumber}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Thumbprint</Label>
                <p className="font-mono text-xs truncate" title={certificateInfo.thumbprint}>
                  {certificateInfo.thumbprint.substring(0, 16)}...
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRevoke}
              >
                Revoke Certificate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Form */}
      {!certificateInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Digital Certificate</CardTitle>
            <CardDescription>
              Upload your ANAF digital certificate (.pfx or .p12) to enable e-Factura integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Info Alert */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You need a valid ANAF digital certificate to submit invoices. 
                  Certificates can be obtained from ANAF or authorized providers like CertSign.
                </AlertDescription>
              </Alert>

              {/* File Input */}
              <div className="space-y-2">
                <Label htmlFor="certificate">Certificate File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="certificate"
                    type="file"
                    accept=".pfx,.p12"
                    onChange={handleFileChange}
                    required
                  />
                  {certificateFile && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {certificateFile.name}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Supported formats: .pfx, .p12 (max 10MB)
                </p>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password">Certificate Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter certificate password"
                  minLength={8}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The password used to protect your certificate
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={uploading || !certificateFile || !password}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Certificate
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert variant="default" className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <p className="font-semibold mb-2">Warnings:</p>
            <ul className="list-disc list-inside space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
