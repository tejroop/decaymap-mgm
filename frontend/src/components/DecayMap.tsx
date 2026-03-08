import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Polyline, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { BlockCollection, BlockFeature, Corridor } from '../types';
import { getBlightColor, getRiskLabel } from '../utils';

/** Validate that a coordinate pair [lng, lat] contains finite numbers */
function isValidCoord(coord: unknown): boolean {
  if (!Array.isArray(coord) || coord.length < 2) return false;
  return Number.isFinite(coord[0]) && Number.isFinite(coord[1]);
}

/** Validate that a coordinate ring is valid */
function isValidRing(ring: unknown): boolean {
  if (!Array.isArray(ring) || ring.length < 3) return false;
  return ring.every(isValidCoord);
}

/** Check if a GeoJSON feature has valid geometry */
function hasValidGeometry(feature: any): boolean {
  try {
    const geom = feature?.geometry;
    if (!geom?.type || !geom?.coordinates) return false;
    if (geom.type === 'Polygon') {
      return Array.isArray(geom.coordinates) && geom.coordinates.every(isValidRing);
    }
    if (geom.type === 'MultiPolygon') {
      return Array.isArray(geom.coordinates) &&
        geom.coordinates.every((poly: any) => Array.isArray(poly) && poly.every(isValidRing));
    }
    if (geom.type === 'Point') return isValidCoord(geom.coordinates);
    if (geom.type === 'LineString') return Array.isArray(geom.coordinates) && geom.coordinates.every(isValidCoord);
    return true;
  } catch { return false; }
}

interface DecayMapProps {
  data: BlockCollection | null;
  selected: BlockFeature | null;
  onSelect: (feature: BlockFeature | null) => void;
  corridors: Corridor[];
  activeCorridor: string | null;
}

function FlyToSelected({ selected }: { selected: BlockFeature | null }) {
  const map = useMap();
  useEffect(() => {
    if (!selected) return;
    try {
      if (!hasValidGeometry(selected)) return;
      const layer = L.geoJSON(selected.geometry as any);
      const bounds = layer.getBounds();
      if (!bounds.isValid()) return;
      map.flyToBounds(bounds, { padding: [100, 100], maxZoom: 14, duration: 0.8 });
    } catch (err) {
      console.warn('FlyToSelected error:', err);
    }
  }, [selected, map]);
  return null;
}

function FlyToCorridor({ corridor, corridors }: { corridor: string | null; corridors: Corridor[] }) {
  const map = useMap();
  useEffect(() => {
    if (!corridor) return;
    try {
      const c = corridors.find(co => co.id === corridor);
      if (c && c.blocks.length > 0) {
        const validBlocks = c.blocks.filter(b => Number.isFinite(b.lat) && Number.isFinite(b.lng));
        if (validBlocks.length === 0) return;
        const bounds = L.latLngBounds(
          validBlocks.map(b => [b.lat, b.lng] as [number, number])
        );
        if (!bounds.isValid()) return;
        map.flyToBounds(bounds, { padding: [100, 100], duration: 1 });
      }
    } catch (err) {
      console.warn('FlyToCorridor error:', err);
    }
  }, [corridor, corridors, map]);
  return null;
}

