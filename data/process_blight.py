#!/usr/bin/env python3
"""
DecayMap MGM — Urban Decay Intelligence Pipeline
===================================================
Transforms Montgomery ArcGIS data into blight prediction scores.

Scoring Dimensions (each 0–100):
  - Decay Velocity (35%): Code violation + 311 density, weighted by recency
  - Commercial Decline (25%): Distance from active businesses + foot traffic
  - Infrastructure Stress (20%): Traffic engineering requests + road complaint density
  - Anchor Strength (20%): Proximity to schools, parks, community centers (inverted)

Special Feature: Blight Contagion Corridors
  Identifies connected chains of high-decay neighborhoods where
  urban blight is spreading spatially.
"""

import json
import os
import math
from collections import defaultdict

import geopandas as gpd
import pandas as pd
from shapely.geometry import shape, Point, mapping
from shapely.ops import unary_union
import numpy as np

# Use the SAME raw data from montgomery-pulse
RAW_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "montgomery-pulse", "data", "raw")
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "public", "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)


# ============================================================
# STEP 1: Build zones (same grid approach, different naming)
# ============================================================
def load_zones():
    """Load zoning polygons, merge into neighborhood blocks."""
    print("Loading zoning polygons...")
    with open(os.path.join(RAW_DIR, "zoning.json")) as f:
        data = json.load(f)

    features = []
    for feat in data["features"]:
        if feat.get("geometry"):
            try:
                geom = shape(feat["geometry"])
                if geom.is_valid and not geom.is_empty:
                    features.append({
                        "geometry": geom,
                        "zoning_code": feat["properties"].get("ZoningCode", "Unknown"),
                    })
            except Exception:
                pass

    gdf = gpd.GeoDataFrame(features, geometry="geometry", crs="EPSG:4326")
    print(f"  Loaded {len(gdf)} valid zoning polygons")

    # Grid cluster into blocks (~0.01 degree ≈ 1km cells)
    gdf["grid_x"] = (gdf.geometry.centroid.x * 100).astype(int)
    gdf["grid_y"] = (gdf.geometry.centroid.y * 100).astype(int)
    gdf["grid_id"] = gdf["grid_x"].astype(str) + "_" + gdf["grid_y"].astype(str)

    blocks = []
    for grid_id, group in gdf.groupby("grid_id"):
        merged_geom = unary_union(group.geometry)
        zoning_counts = group["zoning_code"].value_counts()
        dominant_zone = zoning_counts.index[0] if len(zoning_counts) > 0 else "Mixed"
        centroid = merged_geom.centroid

        # Classify land use from zoning
        zone_type = classify_zone(dominant_zone)

        blocks.append({
            "geometry": merged_geom,
            "block_id": grid_id,
            "dominant_zoning": dominant_zone,
            "zone_type": zone_type,
            "num_parcels": len(group),
            "area_sq_deg": merged_geom.area,
            "centroid_lat": centroid.y,
            "centroid_lng": centroid.x,
        })

    block_gdf = gpd.GeoDataFrame(blocks, geometry="geometry", crs="EPSG:4326")
    block_gdf = block_gdf[block_gdf["area_sq_deg"] > 0.000005].copy()
    block_gdf = block_gdf.reset_index(drop=True)

    # Name blocks using street grid + area context
    center_lat = block_gdf["centroid_lat"].median()
    center_lng = block_gdf["centroid_lng"].median()

    # Montgomery area names
    area_names = [
        (32.390, -86.320, "Chisholm"),
        (32.405, -86.255, "Dalraida"),
        (32.370, -86.310, "Capitol Heights"),
        (32.360, -86.300, "Cloverdale"),
        (32.340, -86.290, "Woodley Park"),
        (32.380, -86.245, "Eastdale"),
        (32.350, -86.260, "Halcyon"),
        (32.360, -86.340, "West Montgomery"),
        (32.400, -86.290, "Norman Bridge"),
        (32.325, -86.310, "South Blvd"),
        (32.380, -86.170, "Eastchase"),
        (32.420, -86.250, "Bell Road"),
        (32.355, -86.185, "Wynlakes"),
        (32.370, -86.270, "Midtown"),
        (32.385, -86.295, "Downtown"),
        (32.340, -86.340, "Snowdoun"),
        (32.350, -86.200, "Taylor Rd"),
        (32.310, -86.280, "South MGM"),
        (32.395, -86.200, "Eastern Bypass"),
        (32.430, -86.285, "North MGM"),
        (32.340, -86.230, "Carter Hill"),
        (32.375, -86.350, "Westgate"),
        (32.410, -86.320, "Mobile Hwy"),
        (32.365, -86.145, "Pike Road"),
        (32.395, -86.350, "West Fairview"),
    ]

    def find_area(lat, lng):
        best_d, best_n = float("inf"), "Block"
        for alat, alng, aname in area_names:
            d = math.sqrt((lat - alat)**2 + (lng - alng)**2)
            if d < best_d:
                best_d, best_n = d, aname
        return best_n

    def name_block(row):
        area = find_area(row["centroid_lat"], row["centroid_lng"])
        return f"{area} {row['zone_type']}"

    block_gdf["name"] = block_gdf.apply(name_block, axis=1)

    # Deduplicate names
    name_totals = defaultdict(int)
    for n in block_gdf["name"]:
        name_totals[n] += 1
    name_idx = defaultdict(int)
    unique = []
    for n in block_gdf["name"]:
        name_idx[n] += 1
        if name_totals[n] > 1:
            unique.append(f"{n} #{name_idx[n]}")
        else:
            unique.append(n)
    block_gdf["name"] = unique

    print(f"  Created {len(block_gdf)} blocks")
    return block_gdf


