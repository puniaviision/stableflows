import { fetchChainData } from '@/lib/defillama';
import { getLatestSnapshot, getWeeklySnapshots, saveSnapshot, getLatestAnalysis, getSnapshotCount } from '@/lib/storage';
import Header from '@/components/Header';
import MetricCards from '@/components/MetricCards';
import DataTable from '@/components/DataTable';
import TrendChart from '@/components/TrendChart';
import AnalysisBullets from '@/components/AnalysisBullets';
import MethodologyModal from '@/components/MethodologyModal';

// Revalidate data every hour
export const revalidate = 3600;

// Minimum snapshots needed to show trend charts (roughly 2 weeks of daily data)
const MIN_SNAPSHOTS_FOR_CHARTS = 14;

async function getData() {
  // Try to get cached data first
  let snapshot = await getLatestSnapshot();
  const now = new Date();

  // If no data or data is older than 1 hour, fetch fresh
  if (!snapshot || (now.getTime() - new Date(snapshot.timestamp).getTime()) > 3600000) {
    try {
      snapshot = await fetchChainData();
      await saveSnapshot(snapshot);
    } catch (error) {
      console.error('Failed to fetch fresh data:', error);
      // Fall back to cached data if available
      if (!snapshot) {
        throw error;
      }
    }
  }

  const weeklySnapshots = await getWeeklySnapshots(12);
  const previousSnapshot = weeklySnapshots.length > 1 ? weeklySnapshots[weeklySnapshots.length - 2] : null;
  const analysis = await getLatestAnalysis();
  const snapshotCount = await getSnapshotCount();

  return { snapshot, previousSnapshot, weeklySnapshots, analysis, snapshotCount };
}

export default async function Home() {
  const { snapshot, previousSnapshot, weeklySnapshots, analysis, snapshotCount } = await getData();
  const showCharts = snapshotCount >= MIN_SNAPSHOTS_FOR_CHARTS;

  return (
    <div className="min-h-screen">
      <Header lastUpdated={snapshot.timestamp} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
        {/* Metric Cards */}
        <section className="mb-6 sm:mb-10">
          <MetricCards
            totals={snapshot.totals}
            previousTotals={previousSnapshot?.totals}
          />
        </section>

        {/* Weekly Analysis */}
        {analysis && (
          <section className="mb-6 sm:mb-10">
            <AnalysisBullets analysis={analysis} />
          </section>
        )}

        {/* Data Table */}
        <section className={showCharts ? "mb-6 sm:mb-10" : ""}>
          <div className="section-header">
            <h2 className="section-title">Chain Rankings</h2>
            <p className="section-subtitle">Ranked by Stable TVL (USDC + USDT + PYUSD in DeFi)</p>
          </div>
          <DataTable
            chains={snapshot.chains}
            totals={snapshot.totals}
            previousChains={previousSnapshot?.chains}
          />
        </section>

        {/* Trend Charts - only show when we have enough historical data */}
        {showCharts && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrendChart
              snapshots={weeklySnapshots}
              metric="stableTvl"
              title="Stable TVL Trend (12 Weeks)"
            />
            <TrendChart
              snapshots={weeklySnapshots}
              metric="utilPercent"
              title="Utilization % Trend (12 Weeks)"
            />
          </section>
        )}
      </main>

      <footer className="footer">
        <p>
          Built by <a href="https://x.com/puniaviision" target="_blank" rel="noopener noreferrer">Punia</a> at <a href="https://underwritingcrypto.substack.com" target="_blank" rel="noopener noreferrer">Underwriting Crypto</a>
        </p>
        <p className="mt-3 text-xs">
          Data from <a href="https://defillama.com" target="_blank" rel="noopener noreferrer">DeFi Llama</a>
          <span className="mx-2 opacity-30">·</span>
          <MethodologyModal />
        </p>
      </footer>
    </div>
  );
}
