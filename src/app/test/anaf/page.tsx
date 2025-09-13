'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, ExternalLink, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  test: string;
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  timestamp: string;
}

interface ANAFTestConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  date: string;
  due_date: string;
  customer_name: string;
  total_amount: number;
  base_currency: string;
  status: string;
}

export default function ANAFTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [authUrl, setAuthUrl] = useState<string>('');
  const [authCode, setAuthCode] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('');
  const [submissionId, setSubmissionId] = useState<string>('');
  const [xmlContent, setXmlContent] = useState<string>('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [config, setConfig] = useState<ANAFTestConfig>({
    baseUrl: process.env.NEXT_PUBLIC_ANAF_BASE_URL || 'https://api.anaf.ro/test/FCTEL/rest',
    clientId: process.env.NEXT_PUBLIC_ANAF_CLIENT_ID || 'a1804dab99e7ed5fbb6188f09d182edd0c58d20fa532c568',
    clientSecret: process.env.NEXT_PUBLIC_ANAF_CLIENT_SECRET || '26b94e4f9f543c74fc2e9cbe91ce9d8c4273c816a2b92edd0c58d20fa532c568',
    redirectUri: process.env.NEXT_PUBLIC_ANAF_REDIRECT_URI || 'https://ydv.digital/api/anaf/oauth/callback',
    environment: process.env.NEXT_PUBLIC_ANAF_ENVIRONMENT || 'sandbox'
  });

  // Get tenant ID from URL or use default
  const [tenantId, setTenantId] = useState<string>('1');

  const addResult = (test: string, success: boolean, message: string, data?: any, error?: string) => {
    const result: TestResult = {
      test,
      success,
      message,
      data,
      error,
      timestamp: new Date().toISOString()
    };
    setResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const fetchInvoices = async () => {
    setIsLoading(true);
    addResult('Fetch Invoices', false, 'Fetching invoices...');

    try {
      const response = await fetch(`/api/test/anaf/invoices?tenantId=${tenantId}`);
      const data = await response.json();

      if (response.ok) {
        setInvoices(data.invoices || []);
        addResult('Fetch Invoices', true, `Found ${data.invoices?.length || 0} invoices`, { count: data.invoices?.length || 0 });
        toast.success(`Found ${data.invoices?.length || 0} invoices`);
      } else {
        addResult('Fetch Invoices', false, 'Failed to fetch invoices', null, data.error);
        toast.error('Failed to fetch invoices');
      }
    } catch (error) {
      addResult('Fetch Invoices', false, 'Network error', null, error instanceof Error ? error.message : 'Unknown error');
      toast.error('Network error while fetching invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const selectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    addResult('Select Invoice', true, `Selected invoice #${invoice.invoice_number}`, { 
      invoiceId: invoice.id, 
      invoiceNumber: invoice.invoice_number 
    });
    toast.success(`Selected invoice #${invoice.invoice_number}`);
  };

  const testSandboxConnectivity = async () => {
    setIsLoading(true);
    addResult('Sandbox Connectivity', false, 'Testing...');

    try {
      const response = await fetch('/api/test/anaf/sandbox');
      const data = await response.json();

      if (response.ok) {
        addResult('Sandbox Connectivity', true, 'Sandbox is accessible', data);
        toast.success('Sandbox connectivity test passed');
      } else {
        addResult('Sandbox Connectivity', false, 'Sandbox test failed', null, data.error);
        toast.error('Sandbox connectivity test failed');
      }
    } catch (error) {
      addResult('Sandbox Connectivity', false, 'Network error', null, error instanceof Error ? error.message : 'Unknown error');
      toast.error('Network error during sandbox test');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAuthUrl = async () => {
    setIsLoading(true);
    addResult('Generate Auth URL', false, 'Generating...');

    try {
      const response = await fetch('/api/test/anaf/auth-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId })
      });
      const data = await response.json();

      if (response.ok) {
        setAuthUrl(data.authUrl);
        addResult('Generate Auth URL', true, 'Auth URL generated successfully', { authUrl: data.authUrl });
        toast.success('Auth URL generated');
      } else {
        addResult('Generate Auth URL', false, 'Failed to generate auth URL', null, data.error);
        toast.error('Failed to generate auth URL');
      }
    } catch (error) {
      addResult('Generate Auth URL', false, 'Network error', null, error instanceof Error ? error.message : 'Unknown error');
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const exchangeCodeForToken = async () => {
    if (!authCode) {
      toast.error('Please enter an authorization code');
      return;
    }

    setIsLoading(true);
    addResult('Exchange Code for Token', false, 'Exchanging...');

    try {
      const response = await fetch('/api/test/anaf/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, authCode })
      });
      const data = await response.json();

      if (response.ok) {
        setAccessToken(data.accessToken);
        addResult('Exchange Code for Token', true, 'Token obtained successfully', { 
          accessToken: data.accessToken.substring(0, 20) + '...',
          expiresIn: data.expiresIn 
        });
        toast.success('Access token obtained');
      } else {
        addResult('Exchange Code for Token', false, 'Failed to exchange code', null, data.error);
        toast.error('Failed to exchange authorization code');
      }
    } catch (error) {
      addResult('Exchange Code for Token', false, 'Network error', null, error instanceof Error ? error.message : 'Unknown error');
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const generateInvoiceXML = async () => {
    if (!selectedInvoice) {
      toast.error('Please select an invoice first');
      return;
    }

    setIsLoading(true);
    addResult('Generate Invoice XML', false, 'Generating XML for selected invoice...');

    try {
      const response = await fetch('/api/test/anaf/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: selectedInvoice.id, tenantId })
      });
      const data = await response.json();

      if (response.ok) {
        setXmlContent(data.xmlContent);
        addResult('Generate Invoice XML', true, 'Invoice XML generated successfully', { 
          xmlLength: data.xmlContent.length,
          invoiceNumber: selectedInvoice.invoice_number
        });
        toast.success('Invoice XML generated');
      } else {
        addResult('Generate Invoice XML', false, 'Failed to generate invoice XML', null, data.error);
        toast.error('Failed to generate invoice XML');
      }
    } catch (error) {
      addResult('Generate Invoice XML', false, 'Network error', null, error instanceof Error ? error.message : 'Unknown error');
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const submitInvoice = async () => {
    if (!accessToken) {
      toast.error('Please obtain an access token first');
      return;
    }

    if (!xmlContent) {
      toast.error('Please generate invoice XML first');
      return;
    }

    if (!selectedInvoice) {
      toast.error('Please select an invoice first');
      return;
    }

    setIsLoading(true);
    addResult('Submit Invoice', false, 'Submitting invoice to ANAF...');

    try {
      const response = await fetch('/api/test/anaf/submit-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accessToken, 
          xmlContent,
          config,
          invoiceId: selectedInvoice.id,
          tenantId
        })
      });
      const data = await response.json();

      if (response.ok) {
        setSubmissionId(data.submissionId);
        addResult('Submit Invoice', true, 'Invoice submitted successfully', { 
          submissionId: data.submissionId,
          status: data.status,
          invoiceNumber: selectedInvoice.invoice_number
        });
        toast.success('Invoice submitted to ANAF');
      } else {
        addResult('Submit Invoice', false, 'Failed to submit invoice', null, data.error);
        toast.error('Failed to submit invoice');
      }
    } catch (error) {
      addResult('Submit Invoice', false, 'Network error', null, error instanceof Error ? error.message : 'Unknown error');
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!submissionId) {
      toast.error('Please submit an invoice first');
      return;
    }

    if (!selectedInvoice) {
      toast.error('Please select an invoice first');
      return;
    }

    setIsLoading(true);
    addResult('Check Status', false, 'Checking...');

    try {
      const response = await fetch('/api/test/anaf/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accessToken, 
          submissionId,
          config,
          invoiceId: selectedInvoice.id,
          tenantId
        })
      });
      const data = await response.json();

      if (response.ok) {
        addResult('Check Status', true, 'Status checked successfully', data);
        toast.success('Status checked');
      } else {
        addResult('Check Status', false, 'Failed to check status', null, data.error);
        toast.error('Failed to check status');
      }
    } catch (error) {
      addResult('Check Status', false, 'Network error', null, error instanceof Error ? error.message : 'Unknown error');
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const downloadXML = () => {
    if (!xmlContent) return;
    
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anaf-test-invoice-${Date.now()}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('XML file downloaded');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ANAF e-Factura Test Suite</h1>
          <p className="text-muted-foreground mt-2">
            Test ANAF e-Factura integration with sandbox environment
          </p>
        </div>
        <Button onClick={clearResults} variant="outline">
          Clear Results
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Selection</CardTitle>
            <CardDescription>Select an invoice to test with ANAF e-Factura</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenantId">Tenant ID</Label>
              <Input
                id="tenantId"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                placeholder="Enter tenant ID (e.g., 1)"
                type="number"
              />
            </div>
            <Button 
              onClick={fetchInvoices} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Fetch Invoices
            </Button>

            {invoices.length > 0 && (
              <div className="space-y-2">
                <Label>Available Invoices</Label>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedInvoice?.id === invoice.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => selectInvoice(invoice)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">#{invoice.invoice_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {invoice.customer_name} • {new Date(invoice.date).toLocaleDateString()}
                          </div>
                          <div className="text-sm font-medium">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: invoice.base_currency,
                            }).format(invoice.total_amount)}
                          </div>
                        </div>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedInvoice && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Selected Invoice</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Number:</strong> #{selectedInvoice.invoice_number}</div>
                  <div><strong>Customer:</strong> {selectedInvoice.customer_name}</div>
                  <div><strong>Date:</strong> {new Date(selectedInvoice.date).toLocaleDateString()}</div>
                  <div><strong>Amount:</strong> {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: selectedInvoice.base_currency,
                  }).format(selectedInvoice.total_amount)}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
            <CardDescription>Run ANAF integration tests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testSandboxConnectivity} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test Sandbox Connectivity
            </Button>

            <Separator />

            <div className="space-y-2">
              <Label>Step 1: Generate Auth URL</Label>
              <Button 
                onClick={generateAuthUrl} 
                disabled={isLoading || !config.clientId}
                className="w-full"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Generate Authorization URL
              </Button>
              {authUrl && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Input value={authUrl} readOnly className="text-xs" />
                    <Button size="sm" onClick={() => copyToClipboard(authUrl, 'Auth URL')}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={() => window.open(authUrl, '_blank')}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <Alert>
                    <AlertDescription>
                      Click the external link button to open the authorization URL in a new tab.
                      After authorization, copy the code from the redirect URL.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="authCode">Step 2: Enter Authorization Code</Label>
              <Input
                id="authCode"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="Paste authorization code here"
              />
              <Button 
                onClick={exchangeCodeForToken} 
                disabled={isLoading || !authCode}
                className="w-full"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Exchange Code for Token
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Step 3: Generate Invoice XML</Label>
              <Button 
                onClick={generateInvoiceXML} 
                disabled={isLoading || !selectedInvoice}
                className="w-full"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Generate Invoice XML
              </Button>
              {xmlContent && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Button size="sm" onClick={downloadXML}>
                      <Download className="mr-2 h-4 w-4" />
                      Download XML
                    </Button>
                    <Badge variant="secondary">
                      {xmlContent.length} characters
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Step 4: Submit Invoice</Label>
              <Button 
                onClick={submitInvoice} 
                disabled={isLoading || !accessToken || !xmlContent || !selectedInvoice}
                className="w-full"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit Invoice to ANAF
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Step 5: Check Status</Label>
              <Button 
                onClick={checkStatus} 
                disabled={isLoading || !submissionId}
                className="w-full"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Check Submission Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>
            {results.length} test(s) completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No tests run yet. Click a test button above to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">{result.test}</h4>
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.success ? "Success" : "Failed"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {result.message}
                    </p>
                    {result.data && (
                      <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                    {result.error && (
                      <p className="text-sm text-red-500 mt-1">
                        Error: {result.error}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(result.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
