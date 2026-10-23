import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getBrandColor } from '@/lib/shopify';
import { ManifestOrder } from '@/types/manifest';

export const dynamic = 'force-dynamic';

async function generateUniqueManualOrderNumber(): Promise<string> {
  const count = await db.manualOrder.count();
  let candidate = `MAN-${1001 + count}`;
  let exists = await db.manualOrder.findUnique({ where: { orderNumber: candidate } });
  let offset = 1;
  while (exists) {
    candidate = `MAN-${1001 + count + offset}`;
    exists = await db.manualOrder.findUnique({ where: { orderNumber: candidate } });
    offset++;
  }
  return candidate;
}

export async function GET() {
  try {
    const orders = await db.manualOrder.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const manifestOrders: ManifestOrder[] = orders.map((o) => ({
      id: o.orderNumber,
      source: 'manual',
      customer: o.customer,
      customerPhone: o.customerPhone || undefined,
      customerEmail: o.customerEmail || undefined,
      orderDate: o.orderDate.toISOString(),
      createdAt: o.createdAt.toISOString(),
      notes: o.notes || undefined,
      fulfillmentStatus: o.fulfillmentStatus,
      items: o.items.map((it) => ({
        id: it.id,
        productId: it.productId || undefined,
        variantId: it.variantId || undefined,
        name: it.name,
        brand: it.brand,
        brandColor: getBrandColor(it.brand),
        size: it.size,
        color: it.color || undefined,
        sku: it.sku,
        quantity: it.quantity,
        inventoryQuantity: it.inventoryQuantity,
        suggestReady: it.inventoryQuantity !== null ? it.inventoryQuantity >= it.quantity : false,
        status: (it.status as any) || 'pending',
        note: it.note || '',
      })),
    }));

    return NextResponse.json({ orders: manifestOrders });
  } catch (error: any) {
    console.error('Failed to get manual orders:', error);
    return NextResponse.json({ error: error.message || 'Failed to get manual orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customer,
      customerPhone,
      customerEmail,
      orderNumber,
      orderDate,
      notes,
      items,
    } = body;

    // Validation
    if (!customer || typeof customer !== 'string' || !customer.trim()) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 });
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.name || typeof it.name !== 'string' || !it.name.trim()) {
        return NextResponse.json({ error: `Item #${i + 1} must have a product name` }, { status: 400 });
      }
      const qty = Number(it.quantity);
      if (isNaN(qty) || qty < 1) {
        return NextResponse.json({ error: `Item #${i + 1} quantity must be at least 1` }, { status: 400 });
      }
    }

    // Determine order number
    let finalOrderNumber = (orderNumber || '').trim();
    if (!finalOrderNumber) {
      finalOrderNumber = await generateUniqueManualOrderNumber();
    } else {
      // Check for duplicates
      const existing = await db.manualOrder.findUnique({
        where: { orderNumber: finalOrderNumber },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Order number "${finalOrderNumber}" already exists. Please choose a unique order number or leave blank to auto-generate.` },
          { status: 400 }
        );
      }
    }

    const parsedOrderDate = orderDate ? new Date(orderDate) : new Date();

    // Persist to Neon Postgres
    const created = await db.manualOrder.create({
      data: {
        orderNumber: finalOrderNumber,
        customer: customer.trim(),
        customerPhone: customerPhone?.trim() || null,
        customerEmail: customerEmail?.trim() || null,
        orderDate: isNaN(parsedOrderDate.getTime()) ? new Date() : parsedOrderDate,
        notes: notes?.trim() || null,
        source: 'manual',
        fulfillmentStatus: 'UNFULFILLED',
        items: {
          create: items.map((it: any) => ({
            name: it.name.trim(),
            brand: (it.brand || 'Essentials EG').trim(),
            size: (it.size || '—').trim(),
            color: it.color?.trim() || null,
            sku: (it.sku || '').trim(),
            quantity: Math.max(1, parseInt(it.quantity, 10) || 1),
            inventoryQuantity: it.inventoryQuantity !== undefined && it.inventoryQuantity !== null ? Number(it.inventoryQuantity) : null,
            status: it.status || 'pending',
            note: it.note || '',
            productId: it.productId || null,
            variantId: it.variantId || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    const manifestOrder: ManifestOrder = {
      id: created.orderNumber,
      source: 'manual',
      customer: created.customer,
      customerPhone: created.customerPhone || undefined,
      customerEmail: created.customerEmail || undefined,
      orderDate: created.orderDate.toISOString(),
      createdAt: created.createdAt.toISOString(),
      notes: created.notes || undefined,
      fulfillmentStatus: created.fulfillmentStatus,
      items: created.items.map((it) => ({
        id: it.id,
        productId: it.productId || undefined,
        variantId: it.variantId || undefined,
        name: it.name,
        brand: it.brand,
        brandColor: getBrandColor(it.brand),
        size: it.size,
        color: it.color || undefined,
        sku: it.sku,
        quantity: it.quantity,
        inventoryQuantity: it.inventoryQuantity,
        suggestReady: it.inventoryQuantity !== null ? it.inventoryQuantity >= it.quantity : false,
        status: 'pending',
        note: it.note || '',
      })),
    };

    return NextResponse.json({ order: manifestOrder });
  } catch (error: any) {
    console.error('Failed to create manual order:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create manual order' },
      { status: 500 }
    );
  }
}
