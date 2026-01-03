import Anthropic from '@anthropic-ai/sdk';
import { SnapshotData, WeeklyAnalysis } from './constants';
import { formatCurrency, formatPercent } from './defillama';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateWeeklyAnalysis(
  current: SnapshotData,
  previous: SnapshotData | null
): Promise<WeeklyAnalysis> {
  // Build comparison data
  const comparisonData = buildComparisonData(current, previous);

  const prompt = `You are an analyst for "Underwriting Crypto," a newsletter covering capital markets onchain with focus on lending and stablecoins.

Analyze this weekly stablecoin flow data across DeFi protocols. Generate exactly 3 bullet points highlighting the most interesting insights.

Focus on:
1. Week-over-week changes (what moved significantly?)
2. Notable outliers (anything unusual or surprising?)
3. Trend narratives (what's the bigger picture?)

Be specific with numbers. Be declarative and confident. Avoid hype or speculation.

Current Data (${current.timestamp.split('T')[0]}):
${comparisonData}

IMPORTANT: Return ONLY a JSON array with exactly 3 strings. No markdown, no explanation, just the JSON array.

Example format:
["First bullet point here.", "Second bullet point here.", "Third bullet point here."]`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  // Extract text from response
  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  // Parse JSON array from response
  let bullets: string[];
  try {
    bullets = JSON.parse(text.trim());
  } catch {
    // Try to extract JSON from response
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      bullets = JSON.parse(match[0]);
    } else {
      // Fall back to splitting by newlines
      bullets = text
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .slice(0, 3);
    }
  }

  return {
    timestamp: new Date().toISOString(),
    bullets: bullets.slice(0, 3),
  };
}

function buildComparisonData(current: SnapshotData, previous: SnapshotData | null): string {
  const lines: string[] = [];

  lines.push('Chain Rankings by Stable TVL:');
  lines.push('');

  for (const chain of current.chains) {
    const prevChain = previous?.chains.find((c) => c.chain === chain.chain);

    let changeLine = '';
    if (prevChain) {
      const tvlChange = ((chain.stableTvl - prevChain.stableTvl) / prevChain.stableTvl) * 100;
      const utilChange = chain.utilPercent - prevChain.utilPercent;
      changeLine = ` | WoW: ${tvlChange >= 0 ? '+' : ''}${tvlChange.toFixed(1)}% TVL, ${utilChange >= 0 ? '+' : ''}${utilChange.toFixed(1)}pp Util`;
    }

    lines.push(
      `${chain.rank}. ${chain.chain}: Stable TVL ${formatCurrency(chain.stableTvl)}, ` +
      `Util ${formatPercent(chain.utilPercent)}, ` +
      `Stbl/DeFi ${formatPercent(chain.stblDefiPercent)}${changeLine}`
    );
  }

  lines.push('');
  lines.push(`TOTALS: Stable TVL ${formatCurrency(current.totals.stableTvl)}, ` +
    `Util ${formatPercent(current.totals.utilPercent)}, ` +
    `Stbl/DeFi ${formatPercent(current.totals.stblDefiPercent)}`
  );

  if (previous) {
    const totalTvlChange = ((current.totals.stableTvl - previous.totals.stableTvl) / previous.totals.stableTvl) * 100;
    lines.push(`Total WoW Change: ${totalTvlChange >= 0 ? '+' : ''}${totalTvlChange.toFixed(1)}%`);
  }

  return lines.join('\n');
}

// Generate social media posts
export async function generateSocialPosts(
  current: SnapshotData,
  bullets: string[]
): Promise<{ twitter: string; linkedin: string }> {
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Twitter post
  const twitterPrompt = `Generate a Twitter post for the weekly Stablecoin Flow Tracker update.

Date: ${dateStr}
Key insights:
${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Top chains by Stable TVL:
${current.chains.slice(0, 5).map((c) => `- ${c.chain}: ${formatCurrency(c.stableTvl)}`).join('\n')}

Format:
- Start with: "Weekly Stablecoin Flow Update 📊"
- Include the 3 key insights
- Tag relevant protocols/chains with @handles where applicable
- End with link placeholder: [link]
- Keep under 280 chars per tweet (can be a thread of 2-3 tweets)

Return ONLY the tweet text, no explanation.`;

  const twitterResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: twitterPrompt }],
  });

  const twitter = twitterResponse.content[0].type === 'text'
    ? twitterResponse.content[0].text.trim()
    : '';

  // LinkedIn post
  const linkedinPrompt = `Generate a LinkedIn post for the weekly Stablecoin Flow Tracker update.

Date: ${dateStr}
Key insights:
${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Top chains by Stable TVL:
${current.chains.slice(0, 5).map((c) => `- ${c.chain}: ${formatCurrency(c.stableTvl)}`).join('\n')}

Format:
- Professional but engaging tone
- Start with a hook about stablecoin flows
- Include the 3 key insights as bullet points
- Use full company/protocol names (not @handles)
- End with: "Full dashboard: [link]"
- Include relevant hashtags at the end

Return ONLY the LinkedIn post text, no explanation.`;

  const linkedinResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: linkedinPrompt }],
  });

  const linkedin = linkedinResponse.content[0].type === 'text'
    ? linkedinResponse.content[0].text.trim()
    : '';

  return { twitter, linkedin };
}
