import { NextRequest, NextResponse } from 'next/server';
import { lookupOrdersByNumbers } from '@/lib/shopify';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawNumbers = body.numbers;

    if (!Array.isArray(rawNumbers) || rawNumbers.length === 0) {
      return NextResponse.json({ error: 'Please provide an array of order numbers' }, { status: 400 });
    }

    const result = await lookupOrdersByNumbers(rawNumbers);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Shopify order lookup failed' }, { status: 500 });
  }
}
