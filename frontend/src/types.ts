export interface BlockProperties {
  id: string;
  name: string;
  zone_type: string;
  dominant_zoning: string;
  num_parcels: number;
  area_km2: number;
  composite_score: number;
  decay_velocity_score: number;
  commercial_decline_score: number;
  infrastructure_stress_score: number;
  anchor_strength_score: number;
  risk_level: 'critical' | 'high' | 'elevated' | 'moderate' | 'stable';
  decay_trend: 'accelerating' | 'active' | 'stable';
  in_corridor: boolean;
  count_code_violations: number;
  count_311: number;
  count_env_nuisance: number;
  count_traffic_requests: number;
  count_food_establishments: number;
  count_poi: number;
  count_visited_places: number;
  dist_food_km: number;
  dist_pharmacy_km: number;
  dist_park_km: number;
  dist_school_km: number;
  dist_community_km: number;
  dist_fire_police_km: number;
}

export interface BlockFeature {
  type: 'Feature';
  geometry: GeoJSON.Geometry;
  properties: BlockProperties;
}

export interface BlockCollection {
  type: 'FeatureCollection';
  features: BlockFeature[];
}

export interface CorridorBlock {
  block_id: string;
  name: string;
  score: number;
  lat: number;
  lng: number;
}

export interface Corridor {
  id: string;
  block_count: number;
  avg_score: number;
  severity: 'critical' | 'severe';
  blocks: CorridorBlock[];
}

export interface CityOverview {
  total_blocks: number;
  total_code_violations: number;
  total_311_requests: number;
  avg_blight_score: number;
  max_blight_score: number;
  blocks_critical: number;
  blocks_high: number;
  blocks_elevated: number;
  blocks_moderate: number;
  blocks_stable: number;
  blocks_in_corridors: number;
  corridor_count: number;
  accelerating_count: number;
}
