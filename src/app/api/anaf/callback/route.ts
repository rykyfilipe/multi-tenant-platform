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
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/invoices?anaf_error=${encodeURIComponent(errorDescription)}`
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/invoices?anaf_error=${encodeURIComponent('Missing authorization code or state')}`
      );
    }

    // Validate state parameter
    const stateData = ANAFOAuthService.validateState(state);
    if (!stateData) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/invoices?anaf_error=${encodeURIComponent('Invalid state parameter')}`
      );
    }

    const { userId, tenantId } = stateData;

    // Exchange code for token
    const anafIntegration = new ANAFIntegration();
    const tokenResult = await anafIntegration.exchangeCodeForToken(code, userId, tenantId);

    if (tokenResult.success) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/invoices?anaf_success=true&tenant_id=${tenantId}`
      );
    } else {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/invoices?anaf_error=${encodeURIComponent(tokenResult.error || 'Failed to exchange authorization code')}`
      );
    }
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/invoices?anaf_error=${encodeURIComponent('OAuth callback failed')}`
    );
  }
}
