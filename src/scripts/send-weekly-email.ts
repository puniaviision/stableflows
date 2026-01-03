/**
 * Weekly email script
 *
 * Run manually: npm run send-email
 * Or via Vercel cron: /api/cron/weekly
 */

import 'dotenv/config';
import { fetchChainData } from '../lib/defillama';
import { saveSnapshot, getLatestSnapshot, getWeeklySnapshots, saveAnalysis } from '../lib/storage';
import { generateWeeklyAnalysis, generateSocialPosts } from '../lib/analysis';
import { sendWeeklyEmail } from '../lib/email';

async function main() {
  console.log('Starting weekly email generation...\n');

  // 1. Fetch fresh data
  console.log('1. Fetching fresh data from DeFi Llama...');
  const snapshot = await fetchChainData();
  await saveSnapshot(snapshot);
  console.log(`   ✓ Fetched data for ${snapshot.chains.length} chains\n`);

  // 2. Get previous week's data for comparison
  console.log('2. Getting historical data for comparison...');
  const weeklySnapshots = await getWeeklySnapshots(2);
  const previousSnapshot = weeklySnapshots.length > 1 ? weeklySnapshots[0] : null;
  console.log(`   ✓ Found ${previousSnapshot ? 'previous week data' : 'no previous data'}\n`);

  // 3. Generate AI analysis
  console.log('3. Generating AI analysis...');
  const analysis = await generateWeeklyAnalysis(snapshot, previousSnapshot);
  await saveAnalysis(analysis);
  console.log('   ✓ Generated insights:');
  analysis.bullets.forEach((b, i) => console.log(`     ${i + 1}. ${b.slice(0, 80)}...`));
  console.log();

  // 4. Generate social posts
  console.log('4. Generating social media posts...');
  const socialPosts = await generateSocialPosts(snapshot, analysis.bullets);
  console.log('   ✓ Generated Twitter and LinkedIn posts\n');

  // 5. Send email
  console.log('5. Sending email...');
  await sendWeeklyEmail({
    snapshot,
    analysis,
    socialPosts,
  });
  console.log(`   ✓ Email sent to ${process.env.EMAIL_TO}\n`);

  console.log('Done! Weekly email sent successfully.');
}

main().catch((error) => {
  console.error('Failed to send weekly email:', error);
  process.exit(1);
});
