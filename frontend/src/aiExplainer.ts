/**
 * DecayMap MGM — Explainable AI Engine
 * Rule-based Natural Language Generation (NLG) system that turns
 * raw blight scores into transparent, human-readable explanations.
 * No LLM API required — fully deterministic and auditable.
 */

import type { BlockFeature, BlockProperties, Corridor, CityOverview, BlockCollection } from './types';

/* ──────────────────────────────────────────────
   1. BLOCK-LEVEL EXPLANATIONS
   ────────────────────────────────────────────── */

/** Primary "why is this block rated X" explanation */
export function explainBlockRisk(p: BlockProperties): string {
  const factors: string[] = [];

  // Identify the dominant risk driver
  const dims = [
    { name: 'decay velocity', score: p.decay_velocity_score },
    { name: 'commercial decline', score: p.commercial_decline_score },
    { name: 'infrastructure stress', score: p.infrastructure_stress_score },
    { name: 'anchor strength deficit', score: p.anchor_strength_score },
  ].sort((a, b) => b.score - a.score);

  const top = dims[0];
  const second = dims[1];

  if (top.score >= 60) {
    factors.push(`The primary concern is severe ${top.name} (${top.score.toFixed(0)}/100)`);
  } else if (top.score >= 40) {
    factors.push(`The leading factor is elevated ${top.name} (${top.score.toFixed(0)}/100)`);
  } else {
    factors.push(`The highest dimension is ${top.name} at ${top.score.toFixed(0)}/100, which is relatively contained`);
  }

  if (second.score >= 40) {
    factors.push(`compounded by ${second.name} at ${second.score.toFixed(0)}/100`);
  }

  // Add violation context
  const totalViolations = p.count_code_violations + p.count_311 + p.count_env_nuisance;
  if (totalViolations > 10) {
    factors.push(`This block has ${totalViolations} recorded complaints and violations, indicating active community concern`);
  } else if (totalViolations > 3) {
    factors.push(`There are ${totalViolations} recorded complaints on file`);
  }

  // Corridor risk
  if (p.in_corridor) {
    factors.push(`Critically, this block is part of a Blight Contagion Corridor — a chain of adjacent distressed blocks that amplifies neighborhood-level risk`);
  }

  // Trend
  if (p.decay_trend === 'accelerating') {
    factors.push(`The decay trend is **accelerating**, meaning conditions are worsening faster than the city average`);
  }

  return `### Risk Analysis: ${p.name}\n\n` + factors.map(f => `- ${f}.`).join('\n');
}

/** What citizens can do / what the city should prioritize */
export function explainBlockAction(p: BlockProperties): string {
  const actions: string[] = [];

  if (p.risk_level === 'critical' || p.risk_level === 'high') {
    actions.push('Priority intervention recommended');
    if (p.count_code_violations > 5) {
      actions.push('Code enforcement should increase inspection frequency in this area');
    }
    if (p.infrastructure_stress_score > 50) {
      actions.push('Infrastructure repairs (roads, sidewalks, drainage) would reduce the stress index');
    }
    if (p.commercial_decline_score > 50) {
      actions.push('Economic development incentives could help reverse commercial decline');
    }
    if (p.anchor_strength_score > 50) {
      actions.push('Attracting anchor institutions (grocery, pharmacy, community center) would strengthen neighborhood stability');
    }
  } else if (p.risk_level === 'elevated') {
    actions.push('This block is at a tipping point — targeted investment now could prevent escalation');
    if (p.decay_trend === 'accelerating') {
      actions.push('The accelerating trend makes early action especially valuable');
    }
  } else {
    actions.push('This area is relatively stable');
    if (p.composite_score > 15) {
      actions.push('Continued monitoring is recommended to catch early signs of decline');
    } else {
      actions.push('Maintaining current service levels should preserve neighborhood health');
    }
  }

  return actions.join('. ') + '.';
}

/** Access & equity explanation */
export function explainBlockAccess(p: BlockProperties): string {
  const insights: string[] = [];

  if (p.dist_food_km > 1.5) {
    insights.push(`The nearest food establishment is ${p.dist_food_km.toFixed(1)} km away — this may indicate a food desert`);
  }
  if (p.dist_pharmacy_km > 2) {
    insights.push(`Pharmacy access requires traveling ${p.dist_pharmacy_km.toFixed(1)} km, which creates a healthcare barrier`);
  }
  if (p.dist_park_km > 1) {
    insights.push(`The nearest park is ${p.dist_park_km.toFixed(1)} km away, limiting recreational access`);
  }
  if (p.dist_school_km > 2) {
    insights.push(`Schools are ${p.dist_school_km.toFixed(1)} km away, adding burden to families`);
  }
  if (p.dist_fire_police_km > 3) {
    insights.push(`Emergency services are ${p.dist_fire_police_km.toFixed(1)} km away — longer response times expected`);
  }

  if (insights.length === 0) {
    insights.push('This block has reasonable proximity to essential services');
  }

  return insights.join('. ') + '.';
}

