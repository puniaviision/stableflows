'use client';

import { useState } from 'react';
import { formatCurrency, formatPercent } from '@/lib/defillama';

interface MetricCardsProps {
  totals: {
    stableTvl: number;
    defiTvl: number;
    stableSupply: number;
    utilPercent: number;
    stblDefiPercent: number;
  };
  previousTotals?: {
    stableTvl: number;
    defiTvl: number;
    stableSupply: number;
    utilPercent: number;
    stblDefiPercent: number;
  };
}

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-block">
      <button
        className="tooltip-trigger"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        aria-label="More info"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      </button>
      {show && (
        <div className="tooltip-content -left-[132px] top-7">
          {text}
        </div>
      )}
    </span>
  );
}

function MetricCard({
  label,
  value,
  previousValue,
  format = 'currency',
  tooltip,
}: {
  label: string;
  value: number;
  previousValue?: number;
  format?: 'currency' | 'percent';
  tooltip: string;
}) {
  const formattedValue = format === 'currency' ? formatCurrency(value) : formatPercent(value);

  let change: number | null = null;
  let changeLabel = '';

  if (previousValue !== undefined && previousValue !== 0) {
    if (format === 'percent') {
      change = value - previousValue;
      changeLabel = `${change >= 0 ? '+' : ''}${change.toFixed(1)}pp`;
    } else {
      change = ((value - previousValue) / previousValue) * 100;
      changeLabel = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    }
  }

  return (
    <div className="metric-card">
      <div className="metric-label">
        {label}
        <Tooltip text={tooltip} />
      </div>
      <div className="metric-value">{formattedValue}</div>
      {change !== null && Math.abs(change) >= 0.1 && (
        <div className={`metric-change ${change >= 0 ? 'positive' : 'negative'}`}>
          {change >= 0 ? '↑' : '↓'} {changeLabel} vs last week
        </div>
      )}
    </div>
  );
}

const TOOLTIPS = {
  stableTvl: "USDC + USDT + PYUSD deployed in DeFi protocols across all tracked chains. Sourced from DeFi Llama Yields API.",
  defiTvl: "Total value locked in DeFi protocols. Includes liquid staking and double-counted assets, so numbers are higher than DeFi Llama's homepage which excludes liquid staking.",
  utilPercent: "Stable TVL / Stable Supply. Measures what percentage of stablecoins on-chain are actively deployed in DeFi protocols.",
  stblDefiPercent: "Stable TVL / DeFi TVL. Measures how stablecoin-heavy DeFi activity is across chains.",
};

export default function MetricCards({ totals, previousTotals }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Total Stable TVL"
        value={totals.stableTvl}
        previousValue={previousTotals?.stableTvl}
        format="currency"
        tooltip={TOOLTIPS.stableTvl}
      />
      <MetricCard
        label="Total DeFi TVL"
        value={totals.defiTvl}
        previousValue={previousTotals?.defiTvl}
        format="currency"
        tooltip={TOOLTIPS.defiTvl}
      />
      <MetricCard
        label="Utilization Rate"
        value={totals.utilPercent}
        previousValue={previousTotals?.utilPercent}
        format="percent"
        tooltip={TOOLTIPS.utilPercent}
      />
      <MetricCard
        label="Stablecoins in DeFi"
        value={totals.stblDefiPercent}
        previousValue={previousTotals?.stblDefiPercent}
        format="percent"
        tooltip={TOOLTIPS.stblDefiPercent}
      />
    </div>
  );
}
