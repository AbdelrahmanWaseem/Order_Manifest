import { NextRequest, NextResponse } from 'next/server';
import { searchShopifyProducts } from '@/lib/shopify';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    const products = await searchShopifyProducts(query, limit);
    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Error fetching Shopify products:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to search products' },
      { status: 500 }
    );
  }
}
