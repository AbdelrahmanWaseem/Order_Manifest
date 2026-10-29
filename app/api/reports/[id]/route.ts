import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'reports');

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 1. Try DB first
    try {
      const row = await db.report.findUnique({
        where: { id: params.id },
      });

      if (row) {
        // The DB stores the full ReportSnapshot inside `snapshot`.
        // Unwrap it so callers always get a proper ReportSnapshot shape.
        const snapshot = row.snapshot as any;
        const report =
          snapshot && typeof snapshot === 'object' && snapshot.counts
            ? snapshot
            : {
                id: row.id,
                createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
                orderCount: row.orderCount,
                itemCount: row.itemCount,
                ...snapshot,
              };
        return NextResponse.json({ report });
      }
    } catch (dbErr) {
      // ignore
    }

    // 2. Fall back to local disk file
    const filePath = path.join(DATA_DIR, `${params.id}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const report = JSON.parse(content);
      return NextResponse.json({ report });
    }

    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  } catch (err: any) {
    console.error('Failed to get report:', err);
    return NextResponse.json({ error: err.message || 'Failed to get report' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reportId = params.id;

    // 1. Delete from PostgreSQL if available
    try {
      const existing = await db.report.findUnique({ where: { id: reportId } });
      if (existing) {
        await db.report.delete({ where: { id: reportId } });
        if (existing.batchId) {
          try {
            await db.batch.delete({ where: { id: existing.batchId } });
          } catch {}
        }
      }
    } catch (dbErr) {
      console.warn('DB delete error, continuing with local file cleanup:', dbErr);
    }

    // 2. Delete local file
    const filePath = path.join(DATA_DIR, `${reportId}.json`);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error('Error removing report file:', e);
      }
    }

    return NextResponse.json({ success: true, deletedId: reportId });
  } catch (err: any) {
    console.error('Failed to delete report:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete report' }, { status: 500 });
  }
}
