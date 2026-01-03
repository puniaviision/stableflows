#!/usr/bin/env npx ts-node
/**
 * Weekly Report Generator
 *
 * Run: npm run weekly
 *
 * Optional: Set ANTHROPIC_API_KEY env var for AI-generated insights
 * Without it, you'll get basic rule-based insights (still useful!)
 */

import 'dotenv/config';

interface ChainData {
  rank: number;
  chain: string;
  stableTvl: number;
  defiTvl: number;
  stableSupply: number;
  utilPercent: number;
  stblDefiPercent: number;
}

interface SnapshotData {
  timestamp: string;
  chains: ChainData[];
  totals: {
    stableTvl: number;
    defiTvl: number;
    stableSupply: number;
    utilPercent: number;
    stblDefiPercent: number;
  };
}

// Tracked chains and stablecoins
const TRACKED_CHAINS = ['Ethereum', 'Base', 'Solana', 'Arbitrum', 'Avalanche', 'BSC', 'Tron', 'Hyperliquid', 'Polygon', 'Aptos', 'Sui', 'Plasma', 'Katana'];
const TARGET_STABLECOINS = ['USDT', 'USDC', 'PYUSD'];
const CHAIN_NAME_MAP: Record<string, string> = { 'Binance': 'BSC', 'BNB Chain': 'BSC', 'Hyperliquid L1': 'Hyperliquid' };

// Fetch data directly from DeFi Llama
async function fetchFreshData(): Promise<SnapshotData> {
  console.log('Fetching from DeFi Llama APIs...');

  // Fetch all data in parallel
  const [poolsRes, stablecoinsRes, chainsRes] = await Promise.all([
    fetch('https://yields.llama.fi/pools'),
    fetch('https://stablecoins.llama.fi/stablecoins?includePrices=false'),
    fetch('https://api.llama.fi/chains'),
  ]);

  const poolsData = await poolsRes.json();
  const stablecoinsData = await stablecoinsRes.json();
  const chainsData = await chainsRes.json();

  // Process stablecoin supply by chain
  const stableSupplyByChain: Record<string, number> = {};
  const targetStables = stablecoinsData.peggedAssets.filter((s: any) => TARGET_STABLECOINS.includes(s.symbol));

  for (const stable of targetStables) {
    if (!stable.chainCirculating) continue;
    for (const [chain, data] of Object.entries(stable.chainCirculating) as [string, any][]) {
      const normalizedChain = CHAIN_NAME_MAP[chain] || chain;
      if (!TRACKED_CHAINS.includes(normalizedChain)) continue;
      const amount = data?.peggedUSD || 0;
      stableSupplyByChain[normalizedChain] = (stableSupplyByChain[normalizedChain] || 0) + amount;
    }
  }

  // Process DeFi TVL by chain
  const defiTvlByChain: Record<string, number> = {};
  for (const chain of chainsData) {
    const normalizedName = CHAIN_NAME_MAP[chain.name] || chain.name;
    if (TRACKED_CHAINS.includes(normalizedName)) {
      defiTvlByChain[normalizedName] = chain.tvl || 0;
    }
  }

  // Process stable TVL from pools
  const stableTvlByChain: Record<string, number> = {};
  const pools = poolsData.data || [];

  for (const pool of pools) {
    const chain = CHAIN_NAME_MAP[pool.chain] || pool.chain;
    if (!TRACKED_CHAINS.includes(chain)) continue;

    const symbols = (pool.symbol || '').toUpperCase().split(/[-\/]/);
    const stableCount = symbols.filter((s: string) => TARGET_STABLECOINS.some(t => s.includes(t))).length;
    if (stableCount === 0) continue;

    const tvl = pool.tvlUsd || 0;
    if (tvl > 10_000_000_000) continue; // Skip outliers

    const stablePortion = (stableCount / symbols.length) * tvl;
    stableTvlByChain[chain] = (stableTvlByChain[chain] || 0) + stablePortion;
  }

  // Build chain data
  const chains: ChainData[] = TRACKED_CHAINS.map(chain => {
    const stableTvl = stableTvlByChain[chain] || 0;
    const defiTvl = defiTvlByChain[chain] || 0;
    const stableSupply = stableSupplyByChain[chain] || 0;
    return {
      rank: 0,
      chain,
      stableTvl,
      defiTvl,
      stableSupply,
      utilPercent: stableSupply > 0 ? (stableTvl / stableSupply) * 100 : 0,
      stblDefiPercent: defiTvl > 0 ? (stableTvl / defiTvl) * 100 : 0,
    };
  })
  .sort((a, b) => b.stableTvl - a.stableTvl)
  .map((chain, i) => ({ ...chain, rank: i + 1 }));

  // Calculate totals
  const totals = chains.reduce((acc, c) => ({
    stableTvl: acc.stableTvl + c.stableTvl,
    defiTvl: acc.defiTvl + c.defiTvl,
    stableSupply: acc.stableSupply + c.stableSupply,
    utilPercent: 0,
    stblDefiPercent: 0,
  }), { stableTvl: 0, defiTvl: 0, stableSupply: 0, utilPercent: 0, stblDefiPercent: 0 });

  totals.utilPercent = totals.stableSupply > 0 ? (totals.stableTvl / totals.stableSupply) * 100 : 0;
  totals.stblDefiPercent = totals.defiTvl > 0 ? (totals.stableTvl / totals.defiTvl) * 100 : 0;

  return {
    timestamp: new Date().toISOString(),
    chains,
    totals,
  };
}