def classify_zone(code):
    """Classify zoning code into human-readable land use."""
    code = code.upper()
    if code.startswith("R") or code.startswith("RS") or code.startswith("RM"):
        return "Residential"
    elif code.startswith("C") or code.startswith("B"):
        return "Commercial"
    elif code.startswith("I") or code.startswith("M"):
        return "Industrial"
    elif code.startswith("O") or code.startswith("P"):
        return "Office/Public"
    elif code.startswith("AG") or code.startswith("A-"):
        return "Agricultural"
    else:
        return "Mixed"


# ============================================================
# STEP 2: Load point datasets
# ============================================================
def load_points(filename):
    """Load GeoJSON points from raw data."""
    path = os.path.join(RAW_DIR, filename)
    if not os.path.exists(path):
        print(f"  WARNING: {filename} not found")
        return []
    with open(path) as f:
        data = json.load(f)
    points = []
    for feat in data.get("features", []):
        geom = feat.get("geometry")
        if geom and geom.get("type") == "Point" and geom.get("coordinates"):
            coords = geom["coordinates"]
            if coords[0] != 0 and coords[1] != 0:
                points.append({"lon": coords[0], "lat": coords[1], "props": feat.get("properties", {})})
    return points


def count_in_zones(block_gdf, points):
    """Spatial join: count points per block."""
    counts = [0] * len(block_gdf)
    if not points:
        return counts
    sindex = block_gdf.sindex
    for pt in points:
        point = Point(pt["lon"], pt["lat"])
        for idx in list(sindex.intersection(point.bounds)):
            if block_gdf.geometry.iloc[idx].contains(point):
                counts[idx] += 1
                break
    return counts


def min_distances(block_gdf, facility_points):
    """Min haversine distance from each block centroid to nearest facility."""
    if not facility_points:
        return [float("inf")] * len(block_gdf)
    fcoords = [(p["lon"], p["lat"]) for p in facility_points]
    dists = []
    for _, row in block_gdf.iterrows():
        clat, clng = row["centroid_lat"], row["centroid_lng"]
        md = float("inf")
        for flon, flat in fcoords:
            dlat = math.radians(flat - clat)
            dlon = math.radians(flon - clng)
            a = math.sin(dlat/2)**2 + math.cos(math.radians(clat)) * math.cos(math.radians(flat)) * math.sin(dlon/2)**2
            md = min(md, 6371 * 2 * math.asin(math.sqrt(a)))
        dists.append(md)
    return dists


