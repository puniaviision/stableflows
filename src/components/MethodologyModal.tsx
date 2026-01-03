'use client';

import { useState } from 'react';

export default function MethodologyModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-secondary hover:text-accent transition-colors"
      >
        Methodology
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="modal-backdrop" onClick={() => setIsOpen(false)} />

          {/* Modal Container */}
          <div className="modal-container">
            <div className="modal-content">
              {/* Header */}
              <div className="modal-header">
                <h2 className="modal-title">Data Methodology</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="modal-close"
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="modal-body space-y-6 text-sm">
                <section>
                  <h3 className="font-semibold text-accent mb-2">Stable TVL</h3>
                  <p className="text-secondary">
                    USDC + USDT + PYUSD deployed in DeFi protocols on each chain. Calculated from
                    the <a href="https://yields.llama.fi/pools" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">DeFi Llama Yields API</a> which
                    provides pool-level TVL data. For multi-asset pools (e.g., USDC-ETH), only the
                    stablecoin portion is counted proportionally.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-accent mb-2">DeFi TVL</h3>
                  <p className="text-secondary">
                    Total value locked in DeFi protocols from the DeFi Llama Chains API.
                  </p>
                  <div className="mt-3 p-4 bg-tertiary rounded-lg border border-subtle">
                    <p className="text-primary font-medium mb-2">Why numbers differ from DeFi Llama homepage:</p>
                    <p className="text-secondary">
                      Our DeFi TVL includes <strong className="text-primary">liquid staking</strong> (Lido, Rocket Pool, etc.) and
                      <strong className="text-primary"> double-counted assets</strong> (e.g., ETH staked in Lido, then stETH used in Aave).
                      DeFi Llama&apos;s homepage excludes liquid staking by default. The public API doesn&apos;t expose
                      the exact methodology used on their website, so our numbers may be ~50% higher for chains
                      with significant liquid staking activity.
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold text-accent mb-2">Stable Supply</h3>
                  <p className="text-secondary">
                    Total stablecoins (USDC + USDT + PYUSD) on each chain, including both DeFi-deployed
                    and wallet-held balances. Sourced from
                    the <a href="https://stablecoins.llama.fi" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">DeFi Llama Stablecoins API</a>.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-accent mb-2">Utilization Rate</h3>
                  <p className="text-secondary">
                    <code className="bg-tertiary px-2 py-0.5 rounded text-primary font-mono text-xs">Stable TVL / Stable Supply</code> —
                    Measures what percentage of stablecoins on a chain are actively deployed in DeFi protocols
                    vs. sitting idle in wallets. Higher utilization suggests more active capital deployment.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-accent mb-2">Stablecoins in DeFi (Stbl/DeFi)</h3>
                  <p className="text-secondary">
                    <code className="bg-tertiary px-2 py-0.5 rounded text-primary font-mono text-xs">Stable TVL / DeFi TVL</code> —
                    Measures how stablecoin-heavy a chain&apos;s DeFi activity is. Chains like Tron have high
                    ratios (stablecoin-dominated), while chains like Solana are more diverse.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-accent mb-2">Data Updates</h3>
                  <p className="text-secondary">
                    Data is refreshed every 6 hours via automated jobs. Historical snapshots are stored
                    weekly for trend analysis.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-accent mb-2">Tracked Chains</h3>
                  <p className="text-secondary">
                    Ethereum, Solana, BSC, Base, Arbitrum, Avalanche, Tron, Hyperliquid, Polygon, Aptos,
                    Sui, Plasma, and Katana.
                  </p>
                </section>
              </div>

              {/* Footer */}
              <div className="modal-footer">
                All data sourced from <a href="https://defillama.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">DeFi Llama</a> APIs.
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
