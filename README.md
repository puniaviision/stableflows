# stableflows.finance

Track stablecoin flows across DeFi. Real capital. No noise.

**Live:** [stableflows.finance](https://stableflows.finance)

## What is this?

A dashboard tracking USDC, USDT, and PYUSD deployed in DeFi protocols across 13 chains. Stablecoin flows are a more honest signal of real economic activity than speculative TVL.

## Metrics

| Metric | Description |
|--------|-------------|
| **Stable TVL** | USDC + USDT + PYUSD deployed in DeFi protocols |
| **DeFi TVL** | Total value locked in DeFi (all assets) |
| **Stable Supply** | Total stablecoins on chain (DeFi + wallets) |
| **Util %** | Stable TVL / Stable Supply — capital efficiency |
| **Stbl/DeFi** | Stable TVL / DeFi TVL — stablecoin concentration |

## Chains

Ethereum, Base, Solana, Arbitrum, Avalanche, BSC, Tron, Hyperliquid, Polygon, Aptos, Sui, Plasma, Katana

## Tech Stack

- **Framework:** Next.js 14
- **Styling:** Tailwind CSS
- **Storage:** Vercel KV (Redis)
- **Data:** DeFi Llama APIs
- **Deployment:** Vercel

## Local Development

```bash
npm install
npm run dev
```

## Deploy to Vercel

1. Fork/clone this repo
2. Import to Vercel
3. Create a KV store (Storage → Create Database → KV)
4. Add environment variables (see below)
5. Deploy

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `KV_REST_API_URL` | Yes | Auto-added when you create Vercel KV |
| `KV_REST_API_TOKEN` | Yes | Auto-added when you create Vercel KV |
| `CRON_SECRET` | Recommended | Secret for cron endpoint auth |
| `ANTHROPIC_API_KEY` | Optional | For AI-generated weekly insights |

### Cron Jobs

Configured in `vercel.json`:
- **Daily snapshot:** Every 6 hours (`/api/cron/daily`)

## Data Methodology

### Stable TVL
Calculated from [DeFi Llama Yields API](https://yields.llama.fi/pools). For multi-asset pools (e.g., USDC-ETH), only the stablecoin portion is counted.

### DeFi TVL
From the `/chains` endpoint. Includes double-counted assets and liquid staking. Numbers are ~50% higher than DeFi Llama's homepage which excludes liquid staking.

### Stable Supply
From [DeFi Llama Stablecoins API](https://stablecoins.llama.fi/stablecoins).

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/data` | Current snapshot |
| `GET /api/cron/daily` | Trigger data refresh (requires auth) |

## License

MIT

---

Built by [Punia](https://x.com/puniaviision) at [Underwriting Crypto](https://underwritingcrypto.substack.com)