/* ──────────────────────────────────────────────
   2. CORRIDOR-LEVEL EXPLANATIONS
   ────────────────────────────────────────────── */

export function explainCorridor(corridor: Corridor, _allBlocks: BlockCollection | null): string {
  const parts: string[] = [];

  parts.push(
    `This ${corridor.severity} corridor spans ${corridor.block_count} contiguous blocks with an average decay score of ${corridor.avg_score.toFixed(1)}/100`
  );

  parts.push(
    `Blight corridors form when adjacent neighborhoods simultaneously experience high distress, creating a "contagion effect" where decline in one block accelerates decline in neighbors`
  );

  const worstBlock = corridor.blocks.reduce((a, b) => (a.score > b.score ? a : b));
  parts.push(
    `The most affected block is ${worstBlock.name} at ${worstBlock.score.toFixed(1)}/100`
  );

  if (corridor.severity === 'critical') {
    parts.push(
      'At critical severity, this corridor should be the highest priority for coordinated multi-block intervention rather than individual block-by-block treatment'
    );
  }

  return parts.join('. ') + '.';
}

/* ──────────────────────────────────────────────
   3. CITY-WIDE EXPLANATIONS
   ────────────────────────────────────────────── */

export function explainCityOverview(overview: CityOverview): string {
  const parts: string[] = [];

  const criticalPct = ((overview.blocks_critical + overview.blocks_high) / overview.total_blocks * 100).toFixed(1);
  const stablePct = ((overview.blocks_stable + overview.blocks_moderate) / overview.total_blocks * 100).toFixed(1);

  parts.push(
    `Montgomery's urban decay analysis covers ${overview.total_blocks} blocks across the city`
  );

  parts.push(
    `${criticalPct}% of blocks are in critical or high-risk condition, while ${stablePct}% remain stable or moderate`
  );

  if (overview.corridor_count > 0) {
    parts.push(
      `${overview.corridor_count} blight contagion corridor${overview.corridor_count > 1 ? 's have' : ' has'} been identified, affecting ${overview.blocks_in_corridors} blocks`
    );
  }

  if (overview.accelerating_count > 0) {
    parts.push(
      `${overview.accelerating_count} blocks show accelerating decay — these are the most time-sensitive areas for intervention`
    );
  }

  parts.push(
    `The city average decay score is ${overview.avg_blight_score.toFixed(1)}/100 with the worst block at ${overview.max_blight_score.toFixed(1)}/100`
  );

  return parts.join('. ') + '.';
}

/* ──────────────────────────────────────────────
   4. CHAT Q&A ENGINE
   ────────────────────────────────────────────── */

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface ChatContext {
  blocks: BlockCollection | null;
  corridors: Corridor[];
  overview: CityOverview | null;
  selectedBlock: BlockFeature | null;
  interventions?: { patrols: number; lighting: number; sanitation: number };
}

const SUGGESTED_QUESTIONS = [
  "What's the overall health of Montgomery?",
  "Which areas need the most urgent attention?",
  "Why do blight corridors matter?",
  "What can citizens do to help?",
  "How does the scoring work?",
  "Where are the safest neighborhoods?",
  "Tell me about the data sources",
  "Explain the active simulation",
];

export function getSuggestedQuestions(ctx: ChatContext): string[] {
  const questions = [...SUGGESTED_QUESTIONS];
  if (ctx.selectedBlock) {
    questions.unshift(`Why is ${ctx.selectedBlock.properties.name} rated ${ctx.selectedBlock.properties.risk_level}?`);
    questions.unshift(`What should be done about ${ctx.selectedBlock.properties.name}?`);
  }
  return questions.slice(0, 6);
}

