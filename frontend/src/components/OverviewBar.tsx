import React from 'react';
import type { CityOverview } from '../types';
import SyncStatus from './SyncStatus';

interface OverviewBarProps {
  overview: CityOverview | null;
}

const OverviewBar: React.FC<OverviewBarProps> = ({ overview }) => {
  if (!overview) {
    return (
      <div className="w-full h-20 bg-white border-b border-stone-200 flex items-center justify-center">
        <p className="text-stone-400 text-sm">Loading overview...</p>
      </div>
    );
  }

  const stats = [
    { label: 'Total Blocks', value: overview.total_blocks, accent: '#92400e' },
    { label: 'Avg Blight Score', value: overview.avg_blight_score.toFixed(1), accent: '#ea580c' },
    {
      label: 'Critical + High',
      value: overview.blocks_critical + overview.blocks_high,
      accent: '#b91c1c',
    },
    { label: 'Corridors', value: overview.corridor_count, accent: '#1e40af' },
    { label: 'Total Violations', value: overview.total_code_violations, accent: '#9333ea' },
    { label: 'Accelerating', value: overview.accelerating_count, accent: '#dc2626' },
  ];

  return (
    <div className="w-full bg-white border-b border-stone-200 px-6 py-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">City Overview</span>
        <SyncStatus />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex flex-col items-start">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
              {stat.label}
            </span>
            <span
              className="text-2xl font-bold"
              style={{ color: stat.accent }}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OverviewBar;
