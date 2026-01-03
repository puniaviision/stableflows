import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata: Metadata = {
  title: 'stableflows.xyz | Track Stablecoin Flows Across DeFi',
  description: 'Track USDC, USDT, PYUSD flows across DeFi protocols on major chains. Real-time utilization metrics and TVL data.',
  openGraph: {
    title: 'stableflows.xyz',
    description: 'Track stablecoin flows across DeFi protocols on major chains',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'stableflows.xyz',
    description: 'Track stablecoin flows across DeFi protocols on major chains',
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
