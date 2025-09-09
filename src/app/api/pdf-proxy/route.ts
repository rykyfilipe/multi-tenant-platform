/** @format */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pdfUrl = searchParams.get('url');
    const token = searchParams.get('token');

    if (!pdfUrl || !token) {
      return new NextResponse('Missing URL or token', { status: 400 });
    }

    // Decode the URL and token
    const decodedUrl = decodeURIComponent(pdfUrl);
    const decodedToken = decodeURIComponent(token);

    // Make request to the actual PDF endpoint with authorization
    const response = await fetch(decodedUrl, {
      headers: {
        'Authorization': `Bearer ${decodedToken}`,
        'Accept': 'application/pdf',
      },
    });

    if (!response.ok) {
      return new NextResponse('Failed to fetch PDF', { status: response.status });
    }

    const pdfBuffer = await response.arrayBuffer();

    // Return the PDF with proper headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Frame-Options': 'SAMEORIGIN',
      },
    });
  } catch (error) {
    console.error('PDF Proxy Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
