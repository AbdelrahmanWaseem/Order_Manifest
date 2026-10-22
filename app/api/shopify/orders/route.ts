import { NextRequest, NextResponse } from 'next/server';
import { getRecentOrders } from '@/lib/shopify';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const first = parseInt(searchParams.get('first') || '15', 10);
    const after = searchParams.get('after') || null;
    const query = searchParams.get('query') || undefined;

    const result = await getRecentOrders({ first, after, query });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch orders from Shopify' }, { status: 500 });
  }
}