def normalize(values, invert=False):
    """Percentile normalization to 0-100."""
    arr = np.array(values, dtype=float)
    arr = np.nan_to_num(arr, nan=0.0, posinf=100.0)
    if arr.max() == arr.min():
        return [50.0] * len(values)
    p5, p95 = np.percentile(arr, 5), np.percentile(arr, 95)
    if p95 == p5:
        return [50.0] * len(values)
    normed = np.clip((arr - p5) / (p95 - p5) * 100, 0, 100)
    if invert:
        normed = 100 - normed
    return normed.tolist()


# ============================================================
# STEP 3: Compute blight scores
# ============================================================
def compute_blight_scores(block_gdf):
    """Compute 4-dimension blight prediction scores."""
    print("\nComputing blight scores...")

    # Load all point datasets
    print("  Loading datasets...")
    code_violations = load_points("code_violations.json")
    requests_311 = load_points("311_service_requests.json")
    env_nuisance = load_points("environmental_nuisance.json")
    traffic_eng = load_points("traffic_engineering_requests.json")
    food_scores = load_points("food_scores.json")
    most_visited = load_points("most_visited.json")
    poi = load_points("point_of_interest.json")
    pharmacies = load_points("pharmacy_locator.json")
    parks = load_points("parks_trails.json")
    schools = load_points("education_facility.json")
    community = load_points("community_centers.json")
    fire_police = load_points("fire_police_station.json")

    print(f"    Code violations: {len(code_violations)}")
    print(f"    311 requests: {len(requests_311)}")
    print(f"    Food establishments: {len(food_scores)}")
    print(f"    Traffic eng. requests: {len(traffic_eng)}")

    # Spatial joins
    print("  Spatial joining...")
    cnt_code = count_in_zones(block_gdf, code_violations)
    cnt_311 = count_in_zones(block_gdf, requests_311)
    cnt_env = count_in_zones(block_gdf, env_nuisance)
    cnt_traffic = count_in_zones(block_gdf, traffic_eng)
    cnt_food = count_in_zones(block_gdf, food_scores)
    cnt_poi = count_in_zones(block_gdf, poi)
    cnt_visited = count_in_zones(block_gdf, most_visited)

    # Distances
    print("  Computing distances...")
    dist_food = min_distances(block_gdf, food_scores)
    dist_pharmacy = min_distances(block_gdf, pharmacies)
    dist_visited = min_distances(block_gdf, most_visited)
    dist_parks = min_distances(block_gdf, parks)
    dist_schools = min_distances(block_gdf, schools)
    dist_community = min_distances(block_gdf, community)
    dist_fire_police = min_distances(block_gdf, fire_police)

    # Area normalization
    areas = block_gdf["area_sq_deg"].values
    areas_km2 = areas * (111 * 111 * math.cos(math.radians(32.37)))
    areas_km2 = np.maximum(areas_km2, 0.01)

    # --- DIMENSION 1: Decay Velocity (35%) ---
    # Code violations + 311 complaints per km2
    decay_density = [(cv + r3) / a for cv, r3, a in zip(cnt_code, cnt_311, areas_km2)]
    decay_score = normalize(decay_density)

    # --- DIMENSION 2: Commercial Decline (25%) ---
    # High distance to commercial activity + low food/POI count = declining
    commercial_distance = [0.4 * df + 0.3 * dp + 0.3 * dv
                           for df, dp, dv in zip(dist_food, dist_pharmacy, dist_visited)]
    commercial_score = normalize(commercial_distance)  # farther = worse

    # --- DIMENSION 3: Infrastructure Stress (20%) ---
    # Traffic engineering requests + environmental nuisance density
    infra_density = [(te + en) / a for te, en, a in zip(cnt_traffic, cnt_env, areas_km2)]
    infra_score = normalize(infra_density)

    # --- DIMENSION 4: Anchor Strength (20%) ---
    # Proximity to stabilizing institutions (inverted — closer = better = lower risk)
    anchor_distance = [0.35 * ds + 0.30 * dpa + 0.35 * dc
                       for ds, dpa, dc in zip(dist_schools, dist_parks, dist_community)]
    anchor_score = normalize(anchor_distance)  # farther from anchors = higher risk

    # --- COMPOSITE BLIGHT RISK SCORE ---
    weights = {"decay": 0.35, "commercial": 0.25, "infra": 0.20, "anchor": 0.20}
    composite = []
    for i in range(len(block_gdf)):
        score = (weights["decay"] * decay_score[i]
                 + weights["commercial"] * commercial_score[i]
                 + weights["infra"] * infra_score[i]
                 + weights["anchor"] * anchor_score[i])
        composite.append(round(score, 1))

    # --- BLIGHT RISK LEVEL ---
    def risk_level(score):
        if score >= 70: return "critical"
        elif score >= 55: return "high"
        elif score >= 40: return "elevated"
        elif score >= 25: return "moderate"
        else: return "stable"

    # --- DECAY TREND ---
    median_decay = np.median(decay_score)
    trends = []
    for d in decay_score:
        if d > median_decay * 1.5:
            trends.append("accelerating")
        elif d < median_decay * 0.5:
            trends.append("stable")
        else:
            trends.append("active")

    # Store scores
    block_gdf["decay_velocity_score"] = [round(s, 1) for s in decay_score]
    block_gdf["commercial_decline_score"] = [round(s, 1) for s in commercial_score]
    block_gdf["infrastructure_stress_score"] = [round(s, 1) for s in infra_score]
    block_gdf["anchor_strength_score"] = [round(s, 1) for s in anchor_score]
    block_gdf["composite_score"] = composite
    block_gdf["risk_level"] = [risk_level(s) for s in composite]
    block_gdf["decay_trend"] = trends

    # Raw counts
    block_gdf["count_code_violations"] = cnt_code
    block_gdf["count_311"] = cnt_311
    block_gdf["count_env_nuisance"] = cnt_env
    block_gdf["count_traffic_requests"] = cnt_traffic
    block_gdf["count_food_establishments"] = cnt_food
    block_gdf["count_poi"] = cnt_poi
    block_gdf["count_visited_places"] = cnt_visited

    # Distances
    block_gdf["dist_food_km"] = [round(d, 2) for d in dist_food]
    block_gdf["dist_pharmacy_km"] = [round(d, 2) for d in dist_pharmacy]
    block_gdf["dist_park_km"] = [round(d, 2) for d in dist_parks]
    block_gdf["dist_school_km"] = [round(d, 2) for d in dist_schools]
    block_gdf["dist_community_km"] = [round(d, 2) for d in dist_community]
    block_gdf["dist_fire_police_km"] = [round(d, 2) for d in dist_fire_police]
    block_gdf["area_km2"] = [round(a, 2) for a in areas_km2]

    return block_gdf


