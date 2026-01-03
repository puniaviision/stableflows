import { NextResponse } from 'next/server';
import { fetchChainData } from '@/lib/defillama';
import { saveSnapshot, getLatestSnapshot } from '@/lib/storage';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Check if we have recent data (within last hour)
    const existing = getLatestSnapshot();
    const now = new Date();

    if (existing) {
      const age = now.getTime() - new Date(existing.timestamp).getTime();
      if (age < 3600000) { // Less than 1 hour old
        return NextResponse.json({
          status: 'cached',
          message: 'Using cached data (less than 1 hour old)',
          timestamp: existing.timestamp,
        });
      }
    }

    // Fetch fresh data
    console.log('Fetching fresh data from DeFi Llama...');
    const snapshot = await fetchChainData();
    saveSnapshot(snapshot);

    return NextResponse.json({
      status: 'refreshed',
      message: 'Data refreshed successfully',
      timestamp: snapshot.timestamp,
      chains: snapshot.chains.length,
    });
  } catch (error) {
    console.error('Failed to refresh data:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to refresh data', error: String(error) },
      { status: 500 }
    );
  }
}
