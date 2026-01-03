'use client';

import { ChainData } from '@/lib/constants';
import { formatCurrency, formatPercent } from '@/lib/defillama';

interface DataTableProps {
  chains: ChainData[];
  totals: {
    stableTvl: number;
    defiTvl: number;
    stableSupply: number;
    utilPercent: number;
    stblDefiPercent: number;
  };
  previousChains?: ChainData[];
}

// Chain colors for visual distinction
const chainColors: Record<string, string> = {
  'Ethereum': '#627EEA',
  'Base': '#0052FF',
  'Solana': '#9945FF',
  'Arbitrum': '#28A0F0',
  'Avalanche': '#E84142',
  'BSC': '#F0B90B',
  'Tron': '#FF0000',
  'Hyperliquid': '#00D4AA',
  'Polygon': '#8247E5',
  'Aptos': '#66CDAA',
  'Sui': '#6FBCF0',
  'Plasma': '#E040FB',
  'Katana': '#FF6B6B',
};

function ChangeIndicator({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined || previous === 0) return null;

  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 0.1) return null;

  const isPositive = change > 0;
  return (
    <span className={`change-badge ${isPositive ? 'positive' : 'negative'}`}>
      {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
    </span>
  );
}

export default function DataTable({ chains, totals, previousChains }: DataTableProps) {
  const previousByChain = previousChains?.reduce((acc, c) => {
    acc[c.chain] = c;
    return acc;
  }, {} as Record<string, ChainData>);

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Chain</th>
            <th>Stable TVL</th>
            <th>DeFi TVL</th>
            <th>Stable Supply</th>
            <th>Util %</th>
            <th>Stbl/DeFi</th>
          </tr>
        </thead>
        <tbody>
          {chains.map((chain) => {
            const prev = previousByChain?.[chain.chain];
            const color = chainColors[chain.chain] || '#888';
            return (
              <tr key={chain.chain}>
                <td>
                  <span
                    className="rank-badge"
                    style={{ backgroundColor: color + '20', color }}
                  >
                    {chain.rank}
                  </span>
                </td>
                <td>
                  <div className="chain-indicator">
                    <div className="chain-dot" style={{ backgroundColor: color, color }} />
                    <span className="chain-name">{chain.chain}</span>
                  </div>
                </td>
                <td className="value-highlight">
                  {formatCurrency(chain.stableTvl)}
                  <ChangeIndicator current={chain.stableTvl} previous={prev?.stableTvl} />
                </td>
                <td>{formatCurrency(chain.defiTvl)}</td>
                <td>{formatCurrency(chain.stableSupply)}</td>
                <td>
                  <span className={chain.utilPercent > 50 ? 'value-positive' : chain.utilPercent > 20 ? 'text-amber-400' : ''}>
                    {formatPercent(chain.utilPercent)}
                  </span>
                </td>
                <td>
                  <span className={chain.stblDefiPercent > 30 ? 'value-accent' : ''}>
                    {formatPercent(chain.stblDefiPercent)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td></td>
            <td className="chain-name">TOTAL</td>
            <td className="value-highlight">{formatCurrency(totals.stableTvl)}</td>
            <td>{formatCurrency(totals.defiTvl)}</td>
            <td>{formatCurrency(totals.stableSupply)}</td>
            <td>{formatPercent(totals.utilPercent)}</td>
            <td>{formatPercent(totals.stblDefiPercent)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
