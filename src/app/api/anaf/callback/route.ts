/**
 * ANAF OAuth2 Callback Handler
 * GET /api/anaf/callback
 * 
 * Handles OAuth2 authorization code exchange
 */

import { NextRequest, NextResponse } from 'next/server';
import { ANAFAuthService } from '@/lib/anaf/services/anafAuthService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ydv.digital';

    // Handle OAuth error from ANAF
    if (error) {
      const errorDescription = searchParams.get('error_description') || 'OAuth authorization failed';
      console.error('[ANAF Callback] OAuth error:', error, errorDescription);
      
      return NextResponse.redirect(
        `${baseUrl}/home/invoices?anaf_error=${encodeURIComponent(errorDescription)}`
      );
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('[ANAF Callback] Missing code or state');
      
      return NextResponse.redirect(
        `${baseUrl}/home/invoices?anaf_error=${encodeURIComponent('Missing authorization code or state')}`
      );
    }

    // Validate and decode state parameter (CSRF protection)
    const stateData = ANAFAuthService.validateState(state);
    
    if (!stateData) {
      console.error('[ANAF Callback] Invalid state parameter');
      
      return NextResponse.redirect(
        `${baseUrl}/home/invoices?anaf_error=${encodeURIComponent('Invalid state parameter - possible CSRF attack')}`
      );
    }

    const { userId, tenantId } = stateData;

    console.log('[ANAF Callback] Processing authorization code:', { userId, tenantId });

    // Exchange authorization code for access token (with mTLS)
    const tokenResult = await ANAFAuthService.exchangeCodeForToken(code, userId, tenantId);

    if (tokenResult.success) {
      console.log('[ANAF Callback] Token exchange successful');
      
      return NextResponse.redirect(
        `${baseUrl}/home/invoices?anaf_success=true`
      );
    } else {
      console.error('[ANAF Callback] Token exchange failed:', tokenResult.error);
      
      return NextResponse.redirect(
        `${baseUrl}/home/invoices?anaf_error=${encodeURIComponent(tokenResult.error || 'Failed to exchange authorization code')}`
      );
    }
  } catch (error) {
    console.error('[ANAF Callback] Unexpected error:', error);
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ydv.digital';
    return NextResponse.redirect(
      `${baseUrl}/home/invoices?anaf_error=${encodeURIComponent('OAuth callback failed')}`
    );
  }
}
