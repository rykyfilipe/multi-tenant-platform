/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthResponse, getUserId } from '@/lib/session';
import { ANAFIntegration } from '@/lib/anaf/anaf-integration';
import { ANAFXMLGenerator } from '@/lib/anaf/xml-generator';
import { ANAFErrorHandler } from '@/lib/anaf/error-handler';
import { ANAFInvoiceData, ANAFCompanyData, ANAFCustomerData, ANAFInvoiceItem } from '@/lib/anaf/types';
import prisma from '@/lib/prisma';
export async function POST(request: NextRequest) {
  try {
    const sessionResult = await requireAuthResponse();
    if (sessionResult instanceof NextResponse) {
      return sessionResult;
    }

    const userId = getUserId(sessionResult);
    if (!sessionResult.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { testType = 'full', tenantId } = body;


    const results = {
      timestamp: new Date().toISOString(),
      testType,
      userId,
      tenantId,
      tests: {} as any
    };

    // Test 1: XML Generation
    if (testType === 'xml' || testType === 'full') {
      try {
        
        const testInvoiceData: ANAFInvoiceData = {
          invoiceId: 999999,
          invoiceNumber: 'TEST-2024-001',
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          customerTaxId: 'RO12345678',
          customerName: 'Test Customer SRL',
          customerAddress: 'Strada Test 123, București, România',
          companyTaxId: 'RO87654321',
          companyName: 'Test Company SRL',
          companyAddress: 'Strada Company 456, București, România',
          items: [
            {
              productName: 'Test Product 1',
              description: 'Test Description 1',
              quantity: 2,
              unitOfMeasure: 'buc',
              unitPrice: 100.00,
              totalPrice: 200.00,
              vatRate: 19,
              vatAmount: 38.00,
              currency: 'RON'
            },
            {
              productName: 'Test Product 2',
              description: 'Test Description 2',
              quantity: 1,
              unitOfMeasure: 'kg',
              unitPrice: 50.00,
              totalPrice: 50.00,
              vatRate: 19,
              vatAmount: 9.50,
              currency: 'RON'
            }
          ],
          totals: {
            subtotal: 250.00,
            vatTotal: 47.50,
            grandTotal: 297.50,
            currency: 'RON'
          },
          currency: 'RON',
          language: 'ro'
        };

        const testCompanyData: ANAFCompanyData = {
          taxId: 'RO87654321',
          name: 'Test Company SRL',
          address: 'Strada Company 456',
          city: 'București',
          country: 'RO',
          postalCode: '010001',
          email: 'test@company.com',
          phone: '+40 123 456 789'
        };

        const testCustomerData: ANAFCustomerData = {
          taxId: 'RO12345678',
          name: 'Test Customer SRL',
          address: 'Strada Test 123',
          city: 'București',
          country: 'RO',
          postalCode: '010001',
          email: 'test@customer.com',
          phone: '+40 987 654 321'
        };

        const xmlContent = ANAFXMLGenerator.generateXML({
          invoiceData: testInvoiceData,
          companyData: testCompanyData,
          customerData: testCustomerData,
          language: 'ro',
          includeSignature: false
        });

        results.tests.xmlGeneration = {
          success: true,
          xmlLength: xmlContent.length,
          hasRequiredElements: checkXMLStructure(xmlContent),
          message: 'XML generated successfully'
        };

      } catch (error) {
        results.tests.xmlGeneration = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'XML generation failed'
        };
        console.error('XML generation test failed:', error);
      }
    }

    // Test 2: OAuth URL Generation
    if (testType === 'oauth' || testType === 'full') {
      try {
        
        const anafIntegration = new ANAFIntegration();
        const authUrl = await anafIntegration.getAuthUrl(userId, tenantId || 1);
        
        results.tests.oauthUrl = {
          success: true,
          authUrl: authUrl,
          hasCorrectEndpoint: authUrl.includes('logincert.anaf.ro/anaf-oauth2/v1/authorize'),
          message: 'OAuth URL generated successfully'
        };

      } catch (error) {
        results.tests.oauthUrl = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'OAuth URL generation failed'
        };
        console.error('OAuth URL generation test failed:', error);
      }
    }

    // Test 3: Error Handling
    if (testType === 'error' || testType === 'full') {
      try {
        
        const testError = new Error('Test error for ANAF integration');
        const context = {
          userId,
          tenantId: tenantId || 1,
          operation: 'test_error_handling'
        };
        
        const anafError = await ANAFErrorHandler.handleError(testError, context);
        const userMessage = ANAFErrorHandler.getUserFriendlyMessage(anafError);
        const isRetryable = ANAFErrorHandler.isRetryableError(anafError);
        
        results.tests.errorHandling = {
          success: true,
          errorCode: anafError.code,
          userMessage: userMessage,
          isRetryable: isRetryable,
          message: 'Error handling test completed'
        };

      } catch (error) {
        results.tests.errorHandling = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Error handling test failed'
        };
        console.error('Error handling test failed:', error);
      }
    }

    // Test 4: Database Connection
    if (testType === 'database' || testType === 'full') {
      try {
        
        const tenantCount = await prisma.tenant.count();
        const userCount = await prisma.user.count();
        
        results.tests.database = {
          success: true,
          tenantCount: tenantCount,
          userCount: userCount,
          message: 'Database connection successful'
        };

      } catch (error) {
        results.tests.database = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Database connection failed'
        };
        console.error('Database connection test failed:', error);
      }
    }

    // Test 5: ANAF Sandbox Connectivity (TestOauth)
    if (testType === 'sandbox' || testType === 'full') {
      try {
        
        // Use the OAuth service method for testing sandbox connectivity
        const { ANAFOAuthService } = await import('@/lib/anaf/oauth-service');
        const connectivityResult = await ANAFOAuthService.testSandboxConnectivity();
        
        results.tests.sandboxConnectivity = {
          success: connectivityResult.success,
          status: connectivityResult.status,
          statusText: connectivityResult.statusText,
          url: 'https://api.anaf.ro/TestOauth/jaxrs/hello?name=Test%20Connectivity',
          response: connectivityResult.response,
          timestamp: connectivityResult.timestamp,
          message: connectivityResult.success ? 'ANAF sandbox is accessible' : 'ANAF sandbox returned error',
          note: connectivityResult.status === 401 ? '401 Unauthorized is expected for TestOauth without authentication - this indicates the service is working correctly' : undefined
        };

      } catch (error) {
        results.tests.sandboxConnectivity = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'ANAF sandbox connectivity test failed'
        };
        console.error('ANAF sandbox connectivity test failed:', error);
      }
    }

    // Test 6: Environment Variables
    if (testType === 'env' || testType === 'full') {
      try {
        
        const requiredEnvVars = [
          'ANAF_CLIENT_ID',
          'ANAF_CLIENT_SECRET',
          'ANAF_REDIRECT_URI',
          'ANAF_BASE_URL',
          'ANAF_ENVIRONMENT'
        ];
        
        const envStatus = requiredEnvVars.map(envVar => ({
          variable: envVar,
          isSet: !!process.env[envVar],
          value: process.env[envVar] ? '***' : undefined
        }));
        
        const allSet = envStatus.every(env => env.isSet);
        
        results.tests.environment = {
          success: allSet,
          variables: envStatus,
          message: allSet ? 'All required environment variables are set' : 'Some environment variables are missing'
        };

      } catch (error) {
        results.tests.environment = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Environment variables test failed'
        };
        console.error('Environment variables test failed:', error);
      }
    }

    // Calculate overall success
    const testResults = Object.values(results.tests);
    const successCount = testResults.filter((test: any) => test.success).length;
    const totalTests = testResults.length;
    
        results.tests.summary = {
      totalTests,
      successCount,
      failureCount: totalTests - successCount,
      successRate: Math.round((successCount / totalTests) * 100),
      overallSuccess: successCount === totalTests
    };


    return NextResponse.json({
      success: true,
      message: 'ANAF test completed successfully',
      results
    });

  } catch (error) {
    console.error('ANAF test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'ANAF test failed'
    }, { status: 500 });
  }
}

/**
 * Check if XML has required EN16931 elements
 */
function checkXMLStructure(xmlContent: string): boolean {
  const requiredElements = [
    '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"',
    '<cbc:ID>',
    '<cbc:IssueDate>',
    '<cbc:InvoiceTypeCode>',
    '<cbc:DocumentCurrencyCode>',
    '<cac:AccountingSupplierParty>',
    '<cac:AccountingCustomerParty>',
    '<cac:InvoiceLine>',
    '<cac:TaxTotal>',
    '<cac:LegalMonetaryTotal>'
  ];

  return requiredElements.every(element => xmlContent.includes(element));
}
