import { NextResponse } from 'next/server';
import { fetchChainData } from '@/lib/defillama';
import { saveSnapshot, getWeeklySnapshots, saveAnalysis } from '@/lib/storage';
import { generateWeeklyAnalysis, generateSocialPosts } from '@/lib/analysis';
import { sendWeeklyEmail } from '@/lib/email';

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
    console.log('Weekly cron: Starting...');

    // 1. Fetch fresh data
    console.log('1. Fetching fresh data...');
    const snapshot = await fetchChainData();
    await saveSnapshot(snapshot);

    // 2. Get previous data for comparison
    console.log('2. Getting historical data...');
    const weeklySnapshots = await getWeeklySnapshots(2);
    const previousSnapshot = weeklySnapshots.length > 1 ? weeklySnapshots[0] : null;

    // 3. Generate analysis
    console.log('3. Generating AI analysis...');
    const analysis = await generateWeeklyAnalysis(snapshot, previousSnapshot);
    await saveAnalysis(analysis);

    // 4. Generate social posts
    console.log('4. Generating social posts...');
    const socialPosts = await generateSocialPosts(snapshot, analysis.bullets);

    // 5. Send email
    console.log('5. Sending email...');
    await sendWeeklyEmail({
      snapshot,
      analysis,
      socialPosts,
    });

    return NextResponse.json({
      status: 'ok',
      message: 'Weekly email sent successfully',
      timestamp: snapshot.timestamp,
      insights: analysis.bullets,
    });
  } catch (error) {
    console.error('Weekly cron failed:', error);
    return NextResponse.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    );
  }
}
