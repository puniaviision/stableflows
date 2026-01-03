'use client';

import { WeeklyAnalysis } from '@/lib/constants';
import { format } from 'date-fns';

interface AnalysisBulletsProps {
  analysis: WeeklyAnalysis | null;
}

export default function AnalysisBullets({ analysis }: AnalysisBulletsProps) {
  if (!analysis || analysis.bullets.length === 0) {
    return null;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Weekly Insights</h3>
        <span className="text-xs text-muted">
          {format(new Date(analysis.timestamp), 'MMM d, yyyy')}
        </span>
      </div>
      <ul className="space-y-4">
        {analysis.bullets.map((bullet, index) => (
          <li key={index} className="flex gap-4 items-start">
            <span
              className="flex-shrink-0 w-7 h-7 rounded-lg text-sm font-semibold flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-primary-dim)', color: 'var(--accent-primary)' }}
            >
              {index + 1}
            </span>
            <p className="text-sm leading-relaxed text-secondary pt-0.5">{bullet}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