# ============================================================
# STEP 4: Compute Blight Contagion Corridors
# ============================================================
def compute_contagion_corridors(block_gdf, threshold=50):
    """
    Find connected chains of high-blight blocks.
    Two blocks are 'connected' if their centroids are within 1.5km
    and both have composite scores above threshold.
    """
    print("\nComputing Blight Contagion Corridors...")

    high_risk = block_gdf[block_gdf["composite_score"] >= threshold].copy()
    if len(high_risk) == 0:
        print("  No high-risk blocks found")
        return []

    # Build adjacency using centroid proximity
    coords = list(zip(high_risk["centroid_lat"], high_risk["centroid_lng"]))
    indices = list(high_risk.index)
    max_dist_km = 1.8  # Adjacency threshold

    # Simple union-find for connected components
    parent = {i: i for i in range(len(indices))}

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    for i in range(len(coords)):
        for j in range(i + 1, len(coords)):
            lat1, lng1 = coords[i]
            lat2, lng2 = coords[j]
            dlat = math.radians(lat2 - lat1)
            dlon = math.radians(lng2 - lng1)
            a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
            dist = 6371 * 2 * math.asin(math.sqrt(a))
            if dist <= max_dist_km:
                union(i, j)

    # Group into corridors
    corridors_map = defaultdict(list)
    for i in range(len(indices)):
        root = find(i)
        corridors_map[root].append(i)

    # Filter corridors with 3+ blocks (meaningful chains)
    corridors = []
    for members in corridors_map.values():
        if len(members) >= 3:
            corridor_blocks = []
            total_score = 0
            for m in members:
                idx = indices[m]
                row = block_gdf.loc[idx]
                corridor_blocks.append({
                    "block_id": row["block_id"],
                    "name": row["name"],
                    "score": row["composite_score"],
                    "lat": row["centroid_lat"],
                    "lng": row["centroid_lng"],
                })
                total_score += row["composite_score"]

            corridors.append({
                "id": f"corridor_{len(corridors) + 1}",
                "block_count": len(members),
                "avg_score": round(total_score / len(members), 1),
                "severity": "critical" if total_score / len(members) >= 60 else "severe",
                "blocks": corridor_blocks,
            })

    corridors.sort(key=lambda c: c["avg_score"], reverse=True)
    print(f"  Found {len(corridors)} contagion corridors ({sum(c['block_count'] for c in corridors)} blocks)")

    # Mark blocks that are in corridors
    corridor_block_ids = set()
    for c in corridors:
        for b in c["blocks"]:
            corridor_block_ids.add(b["block_id"])
    block_gdf["in_corridor"] = block_gdf["block_id"].isin(corridor_block_ids)

    return corridors


