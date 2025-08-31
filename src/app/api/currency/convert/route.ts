import { NextRequest, NextResponse } from 'next/server';
import { RealExchangeRateProvider, MockExchangeRateProvider } from '@/lib/currency-exchange';

export async function POST(request: NextRequest) {
  try {
    const { from, to, amount, provider = 'real' } = await request.json();

    if (!from || !to || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters: from, to, amount' },
        { status: 400 }
      );
    }

    // Select provider based on request
    const exchangeProvider = provider === 'mock' 
      ? new MockExchangeRateProvider()
      : new RealExchangeRateProvider();

    // Get exchange rate
    const exchangeRate = await exchangeProvider.getExchangeRate(from, to);
    
    // Calculate converted amount
    const convertedAmount = amount * exchangeRate.rate;

    return NextResponse.json({
      success: true,
      data: {
        originalAmount: amount,
        originalCurrency: from.toUpperCase(),
        convertedAmount: Math.round(convertedAmount * 100) / 100,
        baseCurrency: to.toUpperCase(),
        exchangeRate: exchangeRate.rate,
        conversionDate: exchangeRate.date,
        source: exchangeRate.source
      }
    });

  } catch (error) {
    console.error('Currency conversion error:', error);
    
    // Fallback to mock provider on error
    try {
      const mockProvider = new MockExchangeRateProvider();
      const fallbackRate = await mockProvider.getExchangeRate(from, to);
      const convertedAmount = amount * fallbackRate.rate;

      return NextResponse.json({
        success: true,
        data: {
          originalAmount: amount,
          originalCurrency: from.toUpperCase(),
          convertedAmount: Math.round(convertedAmount * 100) / 100,
          baseCurrency: to.toUpperCase(),
          exchangeRate: fallbackRate.rate,
          conversionDate: fallbackRate.date,
          source: 'Fallback Mock Provider'
        },
        warning: 'Using fallback rates due to API error'
      });
    } catch (fallbackError) {
      return NextResponse.json(
        { 
          error: 'Currency conversion failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const provider = searchParams.get('provider') || 'real';

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Missing required parameters: from, to' },
        { status: 400 }
      );
    }

    // Select provider based on request
    const exchangeProvider = provider === 'mock' 
      ? new MockExchangeRateProvider()
      : new RealExchangeRateProvider();

    // Get exchange rate
    const exchangeRate = await exchangeProvider.getExchangeRate(from, to);

    return NextResponse.json({
      success: true,
      data: exchangeRate
    });

  } catch (error) {
    console.error('Exchange rate fetch error:', error);
    
    // Fallback to mock provider on error
    try {
      const mockProvider = new MockExchangeRateProvider();
      const fallbackRate = await mockProvider.getExchangeRate(from, to);

      return NextResponse.json({
        success: true,
        data: fallbackRate,
        warning: 'Using fallback rates due to API error'
      });
    } catch (fallbackError) {
      return NextResponse.json(
        { 
          error: 'Failed to fetch exchange rate',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  }
}