// Formatting helpers
function formatCurrency(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(0)}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Generate basic insights without AI
function generateBasicInsights(data: SnapshotData): string[] {
  const insights: string[] = [];
  const { chains, totals } = data;

  // Total stable TVL insight
  insights.push(
    `Total stablecoin TVL across tracked chains: ${formatCurrency(totals.stableTvl)} with ${formatPercent(totals.utilPercent)} utilization rate.`
  );

  // Top chain
  const top = chains[0];
  const topShare = ((top.stableTvl / totals.stableTvl) * 100).toFixed(1);
  insights.push(
    `${top.chain} leads with ${formatCurrency(top.stableTvl)} in stable TVL (${topShare}% of total), maintaining ${formatPercent(top.utilPercent)} utilization.`
  );

  // Highest utilization chain (excluding tiny chains)
  const significantChains = chains.filter(c => c.stableTvl > 100_000_000);
  const highestUtil = significantChains.reduce((a, b) => a.utilPercent > b.utilPercent ? a : b);
  if (highestUtil.chain !== top.chain) {
    insights.push(
      `${highestUtil.chain} shows highest capital efficiency at ${formatPercent(highestUtil.utilPercent)} utilization with ${formatCurrency(highestUtil.stableTvl)} deployed.`
    );
  } else {
    // Find rising chain instead
    const rising = chains.slice(1, 5).reduce((a, b) => a.stableTvl > b.stableTvl ? a : b);
    insights.push(
      `${rising.chain} holds #${rising.rank} position with ${formatCurrency(rising.stableTvl)} stable TVL and ${formatPercent(rising.utilPercent)} utilization.`
    );
  }

  return insights;
}

// Generate AI insights using Anthropic
async function generateAIInsights(data: SnapshotData): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log('No ANTHROPIC_API_KEY found, using basic insights...\n');
    return generateBasicInsights(data);
  }

  console.log('Generating AI insights...\n');

  const prompt = `You are analyzing weekly stablecoin flow data across DeFi protocols. Generate exactly 3 concise bullet points (1-2 sentences each) highlighting the most interesting insights.

Data:
- Total Stable TVL: ${formatCurrency(data.totals.stableTvl)}
- Total DeFi TVL: ${formatCurrency(data.totals.defiTvl)}
- Overall Utilization: ${formatPercent(data.totals.utilPercent)}
- Stablecoin/DeFi Ratio: ${formatPercent(data.totals.stblDefiPercent)}

Top chains by Stable TVL:
${data.chains.slice(0, 8).map(c =>
  `${c.rank}. ${c.chain}: ${formatCurrency(c.stableTvl)} stable TVL, ${formatPercent(c.utilPercent)} util, ${formatPercent(c.stblDefiPercent)} stbl/defi`
).join('\n')}

Focus on: capital efficiency, notable patterns, relative positioning. Be specific with numbers. No generic statements.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      console.log('AI API error, falling back to basic insights...\n');
      return generateBasicInsights(data);
    }

    const result = await response.json();
    const text = result.content[0].text;

    // Parse bullet points
    const bullets = text
      .split('\n')
      .filter((line: string) => line.match(/^[-•*]\s/) || line.match(/^\d+\./))
      .map((line: string) => line.replace(/^[-•*\d.]\s*/, '').trim())
      .filter((line: string) => line.length > 0)
      .slice(0, 3);

    return bullets.length >= 3 ? bullets : generateBasicInsights(data);
  } catch (error) {
    console.log('AI request failed, using basic insights...\n');
    return generateBasicInsights(data);
  }
}

// Generate Twitter post
function generateTwitterPost(data: SnapshotData, insights: string[]): string {
  const { totals, chains } = data;
  const top3 = chains.slice(0, 3);

  return `Weekly Stablecoin Flows 🧵

${formatCurrency(totals.stableTvl)} in stablecoins deployed across DeFi

Top chains:
1. ${top3[0].chain}: ${formatCurrency(top3[0].stableTvl)}
2. ${top3[1].chain}: ${formatCurrency(top3[1].stableTvl)}
3. ${top3[2].chain}: ${formatCurrency(top3[2].stableTvl)}

${insights[0]}

