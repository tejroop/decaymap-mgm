import React from 'react';
import type { Corridor, BlockCollection } from '../types';
import { getBlightColor } from '../utils';
import { explainCorridor } from '../aiExplainer';

interface CorridorPanelProps {
  corridors: Corridor[];
  onSelectCorridor: (id: string | null) => void;
  activeCorridor: string | null;
  blocks?: BlockCollection | null;
}

const CorridorPanel: React.FC<CorridorPanelProps> = ({
  corridors,
  onSelectCorridor,
  activeCorridor,
  blocks,
}) => {
  return (
    <div className="absolute top-4 left-4 w-[280px] bg-white rounded-xl shadow-2xl border border-stone-100 overflow-hidden" style={{ zIndex: 1000 }}>
      {/* Header */}
      <div className="px-4 py-3 bg-stone-50 border-b border-stone-200">
        <h3 className="font-serif text-lg text-stone-800">Blight Corridors</h3>
        <p className="text-xs text-stone-500 mt-1">{corridors.length} corridor{corridors.length !== 1 ? 's' : ''} identified</p>
      </div>

      {/* Corridor List */}
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
        {corridors.length === 0 ? (
          <div className="px-4 py-6 text-center text-stone-500 text-sm">
            No blight corridors detected
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {corridors.map((corridor) => {
              const isActive = activeCorridor === corridor.id;
              const severityColor =
                corridor.severity === 'critical' ? '#7f1d1d' : '#b91c1c';
              const _severityBg =
                corridor.severity === 'critical' ? '#fef2f2' : '#fff7ed';

              return (
                <button
                  key={corridor.id}
                  onClick={() => {
                    onSelectCorridor(isActive ? null : corridor.id);
                  }}
                  className={`w-full text-left px-4 py-3 transition-all ${
                    isActive
                      ? 'bg-amber-50 border-l-4 border-amber-600'
                      : 'hover:bg-stone-50'
                  }`}
                >
                  {/* Corridor Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-serif text-sm font-semibold text-stone-800 flex-1">
                      Corridor {corridor.id.slice(0, 8)}
                    </h4>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold text-white"
                      style={{ backgroundColor: severityColor }}
                    >
                      {corridor.severity === 'critical' ? 'Critical' : 'Severe'}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="space-y-1 text-xs text-stone-600">
                    <p>
                      <span className="font-medium">Blocks:</span> {corridor.block_count}
                    </p>
                    <p>
                      <span className="font-medium">Avg Score:</span>{' '}
                      <span
                        className="font-semibold"
                        style={{ color: getBlightColor(corridor.avg_score) }}
                      >
                        {corridor.avg_score.toFixed(1)}
                      </span>
                    </p>
                  </div>

                  {/* Active Indicator + AI Explanation */}
                  {isActive && (
                    <div className="mt-2 pt-2 border-t border-amber-200 space-y-2">
                      <div className="text-xs font-semibold text-amber-700">
                        ✓ Highlighted on map
                      </div>
                      <div className="p-2 rounded bg-amber-50/80 border border-amber-100">
                        <div className="flex items-center gap-1 mb-1">
                          <svg className="w-3 h-3 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">AI Analysis</span>
                        </div>
                        <p className="text-[11px] text-stone-600 leading-relaxed">{explainCorridor(corridor, blocks ?? null)}</p>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CorridorPanel;
