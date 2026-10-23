import { NextRequest, NextResponse } from 'next/server';
import { getRecentOrders } from '@/lib/shopify';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const first = parseInt(searchParams.get('first') || '250', 10);
    const after = searchParams.get('after') || null;
    const query = searchParams.get('query') || undefined;
    const sinceDate = searchParams.get('sinceDate') || undefined;
    const loadAll = searchParams.get('all') !== 'false';

    const result = await getRecentOrders({ first, after, query, sinceDate, loadAll });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch orders from Shopify' }, { status: 500 });
  }
}
