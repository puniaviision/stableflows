import { TRACKED_CHAINS, ChainData, SnapshotData } from './constants';

const DEFILLAMA_BASE = 'https://api.llama.fi';
const STABLECOINS_BASE = 'https://stablecoins.llama.fi';
const YIELDS_API = 'https://yields.llama.fi/pools';

// Target stablecoins for TVL calculation
const TARGET_STABLES = new Set(['USDC', 'USDT', 'PYUSD']);

// Valid stablecoin symbol patterns (base tokens and known bridged versions)
// This prevents counting vault tokens like VBUSDC, GTUSDC, yvUSDC, etc.
const VALID_STABLE_PATTERNS: RegExp[] = [
  // Exact matches
  /^USDC$/i,
  /^USDT$/i,
  /^PYUSD$/i,
  // Common bridged/wrapped versions (prefix)
  /^(axl|wh|mul|star|lz)?USDC(\.e)?$/i,
  /^(axl|wh|mul|star|lz)?USDT(\.e)?$/i,
  /^(axl|wh|mul|star|lz)?PYUSD(\.e)?$/i,
  // USDC/USDT with chain suffix
  /^USDC\.[a-z]+$/i,
  /^USDT\.[a-z]+$/i,
  // Stargate versions (USDT0, USD₮0)
  /^USDT0$/i,
  /^USD₮0$/i,
  // Simple wrapped versions
  /^WUSDC$/i,
  /^WUSDT$/i,
];

/**
 * Check if a symbol component is a valid stablecoin (not a vault token)
 */
function isValidStablecoin(symbol: string): boolean {
  return VALID_STABLE_PATTERNS.some(pattern => pattern.test(symbol));
}

// Chain name normalization (API uses different names sometimes)
const CHAIN_NAME_MAP: Record<string, string> = {
  'Binance': 'BSC',
  'BNB Chain': 'BSC',
  'Hyperliquid L1': 'Hyperliquid',
};

// Known bad pool IDs to exclude (data quality issues)
const EXCLUDED_POOLS = new Set([
  '5570b69e-8050-465b-8d09-ca0ef07da195', // USDC-USD pool with impossible $20B TVL
]);

// Max reasonable TVL for a single pool (outlier detection)
const MAX_POOL_TVL = 5e9; // $5B - anything higher is likely bad data

function normalizeChainName(name: string): string {
  return CHAIN_NAME_MAP[name] || name;
}

/**
 * Calculate the portion of a pool's TVL attributable to target stablecoins.
 *
 * For single-asset pools: 100% if it's a valid stablecoin (not a vault token)
 * For multi-asset pools: Proportional split based on valid stablecoin components
 */