# ============================================================
# STEP 5: Export
# ============================================================
def simplify_geom(geom, tol=0.0005):
    return geom.simplify(tol, preserve_topology=True)


def export_blocks(block_gdf):
    """Export scored blocks as GeoJSON."""
    print("\nExporting blocks.json...")
    features = []
    for _, row in block_gdf.iterrows():
        sg = simplify_geom(row.geometry)
        gj = mapping(sg)

        def round_c(coords):
            if isinstance(coords[0], (list, tuple)):
                return [round_c(c) for c in coords]
            return [round(c, 5) for c in coords]

        if gj["type"] == "Polygon":
            gj["coordinates"] = [round_c(r) for r in gj["coordinates"]]
        elif gj["type"] == "MultiPolygon":
            gj["coordinates"] = [[round_c(r) for r in p] for p in gj["coordinates"]]

        features.append({
            "type": "Feature",
            "geometry": gj,
            "properties": {
                "id": row["block_id"],
                "name": row["name"],
                "zone_type": row["zone_type"],
                "dominant_zoning": row["dominant_zoning"],
                "num_parcels": int(row["num_parcels"]),
                "area_km2": row["area_km2"],
                "composite_score": row["composite_score"],
                "decay_velocity_score": row["decay_velocity_score"],
                "commercial_decline_score": row["commercial_decline_score"],
                "infrastructure_stress_score": row["infrastructure_stress_score"],
                "anchor_strength_score": row["anchor_strength_score"],
                "risk_level": row["risk_level"],
                "decay_trend": row["decay_trend"],
                "in_corridor": bool(row["in_corridor"]),
                "count_code_violations": int(row["count_code_violations"]),
                "count_311": int(row["count_311"]),
                "count_env_nuisance": int(row["count_env_nuisance"]),
                "count_traffic_requests": int(row["count_traffic_requests"]),
                "count_food_establishments": int(row["count_food_establishments"]),
                "count_poi": int(row["count_poi"]),
                "count_visited_places": int(row["count_visited_places"]),
                "dist_food_km": row["dist_food_km"],
                "dist_pharmacy_km": row["dist_pharmacy_km"],
                "dist_park_km": row["dist_park_km"],
                "dist_school_km": row["dist_school_km"],
                "dist_community_km": row["dist_community_km"],
                "dist_fire_police_km": row["dist_fire_police_km"],
            },
        })

    geojson = {"type": "FeatureCollection", "features": features}
    out = os.path.join(OUTPUT_DIR, "blocks.json")
    with open(out, "w") as f:
        json.dump(geojson, f)
    print(f"  Saved {len(features)} blocks ({os.path.getsize(out)/1024:.0f} KB)")


