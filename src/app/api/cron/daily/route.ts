import { NextResponse } from 'next/server';
import { fetchChainData } from '@/lib/defillama';
import { saveSnapshot } from '@/lib/storage';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET) return true; // Allow if no secret configured
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Daily cron: Fetching fresh data...');
    const snapshot = await fetchChainData();
    await saveSnapshot(snapshot);

    return NextResponse.json({
      status: 'ok',
      message: 'Data refreshed successfully',
      timestamp: snapshot.timestamp,
      chains: snapshot.chains.length,
    });
  } catch (error) {
    console.error('Daily cron failed:', error);
    return NextResponse.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    );
  }
}