function calculateStablecoinShare(symbol: string, tvl: number, exposure: string): number {
  // Parse symbol into components, filtering out fee tiers (numbers)
  const parts = symbol
    .replace(/\//g, '-')
    .replace(/_/g, '-')
    .split('-')
    .map(p => p.trim())
    .filter(p => p.length > 0 && !/^\d+$/.test(p));

  if (parts.length === 0) return 0;

  // Count valid stablecoins in the symbol (excludes vault tokens)
  const validStableCount = parts.filter(part => isValidStablecoin(part)).length;

  if (validStableCount === 0) return 0;

  // Single asset pool - count 100% only if it's a valid stablecoin
  if (exposure === 'single' || parts.length === 1) {
    return isValidStablecoin(parts[0]) ? tvl : 0;
  }

  // Multi-asset pool - proportional split based on valid stablecoins
  return tvl * (validStableCount / parts.length);
}

/**
 * Get stablecoin TVL deployed in DeFi protocols per chain.
 * Uses the Yields API for pool-level data with data quality filtering.
 */
async function fetchDefiStableTvlByChain(): Promise<Record<string, number>> {
  console.log('Fetching DeFi pools data from Yields API...');

  const response = await fetch(YIELDS_API);
  const data = await response.json();
  const pools = data.data || [];

  console.log(`  Found ${pools.length} total pools`);

  const chainTvl: Record<string, number> = {};
  const chainPools: Record<string, number> = {};
  let excludedCount = 0;
  let outlierCount = 0;

  // Initialize
  for (const chain of TRACKED_CHAINS) {
    chainTvl[chain] = 0;
    chainPools[chain] = 0;
  }

  for (const pool of pools) {
    const rawChain = pool.chain || '';
    const chain = normalizeChainName(rawChain);
    const poolId = pool.pool || '';
    const symbol = pool.symbol || '';
    const tvl = pool.tvlUsd || 0;
    const exposure = pool.exposure || 'single';

    // Skip non-tracked chains
    if (!TRACKED_CHAINS.includes(chain as any)) continue;

    // Skip pools with no TVL
    if (tvl <= 0) continue;

    // Skip known bad data
    if (EXCLUDED_POOLS.has(poolId)) {
      excludedCount++;
      continue;
    }

    // Skip outliers (sanity check)
    if (tvl > MAX_POOL_TVL) {
      console.log(`  Skipping outlier: ${chain} ${symbol} with $${(tvl/1e9).toFixed(2)}B TVL`);
      outlierCount++;
      continue;
    }

    const share = calculateStablecoinShare(symbol, tvl, exposure);

    if (share > 0) {
      chainTvl[chain] += share;
      chainPools[chain]++;
    }
  }

  console.log(`  Excluded ${excludedCount} known bad pools, ${outlierCount} outliers`);

  for (const chain of TRACKED_CHAINS) {
    if (chainPools[chain] > 0) {
      console.log(`  ${chain}: $${(chainTvl[chain]/1e9).toFixed(2)}B from ${chainPools[chain]} pools`);
    }
  }

  return chainTvl;
}

/**
 * Get total stablecoin (USDC + USDT + PYUSD) supply per chain.
 */
async function fetchStablecoinSupplyByChain(): Promise<Record<string, number>> {
  console.log('Fetching stablecoin supply data...');

  const response = await fetch(`${STABLECOINS_BASE}/stablecoins?includePrices=false`);
  const data = await response.json();

  // Find our target stablecoins
  const targetIds: Record<string, string> = {};
  for (const stable of data.peggedAssets || []) {
    const symbol = (stable.symbol || '').toUpperCase();
    if (TARGET_STABLES.has(symbol)) {
      targetIds[stable.id] = symbol;
    }
  }

  console.log(`  Found ${Object.keys(targetIds).length} target stablecoins: ${Object.values(targetIds).join(', ')}`);

  const chainSupply: Record<string, number> = {};

  // Initialize
  for (const chain of TRACKED_CHAINS) {
    chainSupply[chain] = 0;
  }

  for (const stable of data.peggedAssets || []) {
    if (!targetIds[stable.id]) continue;

    const chainCirculating = stable.chainCirculating || {};

    for (const [rawChain, chainData] of Object.entries(chainCirculating)) {
      const chain = normalizeChainName(rawChain);
      if (!TRACKED_CHAINS.includes(chain as any)) continue;

      const current = (chainData as any).current || {};
      const amount = current.peggedUSD || 0;
      chainSupply[chain] += amount;
    }
  }

  return chainSupply;
}

/**
 * Get total DeFi TVL per chain (all assets).
 */
async function fetchTotalDefiTvlByChain(): Promise<Record<string, number>> {
  console.log('Fetching total DeFi TVL by chain...');

  // Use /chains endpoint (includes double-counting + liquid staking)
  // Note: Numbers differ from DeFi Llama homepage which excludes liquid staking
  const response = await fetch(`${DEFILLAMA_BASE}/chains`);
  const data = await response.json();

  const chainTvl: Record<string, number> = {};

  for (const chain of data) {
    const name = normalizeChainName(chain.name || '');
    if (TRACKED_CHAINS.includes(name as any)) {
      chainTvl[name] = chain.tvl || 0;
    }
  }

  return chainTvl;
}

/**
 * Main function to fetch all data and compute metrics.
 */
export async function fetchChainData(): Promise<SnapshotData> {
  // Fetch all data in parallel
  const [stableTvl, stableSupply, totalDefiTvl] = await Promise.all([
    fetchDefiStableTvlByChain(),
    fetchStablecoinSupplyByChain(),
    fetchTotalDefiTvlByChain(),
  ]);

  const chains: ChainData[] = [];
  let totalStableTvl = 0;
  let totalDefiTvl_sum = 0;
  let totalStableSupply = 0;

  for (const chainName of TRACKED_CHAINS) {
    const chainStableTvl = stableTvl[chainName] || 0;
    const chainDefiTvl = totalDefiTvl[chainName] || 0;
    const chainStableSupply = stableSupply[chainName] || 0;

    // Stablecoin Utilization: What % of stables on chain are in DeFi
    const utilPercent = chainStableSupply > 0
      ? (chainStableTvl / chainStableSupply) * 100
      : 0;

    // Stablecoin % of DeFi: What % of DeFi TVL is stablecoins
    const stblDefiPercent = chainDefiTvl > 0
      ? (chainStableTvl / chainDefiTvl) * 100
      : 0;

    chains.push({
      rank: 0,
      chain: chainName,
      stableTvl: chainStableTvl,
      defiTvl: chainDefiTvl,
      stableSupply: chainStableSupply,
      utilPercent,
      stblDefiPercent,
    });

    totalStableTvl += chainStableTvl;
    totalDefiTvl_sum += chainDefiTvl;
    totalStableSupply += chainStableSupply;
  }

  // Sort by Stable TVL descending and assign ranks
  chains.sort((a, b) => b.stableTvl - a.stableTvl);
  chains.forEach((chain, index) => {
    chain.rank = index + 1;
  });

  const totals = {
    stableTvl: totalStableTvl,
    defiTvl: totalDefiTvl_sum,
    stableSupply: totalStableSupply,
    utilPercent: totalStableSupply > 0 ? (totalStableTvl / totalStableSupply) * 100 : 0,
    stblDefiPercent: totalDefiTvl_sum > 0 ? (totalStableTvl / totalDefiTvl_sum) * 100 : 0,
  };

  return {
    timestamp: new Date().toISOString(),
    chains,
    totals,
  };
}

// Format number as currency
export function formatCurrency(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

// Format percentage
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
