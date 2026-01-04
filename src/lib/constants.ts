// Chains to track (in order of expected ranking)
export const TRACKED_CHAINS = [
  'Ethereum',
  'Base',
  'Solana',
  'Arbitrum',
  'Avalanche',
  'BSC',
  'Tron',
  'Hyperliquid',
  'Polygon',
  'Aptos',
  'Sui',
  'Plasma',
] as const;

// Map chain names to DeFi Llama slugs (some differ)
export const CHAIN_SLUGS: Record<string, string> = {
  'Ethereum': 'ethereum',
  'Base': 'base',
  'Solana': 'solana',
  'Arbitrum': 'arbitrum',
  'Avalanche': 'avax',
  'BSC': 'bsc',
  'Tron': 'tron',
  'Hyperliquid': 'hyperliquid',
  'Polygon': 'polygon',
  'Aptos': 'aptos',
  'Sui': 'sui',
  'Plasma': 'plasma',
};

// Stablecoins to include in Stable TVL
export const TRACKED_STABLECOINS = [
  'USDC',
  'USDT',
  'PYUSD',
] as const;

// DeFi Llama stablecoin IDs (from their API)
export const STABLECOIN_IDS: Record<string, number> = {
  'USDT': 1,
  'USDC': 2,
  'PYUSD': 115,
};

export type ChainName = typeof TRACKED_CHAINS[number];

export interface ChainData {
  rank: number;
  chain: ChainName;
  stableTvl: number;      // USDC + USDT + PYUSD in DeFi
  defiTvl: number;        // Total DeFi TVL
  stableSupply: number;   // Total stablecoins on chain
  utilPercent: number;    // stableTvl / stableSupply
  stblDefiPercent: number; // stableTvl / defiTvl
}

export interface SnapshotData {
  timestamp: string;      // ISO date
  chains: ChainData[];
  totals: {
    stableTvl: number;
    defiTvl: number;
    stableSupply: number;
    utilPercent: number;
    stblDefiPercent: number;
  };
}

export interface WeeklyAnalysis {
  timestamp: string;
  bullets: string[];
  imageUrl?: string;
}