Full dashboard: stableflows.finance`;
}

// Generate LinkedIn post
function generateLinkedInPost(data: SnapshotData, insights: string[]): string {
  const { totals, chains } = data;
  const top5 = chains.slice(0, 5);

  return `Weekly Stablecoin Flows Update

${formatCurrency(totals.stableTvl)} in USDC, USDT, and PYUSD currently deployed across DeFi protocols.

Top 5 Chains:
${top5.map(c => `• ${c.chain}: ${formatCurrency(c.stableTvl)}`).join('\n')}

Key Insights:
${insights.map(i => `• ${i}`).join('\n')}

Why track stablecoin flows? They're a cleaner signal of real economic activity than speculative TVL metrics.

Full data: stableflows.finance

#DeFi #Stablecoins #Crypto`;
}

// Generate Substack newsletter
function generateSubstackPost(data: SnapshotData, insights: string[], dateStr: string): string {
  const { totals, chains } = data;

  // Find interesting movers for narrative
  const top = chains[0];
  const topShare = ((top.stableTvl / totals.stableTvl) * 100).toFixed(0);

  return `# Weekly Stablecoin Flows

*${dateStr}*

---

## The Numbers

**${formatCurrency(totals.stableTvl)}** in stablecoins deployed across DeFi this week.

${top.chain} continues to dominate with ${formatCurrency(top.stableTvl)} (${topShare}% of total stable TVL).

| Chain | Stable TVL | Stbl/DeFi |
|-------|-----------|-----------|
${chains.map(c => `| ${c.chain} | ${formatCurrency(c.stableTvl)} | ${formatPercent(c.stblDefiPercent)} |`).join('\n')}

---

## Key Insights

${insights.map((insight, i) => `**${i + 1}.** ${insight}`).join('\n\n')}

---

## What This Means

Stablecoin flows tell us where real capital is being deployed - not speculative token valuations, but actual dollars at work in DeFi.

When you see ${formatCurrency(totals.stableTvl)} in stablecoins actively deployed, that's ${formatCurrency(totals.stableTvl)} of real economic activity.

---

## Explore the Data

Full interactive dashboard: [stableflows.finance](https://stableflows.finance)

---

*Built by [Punia](https://x.com/puniaviision) at Underwriting Crypto*

[screenshot of stableflows.finance dashboard here]`;
}

// Main
async function main() {
  console.log('='.repeat(60));
  console.log('WEEKLY STABLECOIN FLOWS REPORT');
  console.log('='.repeat(60));
  console.log();

  // Fetch fresh data from DeFi Llama
  const data = await fetchFreshData();
  console.log('Done!\n');

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  console.log(`Date: ${dateStr}`);
  console.log(`Data timestamp: ${data.timestamp}\n`);

  // Generate insights
  const insights = await generateAIInsights(data);

  // Print insights
  console.log('='.repeat(60));
  console.log('KEY INSIGHTS');
  console.log('='.repeat(60));
  insights.forEach((insight, i) => {
    console.log(`\n${i + 1}. ${insight}`);
  });

  // Print data table
  console.log('\n');
  console.log('='.repeat(60));
  console.log('CHAIN RANKINGS');
  console.log('='.repeat(60));
  console.log();
  console.log('Rank  Chain          Stable TVL      Util %    Stbl/DeFi');
  console.log('-'.repeat(60));
  data.chains.forEach(chain => {
    console.log(
      `${String(chain.rank).padStart(4)}  ${chain.chain.padEnd(13)} ${formatCurrency(chain.stableTvl).padStart(12)}  ${formatPercent(chain.utilPercent).padStart(8)}  ${formatPercent(chain.stblDefiPercent).padStart(10)}`
    );
  });
  console.log('-'.repeat(60));
  console.log(
    `      TOTAL        ${formatCurrency(data.totals.stableTvl).padStart(12)}  ${formatPercent(data.totals.utilPercent).padStart(8)}  ${formatPercent(data.totals.stblDefiPercent).padStart(10)}`
  );

  // Print templates
  console.log('\n');
  console.log('='.repeat(60));
  console.log('TWITTER (copy below)');
  console.log('='.repeat(60));
  console.log();
  console.log(generateTwitterPost(data, insights));

  console.log('\n');
  console.log('='.repeat(60));
  console.log('LINKEDIN (copy below)');
  console.log('='.repeat(60));
  console.log();
  console.log(generateLinkedInPost(data, insights));

  console.log('\n');
  console.log('='.repeat(60));
  console.log('SUBSTACK (copy below - paste into Substack editor)');
  console.log('='.repeat(60));
  console.log();
  console.log(generateSubstackPost(data, insights, dateStr));

  console.log('\n');
  console.log('='.repeat(60));
  console.log('DONE! Remember to screenshot stableflows.finance for visuals.');
  console.log('='.repeat(60));
}

main().catch(console.error);