export function answerQuestion(query: string, ctx: ChatContext): string {
  const q = query.toLowerCase().trim();

  // Block-specific questions
  if (ctx.selectedBlock) {
    const p = ctx.selectedBlock.properties;
    if (q.includes('why') && (q.includes('rated') || q.includes('risk') || q.includes('score') || q.includes(p.name.toLowerCase()))) {
      return explainBlockRisk(p);
    }
    if (q.includes('what') && (q.includes('do') || q.includes('action') || q.includes('done') || q.includes('fix') || q.includes('help'))) {
      return explainBlockAction(p);
    }
    if (q.includes('access') || q.includes('service') || q.includes('food') || q.includes('pharmacy') || q.includes('park')) {
      return explainBlockAccess(p);
    }
  }

  // City overview
  if (q.includes('overall') || q.includes('health') || q.includes('montgomery') || q.includes('city') || q.includes('summary')) {
    if (ctx.overview) return explainCityOverview(ctx.overview);
    return "City overview data is still loading.";
  }

  // Simulator Context
  if (q.includes('simulate') || q.includes('simulation') || q.includes('predict') || q.includes('intervention') || q.includes('command')) {
    if (ctx.interventions && (ctx.interventions.patrols > 0 || ctx.interventions.lighting > 0 || ctx.interventions.sanitation > 0)) {
      const { patrols, lighting, sanitation } = ctx.interventions;
      const reduction = (patrols * 2.4) + (lighting * 1.8) + (sanitation * 1.5);

      let msg = `### ⚡ Active Prescriptive Simulation\n\nI see you have mobilized **${patrols + lighting + sanitation} new interventions** in the City Command simulator:\n\n`;
      if (patrols > 0) msg += `- **Code Enforcement Patrols (+${patrols} hrs/wk):** Decreases environmental hazards and code violations.\n`;
      if (lighting > 0) msg += `- **Street Lighting (+${lighting} blocks):** Deters illegal dumping and improves safety perception.\n`;
      if (sanitation > 0) msg += `- **Sanitation Cleanup (+${sanitation} sites):** Rapidly clears abandoned properties.\n`;

      msg += `\n**Predicted Impact:** These targeted interventions are predicted to dramatically reduce the 90-day risk trajectory by **${reduction.toFixed(1)} points** per block.`;

      if (ctx.selectedBlock) {
        const p = ctx.selectedBlock.properties;
        const newScore = Math.max(10, p.composite_score - reduction);
        msg += `\n\nFor **${p.name}**, the composite risk score drops from **${p.composite_score.toFixed(1)}** down to **${newScore.toFixed(1)}**, potentially shifting its risk classification entirely over the next quarter.`;
      }

      return msg;
    } else {
      return `To run a simulation, click the **CITY COMMAND** button in the top right to open the Prescriptive AI Simulator. Drag the resource sliders to allocate code enforcement patrols, street lighting, and sanitation cleanups. I will then analyze the simulated impact for you.`;
    }
  }

  // Urgent areas
  if (q.includes('urgent') || q.includes('worst') || q.includes('attention') || q.includes('critical') || q.includes('priority')) {
    if (!ctx.blocks) return "Block data is still loading.";
    const critical = ctx.blocks.features
      .filter(f => f.properties.risk_level === 'critical')
      .sort((a, b) => b.properties.composite_score - a.properties.composite_score)
      .slice(0, 5);
    if (critical.length === 0) return "No blocks currently meet the critical threshold.";
    const list = critical.map((b, i) => `${i + 1}. **${b.properties.name}** — score ${b.properties.composite_score.toFixed(1)} (${b.properties.decay_trend})`).join('\n');
    return `### Most Urgent Blocks\n\n${list}\n\nThese blocks score above **50/100** and represent the highest concentration of code violations, infrastructure stress, and commercial decline in Montgomery.`;
  }

  // Safest areas
  if (q.includes('safe') || q.includes('stable') || q.includes('best') || q.includes('healthy')) {
    if (!ctx.blocks) return "Block data is still loading.";
    const stable = ctx.blocks.features
      .filter(f => f.properties.risk_level === 'stable')
      .sort((a, b) => a.properties.composite_score - b.properties.composite_score)
      .slice(0, 5);
    if (stable.length === 0) return "No blocks currently meet the stable threshold — this warrants city-wide attention.";
    const list = stable.map((b, i) => `${i + 1}. **${b.properties.name}** — score ${b.properties.composite_score.toFixed(1)}`).join('\n');
    return `### Safest Neighborhoods\n\n${list}\n\nThese neighborhoods maintain low complaint volumes, good access to services, and minimal infrastructure deterioration.`;
  }

  // Corridors
  if (q.includes('corridor') || q.includes('contagion') || q.includes('spread') || q.includes('chain')) {
    if (ctx.corridors.length === 0) return "No blight contagion corridors were detected in the current analysis.";
    let response = `Blight Contagion Corridors are chains of 3 or more adjacent high-risk blocks where urban decay has spread across neighborhood boundaries. Unlike isolated problem spots, corridors create a "domino effect" — fixing one block in isolation often fails because surrounding blocks pull it back down.\n\n`;
    response += `Montgomery currently has ${ctx.corridors.length} identified corridor${ctx.corridors.length > 1 ? 's' : ''}:\n\n`;
    ctx.corridors.forEach(c => {
      response += `• ${c.severity.toUpperCase()} corridor: ${c.block_count} blocks, avg score ${c.avg_score.toFixed(1)}\n`;
    });
    response += `\nEffective intervention requires coordinated, multi-block strategies rather than individual treatments.`;
    return response;
  }

  // How scoring works
  if (q.includes('scoring') || q.includes('how') && (q.includes('work') || q.includes('calculate') || q.includes('measure'))) {
    return `DecayMap MGM uses a composite scoring model with four dimensions:\n\n1. Decay Velocity (35%) — How fast conditions are deteriorating, based on code violations, 311 complaints, and environmental nuisance reports.\n\n2. Commercial Decline (25%) — Loss of businesses, food establishments, and economic activity in the area.\n\n3. Infrastructure Stress (20%) — Physical deterioration signals: traffic complaints, road condition requests, and built-environment wear.\n\n4. Anchor Strength (20%) — Inverse measure: the presence (or absence) of stabilizing institutions like grocery stores, pharmacies, parks, schools, and community centers.\n\nEach dimension scores 0–100, and the weighted composite produces the final blight score. Higher = worse condition. The model is fully transparent — every score can be traced back to specific data points.`;
  }

  // Decay velocity
  if (q.includes('decay velocity') || q.includes('velocity')) {
    return `Decay Velocity measures how rapidly a block's condition is deteriorating. It's weighted at 35% of the composite score because speed of decline is the strongest predictor of future blight.\n\nIt's calculated from the density of code violations, 311 service requests, and environmental nuisance complaints per square kilometer. A high velocity doesn't necessarily mean a block is in the worst shape — it means it's getting worse fastest, making it a priority for early intervention before conditions become irreversible.`;
  }

  // Citizen action
  if (q.includes('citizen') || q.includes('resident') || q.includes('can i do') || q.includes('can we do') || q.includes('community')) {
    return `Citizens play a critical role in fighting urban blight. Here's how:\n\n1. Report issues early — File 311 requests for code violations, overgrown lots, abandoned structures, and infrastructure problems. Early reports help the system identify accelerating blocks before they reach critical levels.\n\n2. Organize block-level cleanups — Coordinated volunteer efforts can directly reduce environmental nuisance scores.\n\n3. Support local businesses — Commercial decline is a major blight driver. Shopping local and advocating for business-friendly zoning helps stabilize neighborhoods.\n\n4. Engage with city planning — Attend zoning meetings and advocate for anchor institutions (community centers, parks, health clinics) in underserved blocks.\n\n5. Use this tool — Share DecayMap data with your council representative to prioritize your neighborhood for infrastructure investment.`;
  }

  // Data sources
  if (q.includes('data') || q.includes('source') || q.includes('where') && q.includes('from')) {
    return `### DecayMap Data Sources\n\nDecayMap MGM is built on **19 open datasets** from Montgomery, Alabama's ArcGIS REST APIs:\n\n- Code Enforcement Violations\n- 311 Service Requests\n- Environmental Nuisance Reports\n- Traffic & Maintenance Requests\n- Food Establishment Permits\n- Points of Interest (schools, parks, pharmacies, etc.)\n- Zoning Parcels & Districts\n\nAll data is public, sourced from the City of Montgomery's open data portal. Scores are computed algorithmically with **no manual overrides** — every number is traceable to specific records.`;
  }

  // Fallback
  return `I can help you understand Montgomery's urban decay data. Try asking about:\n\n- Why a specific block has its current risk rating\n- Which areas need the most urgent attention\n- How the scoring model works\n- What citizens or the city can do to help\n- The blight contagion corridor phenomenon\n- How to use the active simulation engine\n\nClick on any block on the map first, then ask me "Why is this block rated this way?" for a detailed explanation.`;
}