def export_corridors(corridors):
    """Export contagion corridors."""
    print("Exporting corridors.json...")
    out = os.path.join(OUTPUT_DIR, "corridors.json")
    with open(out, "w") as f:
        json.dump(corridors, f)
    print(f"  Saved {len(corridors)} corridors")


def export_city_overview(block_gdf):
    """Export city-wide blight overview stats."""
    print("Exporting overview.json...")

    risk_counts = block_gdf["risk_level"].value_counts().to_dict()
    overview = {
        "total_blocks": len(block_gdf),
        "total_code_violations": int(block_gdf["count_code_violations"].sum()),
        "total_311_requests": int(block_gdf["count_311"].sum()),
        "avg_blight_score": round(block_gdf["composite_score"].mean(), 1),
        "max_blight_score": round(block_gdf["composite_score"].max(), 1),
        "blocks_critical": risk_counts.get("critical", 0),
        "blocks_high": risk_counts.get("high", 0),
        "blocks_elevated": risk_counts.get("elevated", 0),
        "blocks_moderate": risk_counts.get("moderate", 0),
        "blocks_stable": risk_counts.get("stable", 0),
        "blocks_in_corridors": int(block_gdf["in_corridor"].sum()),
        "corridor_count": int(block_gdf["in_corridor"].sum()),
        "accelerating_count": int((block_gdf["decay_trend"] == "accelerating").sum()),
    }

    out = os.path.join(OUTPUT_DIR, "overview.json")
    with open(out, "w") as f:
        json.dump(overview, f)
    print(f"  Saved city overview")


# ============================================================
# MAIN
# ============================================================
def main():
    print("=" * 60)
    print("DecayMap MGM — Urban Decay Intelligence Pipeline")
    print("=" * 60)

    block_gdf = load_zones()
    scored_gdf = compute_blight_scores(block_gdf)
    corridors = compute_contagion_corridors(scored_gdf, threshold=45)

    print("\n" + "=" * 60)
    print("BLIGHT SCORING SUMMARY")
    print("=" * 60)
    print(f"  Total blocks: {len(scored_gdf)}")
    print(f"  Avg blight score: {scored_gdf['composite_score'].mean():.1f}")
    print(f"  Critical blocks: {(scored_gdf['risk_level'] == 'critical').sum()}")
    print(f"  High-risk blocks: {(scored_gdf['risk_level'] == 'high').sum()}")
    print(f"  Blocks in contagion corridors: {scored_gdf['in_corridor'].sum()}")
    print(f"  Contagion corridors found: {len(corridors)}")

    top5 = scored_gdf.nlargest(5, "composite_score")
    print(f"\n  TOP 5 HIGHEST BLIGHT RISK:")
    for _, row in top5.iterrows():
        corridor = " [IN CORRIDOR]" if row["in_corridor"] else ""
        print(f"    {row['name']}: {row['composite_score']}{corridor}")
        print(f"      Violations: {row['count_code_violations']} | 311: {row['count_311']}")

    export_blocks(scored_gdf)
    export_corridors(corridors)
    export_city_overview(scored_gdf)

    print("\n" + "=" * 60)
    print("PIPELINE COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
