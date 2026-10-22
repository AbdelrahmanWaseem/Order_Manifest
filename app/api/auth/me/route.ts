import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, setSessionCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  // Allow demo query in development/testing mode to inspect UI
  if (req.nextUrl.searchParams.get('demo') === '1') {
    await setSessionCookie();
    return NextResponse.json({ authenticated: true });
  }

  const authed = await isAuthenticated();
  return NextResponse.json({ authenticated: authed });
}
