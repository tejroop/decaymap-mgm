import React, { useState } from 'react';
import type { BlockFeature } from '../types';
import { getBlightColor, getRiskLabel, getTrendSymbol } from '../utils';
import { explainBlockRisk, explainBlockAction, explainBlockAccess } from '../aiExplainer';

interface BlockDetailProps {
  feature: BlockFeature;
  onClose: () => void;
}

const BlockDetail: React.FC<BlockDetailProps> = ({ feature, onClose }) => {
  const [showAI, setShowAI] = useState(false);
  const props = feature.properties;
  const color = getBlightColor(props.composite_score);
  const riskColor =
    props.risk_level === 'critical'
      ? '#7f1d1d'
      : props.risk_level === 'high'
      ? '#b91c1c'
      : props.risk_level === 'elevated'
      ? '#dc2626'
      : '#ea580c';

  const dimensions = [
    { label: 'Decay Velocity', value: props.decay_velocity_score },
    { label: 'Commercial Decline', value: props.commercial_decline_score },
    { label: 'Infrastructure Stress', value: props.infrastructure_stress_score },
    { label: 'Anchor Strength', value: props.anchor_strength_score },
  ];

  return (
    <div className="float-up absolute bottom-4 left-4 max-w-[420px] bg-white/95 backdrop-blur rounded-xl shadow-2xl p-6 border border-stone-100" style={{ zIndex: 1000 }}>
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
        aria-label="Close"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Header with Name and Badges */}
      <div className="mb-4">
        <h2 className="font-serif text-2xl text-stone-800 mb-2">{props.name}</h2>
        <div className="flex gap-2 flex-wrap">
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: riskColor }}
          >
            {getRiskLabel(props.risk_level)}
          </span>
          {props.decay_trend && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold text-stone-700 bg-stone-100">
              {getTrendSymbol(props.decay_trend)} {props.decay_trend.charAt(0).toUpperCase() + props.decay_trend.slice(1)}
            </span>
          )}
          {props.in_corridor && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-blue-600">
              In Corridor
            </span>
          )}
        </div>
      </div>

      {/* Large Score Display */}
      <div className="mb-6 p-4 rounded-lg bg-stone-50 border border-stone-200">
        <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">Composite Blight Score</div>
        <div
          className="text-5xl font-bold"
          style={{ color }}
        >
          {props.composite_score.toFixed(1)}
        </div>
      </div>

      {/* Dimension Score Bars */}
      <div className="mb-6">
        <div className="text-xs text-stone-500 uppercase tracking-wider mb-3">Score Dimensions</div>
        <div className="space-y-3">
          {dimensions.map((dim) => (
            <div key={dim.label}>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-stone-600 font-medium">{dim.label}</span>
                <span className="text-xs font-semibold text-stone-700">{dim.value.toFixed(1)}</span>
              </div>
              <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(dim.value, 100)}%`,
                    backgroundColor: getBlightColor(dim.value),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics Section */}
      <div className="mb-6 pt-4 border-t border-stone-200">
        <div className="text-xs text-stone-500 uppercase tracking-wider mb-3">Violations & Requests</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-stone-50 p-3 rounded-lg">
            <div className="text-xs text-stone-500 mb-1">Code Violations</div>
            <div className="text-xl font-bold text-stone-800">{props.count_code_violations}</div>
          </div>
          <div className="bg-stone-50 p-3 rounded-lg">
            <div className="text-xs text-stone-500 mb-1">311 Requests</div>
            <div className="text-xl font-bold text-stone-800">{props.count_311}</div>
          </div>
          <div className="bg-stone-50 p-3 rounded-lg">
            <div className="text-xs text-stone-500 mb-1">Environmental</div>
            <div className="text-xl font-bold text-stone-800">{props.count_env_nuisance}</div>
          </div>
          <div className="bg-stone-50 p-3 rounded-lg">
            <div className="text-xs text-stone-500 mb-1">Traffic Requests</div>
            <div className="text-xl font-bold text-stone-800">{props.count_traffic_requests}</div>
          </div>
        </div>
      </div>

      {/* Zone Info */}
      <div className="text-xs text-stone-600 space-y-1 border-t border-stone-200 pt-4">
        <p>
          <span className="font-medium text-stone-700">Zone Type:</span> {props.zone_type}
        </p>
        <p>
          <span className="font-medium text-stone-700">Area:</span> {props.area_km2.toFixed(2)} km²
        </p>
        <p>
          <span className="font-medium text-stone-700">Parcels:</span> {props.num_parcels}
        </p>
      </div>

      {/* AI Explainer Toggle */}
      <button
        onClick={() => setShowAI(!showAI)}
        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 hover:border-amber-300 transition-all text-sm font-semibold text-amber-800"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        {showAI ? 'Hide AI Analysis' : 'AI: Explain This Block'}
        <svg className={`w-3 h-3 transition-transform ${showAI ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* AI Narrative Insight Cards */}
      {showAI && (
        <div className="mt-3 space-y-3 animate-fadeIn">
          {/* Why this rating */}
          <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-100">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Why This Rating</span>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed">{explainBlockRisk(props)}</p>
          </div>

          {/* Recommended action */}
          <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-100">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Recommended Action</span>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed">{explainBlockAction(props)}</p>
          </div>

          {/* Service access */}
          <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-100">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Service Access</span>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed">{explainBlockAccess(props)}</p>
          </div>

          <div className="text-center">
            <span className="text-[10px] text-stone-400 italic">Powered by Explainable AI — every insight traces to real data</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockDetail;
