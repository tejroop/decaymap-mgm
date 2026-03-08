# DecayMap MGM — Urban Decay Intelligence with Explainable AI

## Challenge Stream
**Stream 3: Smart Cities, Infrastructure & Public Spaces**

### Core Differentiator: Explainable AI City Life Assistant
DecayMap MGM goes beyond dashboards — it includes an **Explainable AI City Life Assistant** that translates complex urban data into plain-language insights for citizens, planners, and community organizations. Every rating, recommendation, and corridor analysis can be questioned and answered transparently.

---

## Problem Statement

Montgomery has over 78,000 recorded code violations and 207,000+ civic complaints — but no tool connects these signals to show WHERE urban decay is accelerating, WHERE it will spread next, and WHICH neighborhoods still have strong enough community anchors to resist it.

By the time a block visibly deteriorates — boarded windows, overgrown lots, abandoned storefronts — intervention is already 3-5 years too late. City planners need a predictive lens, not a rearview mirror.

**Key insight**: Urban decay doesn't happen in isolation. When one block deteriorates, adjacent blocks follow within 12-18 months. This **blight contagion** effect means a single at-risk block can trigger a chain reaction across an entire corridor.

---

## Solution: DecayMap MGM

A predictive urban decay intelligence platform that transforms 19 City of Montgomery datasets into a **Blight Risk Score** for every neighborhood block — and identifies **Contagion Corridors** where decay is actively spreading between connected blocks.

### The Four Dimensions (each scored 0-100)

1. **Decay Velocity (35%)** — Code violations + 311 complaints per km2. Measures how fast physical deterioration signals are accumulating.
2. **Commercial Decline (25%)** — Distance to active food establishments, pharmacies, and high-traffic locations. Measures economic vitality erosion.
3. **Infrastructure Stress (20%)** — Traffic engineering requests + environmental nuisance density. Measures public infrastructure strain.
4. **Anchor Strength (20%)** — Proximity to schools, parks, and community centers. Measures the stabilizing institutions that resist blight (inverted — more anchors = lower risk).

### Blight Contagion Corridors

The breakthrough feature: DecayMap runs spatial adjacency analysis to identify connected chains of 3+ high-risk blocks within 1.8km of each other. These **Contagion Corridors** show where blight is spreading geographically — like an epidemiological map for urban decay.

Our analysis found **4 active corridors** involving **16 blocks** in Montgomery.

---

## Datasets Used (19 of 24)

| Dataset | Records | Role |
|---------|---------|------|
| Code Violations | 78,716 | PRIMARY decay signal |
| 311 Service Requests | 207,127 | Complaint density signal |
| Environmental Nuisance | 330 | Environmental decay |
| Traffic Engineering | 360 | Infrastructure stress |
| Food Inspection Scores | 1,337 | Commercial vitality indicator |
| Most Visited Places | 100 | Foot traffic / economic health |
| Point of Interest | 53 | Commercial presence |
| Pharmacy Locator | 33 | Healthcare commerce anchor |
| Parks & Trails | 97 | Green space anchor |
| Education Facilities | 114 | Institutional anchor |
| Community Centers | 21 | Social infrastructure anchor |
| Fire & Police Stations | 33 | Government investment presence |
| Zoning | 2,036 | Block boundaries |
| City Limit | 1 | Boundary |
| 911 Calls | 156 | Emergency demand context |
| Traffic KPI | 12 | Infrastructure maintenance |
| Daily Population | 1,000 | Population context |
| Tornado Shelters | 6 | Infrastructure |
| Weather Sirens | 76 | Infrastructure |

---

## Architecture

**Zero-backend design** — completely static.

```
ArcGIS REST APIs → Python Pipeline → Static JSON → React Frontend
```

### Data Pipeline (Python)
- Grid-clusters 2,036 zoning polygons into 403 city blocks
- Spatial joins 290K+ data points using shapely spatial index
- Computes 4-dimension blight prediction scores
- Runs union-find connected component analysis for contagion corridors
- Outputs 3 static JSON files (<600KB total)

