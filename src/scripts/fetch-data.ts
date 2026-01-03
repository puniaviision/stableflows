/**
 * Data fetch script
 *
 * Run manually: npm run fetch-data
 * Or via Vercel cron: /api/cron/daily
 */

import 'dotenv/config';
import { fetchChainData, formatCurrency, formatPercent } from '../lib/defillama';
import { saveSnapshot } from '../lib/storage';

async function main() {
  console.log('Fetching data from DeFi Llama...\n');

  const snapshot = await fetchChainData();
  saveSnapshot(snapshot);

  console.log('Chain Rankings by Stable TVL:\n');
  console.log('Rank  Chain         Stable TVL      DeFi TVL    Supply         Util%    Stbl/DeFi');
  console.log('─'.repeat(90));

  for (const chain of snapshot.chains) {
    console.log(
      `${chain.rank.toString().padStart(2)}    ${chain.chain.padEnd(12)}  ` +
      `${formatCurrency(chain.stableTvl).padStart(12)}  ` +
      `${formatCurrency(chain.defiTvl).padStart(12)}  ` +
      `${formatCurrency(chain.stableSupply).padStart(12)}  ` +
      `${formatPercent(chain.utilPercent).padStart(7)}  ` +
      `${formatPercent(chain.stblDefiPercent).padStart(9)}`
    );
  }

  console.log('─'.repeat(90));
  console.log(
    `      ${'TOTAL'.padEnd(12)}  ` +
    `${formatCurrency(snapshot.totals.stableTvl).padStart(12)}  ` +
    `${formatCurrency(snapshot.totals.defiTvl).padStart(12)}  ` +
    `${formatCurrency(snapshot.totals.stableSupply).padStart(12)}  ` +
    `${formatPercent(snapshot.totals.utilPercent).padStart(7)}  ` +
    `${formatPercent(snapshot.totals.stblDefiPercent).padStart(9)}`
  );

  console.log(`\nData saved at ${snapshot.timestamp}`);
}

main().catch((error) => {
  console.error('Failed to fetch data:', error);
  process.exit(1);
});
