import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Polyline, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { BlockCollection, BlockFeature, Corridor } from '../types';
import { getBlightColor, getRiskLabel } from '../utils';

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
    if (selected) {
      const bounds = L.geoJSON(selected.geometry as any).getBounds();
      map.flyToBounds(bounds, { padding: [100, 100], maxZoom: 14, duration: 0.8 });
    }
  }, [selected, map]);
  return null;
}

function FlyToCorridor({ corridor, corridors }: { corridor: string | null; corridors: Corridor[] }) {
  const map = useMap();
  useEffect(() => {
    if (corridor) {
      const c = corridors.find(co => co.id === corridor);
      if (c && c.blocks.length > 0) {
        const bounds = L.latLngBounds(
          c.blocks.map(b => [b.lat, b.lng] as [number, number])
        );
        map.flyToBounds(bounds, { padding: [100, 100], duration: 1 });
      }
    }
  }, [corridor, corridors, map]);
  return null;
}

export default function DecayMap({ data, selected, onSelect, corridors, activeCorridor }: DecayMapProps) {
  const geoJsonRef = useRef<L.GeoJSON | null>(null);

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
    const coords = corridor.blocks.map(b => [b.lat, b.lng] as [number, number]);
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
        attribution='&copy; <a href="https://stadiamaps.com/">Stadia</a>'
        url="https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png"
      />
      {data && (
        <GeoJSON
          key={`${selected?.properties.id || 'none'}-${activeCorridor || 'none'}`}
          ref={geoJsonRef as any}
          data={data as any}
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
