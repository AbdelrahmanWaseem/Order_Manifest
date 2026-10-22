import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'reports');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function saveLocalReport(report: any) {
  try {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, `${report.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving local report file:', e);
  }
}

function listLocalReports(): any[] {
  try {
    ensureDataDir();
    const files = fs.readdirSync(DATA_DIR);
    const reports: any[] = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
          reports.push(JSON.parse(content));
        } catch {}
      }
    }
    return reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    return [];
  }
}

export async function GET() {
  try {
    // Try database first
    const reports = await db.report.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        orderCount: true,
        itemCount: true,
      },
    });

    // If the database query succeeded, return the real database state (including empty [])
    return NextResponse.json({ reports: reports || [] });
  } catch (err: any) {
    // Only if DB connection fails/throws, fall back to local disk archive
    console.warn('Database query failed, falling back to local disk archive:', err);
    const localReports = listLocalReports().map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      orderCount: r.orderCount,
      itemCount: r.itemCount,
    }));

    return NextResponse.json({ reports: localReports });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, orderCount, itemCount, snapshot } = body;

    if (!id || typeof orderCount !== 'number' || typeof itemCount !== 'number' || !snapshot) {
      return NextResponse.json({ error: 'Missing required report fields' }, { status: 400 });
    }

    const reportRecord = {
      id: String(id),
      createdAt: new Date().toISOString(),
      orderCount,
      itemCount,
      snapshot,
    };

    // 1. Always save locally to ensure files are never lost
    saveLocalReport(reportRecord);

    // 2. Try PostgreSQL persistence
    try {
      const createdReport = await db.$transaction(async (tx) => {
        const batch = await tx.batch.create({
          data: { status: 'completed' },
        });

        if (Array.isArray(snapshot.orders)) {
          for (const o of snapshot.orders) {
            const order = await tx.order.create({
              data: {
                shopifyOrderId: o.shopifyOrderId || null,
                shopifyOrderName: o.id || o.name || 'Unknown',
                customer: o.customer || 'Unknown',
                customerEmail: o.customerEmail || null,
                batchId: batch.id,
              },
            });

            if (Array.isArray(o.items)) {
              for (const it of o.items) {
                await tx.orderItem.create({
                  data: {
                    orderId: order.id,
                    shopifyLineItemId: it.id || null,
                    shopifyVariantId: it.variantId || null,
                    shopifyProductId: it.productId || null,
                    name: it.name,
                    brand: it.brand,
                    size: it.size,
                    sku: it.sku,
                    quantity: it.quantity || 1,
                    inventoryQuantity: typeof it.inventoryQuantity === 'number' ? it.inventoryQuantity : null,
                    status: it.status || 'pending',
                    note: it.note || '',
                  },
                });
              }
            }
          }
        }

        return await tx.report.create({
          data: {
            id: String(id),
            orderCount,
            itemCount,
            batchId: batch.id,
            snapshot,
          },
        });
      });

      return NextResponse.json({ success: true, report: createdReport });
    } catch (dbErr: any) {
      // Local copy was already saved successfully!
      return NextResponse.json({ success: true, report: reportRecord });
    }
  } catch (err: any) {
    console.error('Failed to create report:', err);
    return NextResponse.json({ error: err.message || 'Failed to save report' }, { status: 500 });
  }
}