### Frontend (React + TypeScript)
- Editorial warm-theme design (cream/stone palette, serif headings)
- Stamen Toner Lite map tiles for newspaper/investigative journalism aesthetic
- Full-bleed map with floating card panels (not sidebar-based)
- Blight Contagion Corridors drawn as red dashed polylines on map
- Interactive corridor panel for highlighting connected decay chains
- City-wide overview stats bar
- Score distribution chart with risk-level breakdown

### Explainable AI System (3 Layers)

**Layer 1: Narrative Insight Cards** — When you click any block, an "AI: Explain This Block" button reveals three contextual cards: Why This Rating (traces the score to specific data dimensions), Recommended Action (prioritized interventions), and Service Access (equity analysis of nearby amenities). Corridors also show AI-generated contagion explanations when expanded.

**Layer 2: Chat Panel Overlay** — A floating chat assistant on the map page where users ask natural-language questions like "Why is this block high-risk?" or "Which areas need urgent attention?" The AI responds with data-backed explanations, trending blocks, and corridor analysis. Context-aware: when you select a block on the map, the assistant automatically knows which block you're asking about.

**Layer 3: Full-Page AI Explorer** — A dedicated assistant page with a block browser sidebar, city statistics dashboard, and conversational interface. Users can explore all 403 blocks through natural language, click any critical block to auto-generate an explanation, and navigate directly to the map to see spatial context.

**How it works**: Rule-based Natural Language Generation (NLG) — no external LLM API. Every explanation is deterministic, auditable, and traces back to specific data points. This makes the system truly "explainable" rather than relying on opaque neural networks. The AI engine covers block risk analysis, recommended actions, service access equity, corridor contagion patterns, city-wide summaries, scoring methodology, and citizen guidance.

### Tech Stack
Vite, React 18, TypeScript, Tailwind CSS, Leaflet, Recharts, Python (geopandas/shapely)

---

## Scoring Alignment (35 total points)

### 1. Relevance to Challenge (10 pts)

DecayMap directly addresses **Stream 3: Smart Cities, Infrastructure & Public Spaces**:

- **Smart Cities**: Predictive blight scoring turns reactive code enforcement into proactive urban planning. The contagion corridor analysis is a smart city technique borrowed from epidemiology.
- **Infrastructure**: Infrastructure Stress dimension directly measures traffic engineering requests and environmental nuisance — signals that public infrastructure is failing.
- **Public Spaces**: Anchor Strength dimension measures proximity to parks, community centers, and schools — the public spaces that stabilize neighborhoods against decay.

**Data coverage**: Uses 19 of 24 available Montgomery datasets with each one connected to a specific scoring dimension.

### 2. Quality & Design (10 pts)

- Warm editorial design language — completely opposite of typical dashboard UIs
- Playfair Display serif headings + Source Sans 3 body text = newspaper investigative feel
- Stamen Toner Lite map tiles — muted grayscale basemap that lets data colors pop
- Floating card UI (not sidebar) — feels modern and uncluttered
- Animated transitions (float-up cards, corridor pulse)
- Contagion Corridors visualized as red dashed polylines connecting at-risk blocks
- Responsive overview bar with warm accent colors
- Score distribution chart with risk-level color coding

### 3. Originality (5 pts)

- **"Blight Contagion" concept** — Treating urban decay as a spreading phenomenon, not isolated incidents. No existing Montgomery tool does spatial adjacency analysis to identify connected decay chains.
- **Union-find connected component analysis** — Uses graph theory (union-find algorithm) to identify corridors, borrowed from epidemiology/network science.
- **Explainable AI City Life Assistant** — A 3-layer AI system (narrative cards + chat overlay + full-page explorer) that translates raw data into plain-language insights. Unlike black-box AI dashboards, every explanation is deterministic and auditable — true explainability, not marketing.
- **Predictive framing** — "Where will blight spread next?" instead of "Where is blight now?" Anchor Strength dimension quantifies resistance to decay.
- **Editorial design language** — Warm, journalistic aesthetic makes data feel like an investigative report, not a government dashboard.

### 4. Social Impact (5 pts)

**DecayMap exposes the geography of disinvestment.**

Urban decay is not random — it follows patterns of historical disinvestment, infrastructure neglect, and commercial flight. DecayMap makes these patterns visible and measurable.

