/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { ANAFOAuthService } from '@/lib/anaf/oauth-service';
import { ANAFIntegration } from '@/lib/anaf/anaf-integration';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth error
    if (error) {
      const errorDescription = searchParams.get('error_description') || 'OAuth authorization failed';
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ydv.digital';
      return NextResponse.redirect(
        `${baseUrl}/home/invoices?anaf_error=${encodeURIComponent(errorDescription)}`
      );
    }

    // Validate required parameters
    if (!code || !state) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ydv.digital';
      return NextResponse.redirect(
        `${baseUrl}/home/invoices?anaf_error=${encodeURIComponent('Missing authorization code or state')}`
      );
    }

    // Validate state parameter
    const stateData = ANAFOAuthService.validateState(state);
    if (!stateData) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ydv.digital';
      return NextResponse.redirect(
        `${baseUrl}/home/invoices?anaf_error=${encodeURIComponent('Invalid state parameter')}`
      );
    }

    const { userId, tenantId } = stateData;

    // Exchange code for token
    const anafIntegration = new ANAFIntegration();
    const tokenResult = await anafIntegration.exchangeCodeForToken(code, userId, tenantId);

    if (tokenResult.success) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ydv.digital';
      
      // Check if this is a popup window (silent auth)
      const isPopup = request.headers.get('referer')?.includes('popup') || 
                     request.headers.get('user-agent')?.includes('popup');
      
      if (isPopup) {
        // Return HTML that closes popup and notifies parent
        return new NextResponse(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>ANAF Authentication</title>
            </head>
            <body>
              <script>
                // Notify parent window of success
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'ANAF_AUTH_SUCCESS',
                    message: 'Authentication successful'
                  }, window.location.origin);
                }
                // Close popup
                window.close();
              </script>
              <p>Authentication successful. This window will close automatically.</p>
            </body>
          </html>
        `, {
          headers: {
            'Content-Type': 'text/html',
          },
        });
      }
      
      return NextResponse.redirect(
        `${baseUrl}/home/invoices?anaf_success=true&tenant_id=${tenantId}`
      );
    } else {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ydv.digital';
      
      // Check if this is a popup window (silent auth)
      const isPopup = request.headers.get('referer')?.includes('popup') || 
                     request.headers.get('user-agent')?.includes('popup');
      
      if (isPopup) {
        // Return HTML that closes popup and notifies parent
        return new NextResponse(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>ANAF Authentication</title>
            </head>
            <body>
              <script>
                // Notify parent window of error
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'ANAF_AUTH_ERROR',
                    error: '${tokenResult.error || 'Failed to exchange authorization code'}'
                  }, window.location.origin);
                }
                // Close popup
                window.close();
              </script>
              <p>Authentication failed. This window will close automatically.</p>
            </body>
          </html>
        `, {
          headers: {
            'Content-Type': 'text/html',
          },
        });
      }
      
      return NextResponse.redirect(
        `${baseUrl}/home/invoices?anaf_error=${encodeURIComponent(tokenResult.error || 'Failed to exchange authorization code')}`
      );
    }
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ydv.digital';
    
    // Check if this is a popup window (silent auth)
    const isPopup = request.headers.get('referer')?.includes('popup') || 
                   request.headers.get('user-agent')?.includes('popup');
    
    if (isPopup) {
      // Return HTML that closes popup and notifies parent
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>ANAF Authentication</title>
          </head>
          <body>
            <script>
              // Notify parent window of error
              if (window.opener) {
                window.opener.postMessage({
                  type: 'ANAF_AUTH_ERROR',
                  error: 'OAuth callback failed'
                }, window.location.origin);
              }
              // Close popup
              window.close();
            </script>
            <p>Authentication failed. This window will close automatically.</p>
          </body>
        </html>
      `, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
    
    return NextResponse.redirect(
      `${baseUrl}/home/invoices?anaf_error=${encodeURIComponent('OAuth callback failed')}`
    );
  }
}