export default function DecayMap({ data, selected, onSelect, corridors, activeCorridor }: DecayMapProps) {
  const geoJsonRef = useRef<L.GeoJSON | null>(null);

  // Filter out features with invalid coordinates to prevent Leaflet NaN crashes
  const safeData = useMemo(() => {
    if (!data) return null;
    const validFeatures = data.features.filter(f => hasValidGeometry(f));
    if (validFeatures.length !== data.features.length) {
      console.warn(`Filtered ${data.features.length - validFeatures.length} features with invalid geometry`);
    }
    return { ...data, features: validFeatures } as BlockCollection;
  }, [data]);

  // Build a set of corridor block IDs for fast lookup
  const corridorBlockIds = new Set<string>();
  for (const c of corridors) {
    for (const b of c.blocks) {
      corridorBlockIds.add(b.block_id);
    }
  }

  // Active corridor block IDs
  const activeCorridorBlockIds = new Set<string>();
  if (activeCorridor) {
    const ac = corridors.find(c => c.id === activeCorridor);
    if (ac) {
      for (const b of ac.blocks) {
        activeCorridorBlockIds.add(b.block_id);
      }
    }
  }

  const style = (feature: any) => {
    const score = feature.properties.composite_score;
    const id = feature.properties.id;
    const isSelected = selected?.properties.id === id;
    const isInCorridor = corridorBlockIds.has(id);
    const isInActiveCorridor = activeCorridorBlockIds.has(id);

    return {
      fillColor: getBlightColor(score),
      fillOpacity: isSelected ? 0.85 : isInActiveCorridor ? 0.75 : 0.5,
      weight: isSelected ? 3 : isInActiveCorridor ? 2.5 : isInCorridor ? 2 : 1,
      color: isSelected ? '#ffffff' : isInActiveCorridor ? '#dc2626' : isInCorridor ? '#ef4444' : '#a8a29e',
      opacity: isSelected ? 1 : 0.8,
      dashArray: isInCorridor && !isSelected ? '5,5' : undefined,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    layer.on({
      click: () => onSelect(feature as BlockFeature),
      mouseover: (e: L.LeafletMouseEvent) => {
        const l = e.target;
        l.setStyle({ weight: 2.5, fillOpacity: 0.75 });
        l.bringToFront();

        const p = feature.properties;
        l.bindTooltip(
          `<div style="font-family:'Source Sans 3',sans-serif">
            <div style="font-size:14px;font-weight:700;color:#292524">${p.name}</div>
            <div style="font-size:12px;color:#78716c;margin-top:3px">
              Score: <strong style="color:${getBlightColor(p.composite_score)}">${p.composite_score}</strong>
              &nbsp;·&nbsp;${getRiskLabel(p.risk_level)}
              ${p.in_corridor ? ' <span style="color:#dc2626;font-weight:700">IN CORRIDOR</span>' : ''}
            </div>
            <div style="font-size:11px;color:#a8a29e;margin-top:2px">
              Violations: ${p.count_code_violations.toLocaleString()} · 311: ${p.count_311.toLocaleString()}
            </div>
          </div>`,
          { sticky: true, className: 'decay-tooltip', direction: 'top', offset: [0, -10] }
        ).openTooltip();
      },
      mouseout: (e: L.LeafletMouseEvent) => {
        if (geoJsonRef.current) {
          geoJsonRef.current.resetStyle(e.target);
        }
        e.target.unbindTooltip();
      },
    });
  };

  // Corridor polylines
  const corridorLines = corridors.map(corridor => {
    const coords = corridor.blocks
      .filter(b => Number.isFinite(b.lat) && Number.isFinite(b.lng))
      .map(b => [b.lat, b.lng] as [number, number]);
    if (coords.length < 2) return null;
    const isActive = activeCorridor === corridor.id;

    return (
      <Polyline
        key={corridor.id}
        positions={coords}
        pathOptions={{
          color: isActive ? '#dc2626' : '#ef4444',
          weight: isActive ? 3 : 1.5,
          dashArray: '8,6',
          opacity: isActive ? 0.8 : 0.4,
        }}
      />
    );
  });

  return (
    <MapContainer
      center={[32.377, -86.300]}
      zoom={12}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {safeData && (
        <GeoJSON
          key={`${selected?.properties.id || 'none'}-${activeCorridor || 'none'}`}
          ref={geoJsonRef as any}
          data={safeData as any}
          style={style}
          onEachFeature={onEachFeature}
        />
      )}
      {corridorLines}
      <FlyToSelected selected={selected} />
      <FlyToCorridor corridor={activeCorridor} corridors={corridors} />
      <ZoomControl position="bottomright" />
    </MapContainer>
  );
}