**Who benefits**:
- **City planners** can identify which corridors need immediate intervention to prevent blight from spreading to adjacent stable blocks — targeted investment instead of city-wide spending. The AI Assistant explains WHY each block is at risk, turning data into actionable intelligence.
- **Community Development Organizations** gain data-backed evidence for grant applications to federal programs (CDBG, HOME, Opportunity Zones). The AI generates plain-language explanations that can be directly quoted in grant narratives.
- **Residents** can use the City Life Assistant to understand their block's health in plain language — no data literacy required. Ask "Why is my block rated this way?" and get a transparent answer. This is civic tech that includes everyone.
- **Code enforcement** can prioritize inspections along contagion corridors where violations are most likely to multiply.

**Explainable AI & Equity**: The AI Assistant doesn't just present data — it makes complex urban analysis accessible to non-technical users. A resident with no data science background can ask questions and get the same quality insights as a trained urban planner. This democratization of data is itself a social impact.

**Equity angle**: Blight disproportionately affects lower-income neighborhoods. DecayMap's Anchor Strength dimension highlights that communities with fewer stabilizing institutions face higher decay risk — making the case for equitable public space investment.

### 5. Commercial Potential (5 pts)

#### Product: DecayMap as a Service

White-label urban decay prediction platform for municipalities and real estate developers.

| Tier | Price | Audience |
|------|-------|----------|
| **Open** (Free) | $0 | Public dashboard for any city with ArcGIS data |
| **City Pro** | $3,000/mo | Custom dimensions, corridor alerts, department dashboards |
| **Developer** | $5,000/mo | Parcel-level scoring, API access, investment risk overlays |
| **Enterprise** | $10,000/mo | Multi-city, historical trends, predictive modeling, SSO |

#### Revenue Streams
- **Municipal contracts**: $672M TAM (274 US cities with 100K+ population)
- **Real estate intelligence**: Sell block-level blight risk scores to developers, investors, and insurers
- **Grant consulting**: Help CDCs and municipalities use DecayMap data to win CDBG/HUD grants ($3B+ annual federal allocation)
- **Insurance underwriting**: Property insurers pay for neighborhood-level decay predictions to adjust premiums

#### Competitive Advantage
- Zero infrastructure cost — static files, free hosting
- Works with existing ArcGIS data (97% of US cities use Esri)
- Contagion Corridor analysis is a defensible technical moat
- **Explainable AI** eliminates the "black box" problem — cities can justify decisions made with DecayMap because every recommendation is auditable and traceable to source data
- AI City Life Assistant creates consumer-grade accessibility for government-grade data
- 5-minute deployment for any new city

---

## Demo Video Script (2 minutes)

**[0:00-0:12]** Hook: "Urban decay spreads like a contagion. DecayMap MGM reveals where blight is spreading in Montgomery — and an AI assistant explains every rating in plain English."

**[0:12-0:30]** Overview: Pan across the map showing the warm-toned blocks. Point out the overview bar stats. "We analyzed 78,000 code violations and 207,000 civic complaints across 403 city blocks."

**[0:30-0:50]** Corridors: Click on a Contagion Corridor in the panel. Watch the map highlight the chain with red dashed lines. Show the AI explanation that appears in the corridor panel. "This is a Contagion Corridor — connected blocks where decay is spreading. The AI explains why this corridor formed."

**[0:50-1:10]** AI Block Detail: Click a high-risk block. Show the detail card, then click "AI: Explain This Block" to reveal narrative insight cards. "Three AI-generated cards explain why this block is rated critical, what actions the city should take, and how far residents are from essential services. Every insight traces to real data."

**[1:10-1:30]** Chat Panel: Click the AI chat button in the bottom-right. Ask "Which areas need the most urgent attention?" Show the AI response listing the worst blocks with explanations. "Citizens can ask natural-language questions and get data-backed answers — no data science degree required."

**[1:30-1:50]** Full Assistant Page: Click "City Life Assistant" in the top-right. Show the full-page AI explorer with block browser and conversational interface. Click a critical block in the sidebar to auto-generate an explanation. "A dedicated AI page lets users explore all 403 blocks through conversation."

**[1:50-2:00]** Close: "DecayMap MGM — Explainable AI for urban decay intelligence. Every score traceable, every recommendation auditable, every citizen empowered."
