'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { SnapshotData } from '@/lib/constants';
import { formatCurrency } from '@/lib/defillama';
import { format } from 'date-fns';

interface TrendChartProps {
  snapshots: SnapshotData[];
  metric: 'stableTvl' | 'utilPercent' | 'stblDefiPercent';
  title: string;
}

// Top chains to show in chart
const CHART_CHAINS = ['Ethereum', 'Base', 'Solana', 'Arbitrum', 'Tron'];

const chainColors: Record<string, string> = {
  'Ethereum': '#627EEA',
  'Base': '#0052FF',
  'Solana': '#9945FF',
  'Arbitrum': '#28A0F0',
  'Tron': '#FF0000',
};

export default function TrendChart({ snapshots, metric, title }: TrendChartProps) {
  if (snapshots.length < 2) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
        </div>
        <div className="h-64 flex items-center justify-center text-muted">
          Need more data points for trend chart
        </div>
      </div>
    );
  }

  const data = snapshots.map((snapshot) => {
    const point: Record<string, number | string> = {
      date: format(new Date(snapshot.timestamp), 'MMM d'),
    };

    for (const chain of CHART_CHAINS) {
      const chainData = snapshot.chains.find((c) => c.chain === chain);
      if (chainData) {
        point[chain] = chainData[metric];
      }
    }

    return point;
  });

  const formatValue = (value: number) => {
    if (metric === 'stableTvl') {
      return formatCurrency(value);
    }
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="date"
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatValue}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#181c25',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                fontSize: '12px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              }}
              labelStyle={{ color: '#f4f4f5', fontWeight: 500 }}
              formatter={(value: number) => [formatValue(value), '']}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '16px' }}
            />
            {CHART_CHAINS.map((chain) => (
              <Line
                key={chain}
                type="monotone"
                dataKey={chain}
                stroke={chainColors[chain]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#08090c' }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
