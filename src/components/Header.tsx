'use client';

import { format } from 'date-fns';

interface HeaderProps {
  lastUpdated: string;
}

export default function Header({ lastUpdated }: HeaderProps) {
  const formattedDate = format(new Date(lastUpdated), 'MMM d, yyyy · h:mm a');

  return (
    <header className="header">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="header-content flex-col sm:flex-row gap-4">
          <div className="logo-section">
            <h1 className="logo-text uppercase">
              <span className="font-light">STABLE</span><span className="font-semibold">FLOWS</span>
            </h1>
            <p>Tracking stablecoin flows across DeFi</p>
          </div>
          <div className="status-section">
            <div className="live-indicator">Live</div>
            <div className="last-updated">{formattedDate}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
