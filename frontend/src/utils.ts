/**
 * DecayMap MGM — Warm editorial color palette
 * Completely different from MontgomeryPulse's green-to-red ramp.
 * Uses burnt orange → warm brown → deep burgundy
 */

export function getBlightColor(score: number): string {
  if (score >= 65) return '#7f1d1d';  // Deep burgundy
  if (score >= 50) return '#b91c1c';  // Brick red
  if (score >= 40) return '#dc2626';  // Red
  if (score >= 30) return '#ea580c';  // Burnt orange
  if (score >= 20) return '#f59e0b';  // Amber
  if (score >= 10) return '#84cc16';  // Lime
  return '#22c55e';                    // Green (stable)
}

export function getBlightBg(score: number): string {
  if (score >= 65) return '#fef2f2';
  if (score >= 50) return '#fff7ed';
  if (score >= 40) return '#fffbeb';
  if (score >= 30) return '#fefce8';
  if (score >= 20) return '#f7fee7';
  return '#f0fdf4';
}

export function getRiskLabel(level: string): string {
  switch (level) {
    case 'critical': return 'Critical Decay';
    case 'high': return 'High Risk';
    case 'elevated': return 'Elevated';
    case 'moderate': return 'Moderate';
    case 'stable': return 'Stable';
    default: return level;
  }
}

export function getRiskBadgeStyle(level: string): { bg: string; text: string; border: string } {
  switch (level) {
    case 'critical': return { bg: '#7f1d1d', text: '#fecaca', border: '#991b1b' };
    case 'high': return { bg: '#9a3412', text: '#fed7aa', border: '#c2410c' };
    case 'elevated': return { bg: '#92400e', text: '#fde68a', border: '#b45309' };
    case 'moderate': return { bg: '#365314', text: '#d9f99d', border: '#4d7c0f' };
    case 'stable': return { bg: '#14532d', text: '#bbf7d0', border: '#166534' };
    default: return { bg: '#1e293b', text: '#e2e8f0', border: '#334155' };
  }
}

export function getTrendLabel(trend: string): string {
  switch (trend) {
    case 'accelerating': return 'Accelerating';
    case 'active': return 'Active Decay';
    case 'stable': return 'Stable';
    default: return trend;
  }
}

export function getTrendSymbol(trend: string): string {
  switch (trend) {
    case 'accelerating': return '▲▲';
    case 'active': return '▲';
    case 'stable': return '—';
    default: return '';
  }
}
