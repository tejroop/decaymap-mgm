import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { BlockCollection, BlockFeature } from '../types';

interface BlightChartProps {
  data: BlockCollection;
}

const BlightChart: React.FC<BlightChartProps> = ({ data }) => {
  // Count blocks by risk level
  const riskCounts = {
    critical: 0,
    high: 0,
    elevated: 0,
    moderate: 0,
    stable: 0,
  };

  data.features.forEach((feature: BlockFeature) => {
    const risk = feature.properties.risk_level as keyof typeof riskCounts;
    if (risk in riskCounts) {
      riskCounts[risk]++;
    }
  });

  const chartData = [
    { name: 'Critical', value: riskCounts.critical, fill: '#7f1d1d' },
    { name: 'High', value: riskCounts.high, fill: '#b91c1c' },
    { name: 'Elevated', value: riskCounts.elevated, fill: '#dc2626' },
    { name: 'Moderate', value: riskCounts.moderate, fill: '#ea580c' },
    { name: 'Stable', value: riskCounts.stable, fill: '#22c55e' },
  ];

  return (
    <div className="w-full h-80 bg-white rounded-xl shadow-lg p-6 border border-stone-100">
      <h3 className="font-serif text-xl text-stone-800 mb-4">Risk Level Distribution</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#78716c', fontSize: 12 }}
            axisLine={{ stroke: '#d6d3d1' }}
          />
          <YAxis
            tick={{ fill: '#78716c', fontSize: 12 }}
            axisLine={{ stroke: '#d6d3d1' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #d6d3d1',
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
            labelStyle={{ color: '#292524' }}
            formatter={(value) => [value, 'Blocks']}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BlightChart;
