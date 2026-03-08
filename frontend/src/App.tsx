import React, { useState, useEffect } from 'react';
import type { BlockCollection, BlockFeature, Corridor, CityOverview } from './types';
import OverviewBar from './components/OverviewBar';
import DecayMap from './components/DecayMap';
import BlockDetail from './components/BlockDetail';
import CorridorPanel from './components/CorridorPanel';
import ChatPanel from './components/ChatPanel';
import AssistantPage from './components/AssistantPage';
import InstallPrompt from './components/InstallPrompt';

type Page = 'map' | 'assistant';

const App: React.FC = () => {
  const [blocks, setBlocks] = useState<BlockCollection | null>(null);
  const [corridors, setCorridors] = useState<Corridor[]>([]);
  const [overview, setOverview] = useState<CityOverview | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<BlockFeature | null>(null);
  const [activeCorridor, setActiveCorridor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<Page>('map');
  const [mobileTab, setMobileTab] = useState<'map' | 'corridors'>('map');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [blocksRes, corridorsRes, overviewRes] = await Promise.all([
          fetch('/data/blocks.json'),
          fetch('/data/corridors.json'),
          fetch('/data/overview.json'),
        ]);
        if (!blocksRes.ok || !corridorsRes.ok || !overviewRes.ok) throw new Error('Fetch failed');
        setBlocks(await blocksRes.json());
        setCorridors(await corridorsRes.json());
        setOverview(await overviewRes.json());
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSelectCorridor = (corridorId: string | null) => {
    setActiveCorridor(corridorId);
    setSelectedBlock(null);
  };

  const handleNavigateToMap = (block?: BlockFeature) => {
    if (block) {
      setSelectedBlock(block);
      setActiveCorridor(null);
    }
    setPage('map');
    setMobileTab('map');
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-stone-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-4xl text-stone-800 mb-4">DecayMap MGM</h1>
          <p className="text-stone-600 font-serif text-lg mb-6">Urban Decay Intelligence Platform</p>
          <div className="flex justify-center gap-2 mb-4">
            <div className="w-3 h-3 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-3 h-3 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-3 h-3 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-stone-500 text-sm">Loading data...</p>
        </div>
      </div>
    );
  }

  if (page === 'assistant') {
    return (
      <>
        <AssistantPage blocks={blocks} corridors={corridors} overview={overview} onNavigateToMap={handleNavigateToMap} />
        <style>{globalStyles}</style>
      </>
    );
  }

  return (
    <div className="w-full bg-stone-50 flex flex-col" style={{ height: '100dvh' }}>
      {/* Desktop header */}
      <div className="hidden md:block">
        <OverviewBar overview={overview} />
      </div>

      {/* === DESKTOP LAYOUT === */}
      <div className="hidden md:flex relative flex-1 overflow-hidden">
        {corridors.length > 0 && (
          <CorridorPanel corridors={corridors} onSelectCorridor={handleSelectCorridor} activeCorridor={activeCorridor} blocks={blocks} />
        )}
        <DecayMap
          data={blocks}
          selected={selectedBlock}
          onSelect={(feature) => { setSelectedBlock(feature); setActiveCorridor(null); }}
          corridors={corridors}
          activeCorridor={activeCorridor}
        />
        {selectedBlock && <BlockDetail feature={selectedBlock} onClose={() => setSelectedBlock(null)} />}
        <ChatPanel blocks={blocks} corridors={corridors} overview={overview} selectedBlock={selectedBlock} />
        <button
          onClick={() => setPage('assistant')}
          className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2.5 bg-white/95 backdrop-blur rounded-xl shadow-lg border border-stone-200 hover:border-amber-300 hover:shadow-xl transition-all group"
          style={{ zIndex: 1000 }}
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-stone-800 group-hover:text-amber-700 transition-colors">City Life Assistant</div>
            <div className="text-[10px] text-stone-500">Full AI Explorer</div>
          </div>
          <svg className="w-4 h-4 text-stone-400 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* === MOBILE LAYOUT === */}
      <div className="flex md:hidden flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="bg-white border-b border-stone-200 px-3 py-2 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="font-serif text-base font-bold text-stone-800">DecayMap <span className="text-amber-700">MGM</span></h1>
            <p className="text-[10px] text-stone-400">Urban Decay Intelligence</p>
          </div>
          {overview && (
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-sm font-bold text-red-600">{overview.blocks_critical}</div>
                <div className="text-[8px] text-stone-400">CRITICAL</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-stone-700">{overview.total_blocks}</div>
                <div className="text-[8px] text-stone-400">BLOCKS</div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile content */}
        {mobileTab === 'map' ? (
          <div className="flex-1 relative" style={{ minHeight: 0 }}>
            <DecayMap
              data={blocks}
              selected={selectedBlock}
              onSelect={(feature) => { setSelectedBlock(feature); setActiveCorridor(null); }}
              corridors={corridors}
              activeCorridor={activeCorridor}
            />

            {/* Mobile bottom sheet for selected block */}
            {selectedBlock && (
              <div className="absolute bottom-0 left-0 right-0 z-[1001] bg-white/95 backdrop-blur-sm border-t border-stone-200 rounded-t-2xl shadow-2xl" style={{ maxHeight: '45vh', overflowY: 'auto' }}>
                <div className="flex justify-center pt-2 pb-1">
                  <div className="w-10 h-1 rounded-full bg-stone-300" />
                </div>
                <div className="flex items-center justify-between px-4 pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-stone-800">{selectedBlock.properties.name || `Block ${selectedBlock.properties.id}`}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-2xl font-black" style={{ color: selectedBlock.properties.composite_score > 60 ? '#dc2626' : selectedBlock.properties.composite_score > 40 ? '#ea580c' : '#16a34a' }}>
                        {selectedBlock.properties.composite_score.toFixed(0)}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{
                        backgroundColor: selectedBlock.properties.composite_score > 60 ? '#fef2f2' : selectedBlock.properties.composite_score > 40 ? '#fff7ed' : '#f0fdf4',
                        color: selectedBlock.properties.composite_score > 60 ? '#dc2626' : selectedBlock.properties.composite_score > 40 ? '#ea580c' : '#16a34a'
                      }}>
                        {selectedBlock.properties.composite_score > 60 ? 'CRITICAL' : selectedBlock.properties.composite_score > 40 ? 'AT RISK' : 'STABLE'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedBlock(null)} className="text-stone-400 hover:text-stone-700 p-2 -mr-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                  <div className="bg-stone-100 rounded-lg p-2.5 text-center">
                    <div className="text-[10px] text-stone-500">Code Violations</div>
                    <div className="text-sm text-stone-800 font-bold">{selectedBlock.properties.count_code_violations}</div>
                  </div>
                  <div className="bg-stone-100 rounded-lg p-2.5 text-center">
                    <div className="text-[10px] text-stone-500">311 Requests</div>
                    <div className="text-sm text-stone-800 font-bold">{selectedBlock.properties.count_311}</div>
                  </div>
                  <div className="bg-stone-100 rounded-lg p-2.5 text-center">
                    <div className="text-[10px] text-stone-500">Env Nuisance</div>
                    <div className="text-sm text-stone-800 font-bold">{selectedBlock.properties.count_env_nuisance}</div>
                  </div>
                  <div className="bg-stone-100 rounded-lg p-2.5 text-center">
                    <div className="text-[10px] text-stone-500">Trend</div>
                    <div className="text-sm text-stone-800 font-bold">{selectedBlock.properties.decay_trend || 'stable'}</div>
                  </div>
                </div>
              </div>
            )}

            <ChatPanel blocks={blocks} corridors={corridors} overview={overview} selectedBlock={selectedBlock} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-white">
            {corridors.map((c, i) => (
              <button
                key={i}
                onClick={() => { handleSelectCorridor(c.id); setMobileTab('map'); }}
                className={`w-full text-left px-4 py-3 border-b border-stone-100 hover:bg-stone-50 transition-colors ${activeCorridor === c.id ? 'bg-amber-50 border-l-2 border-l-amber-500' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-stone-800">Corridor {c.id.replace('corridor_', '#')}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">Blocks: {c.block_count} | Avg: {c.avg_score?.toFixed(1) || 'N/A'}</div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{
                    color: (c.avg_score || 0) > 60 ? '#dc2626' : '#ea580c',
                    backgroundColor: (c.avg_score || 0) > 60 ? '#fef2f2' : '#fff7ed'
                  }}>
                    {c.avg_score?.toFixed(0) || '—'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Mobile bottom tab bar */}
        <div className="flex bg-white border-t border-stone-200 z-[1002] flex-shrink-0">
          <button
            onClick={() => setMobileTab('map')}
            className={`flex-1 py-2.5 text-center text-[10px] font-semibold transition-colors ${mobileTab === 'map' ? 'text-amber-700' : 'text-stone-400'}`}
          >
            <div className="text-base mb-0.5">🗺️</div>
            Map
          </button>
          <button
            onClick={() => setMobileTab('corridors')}
            className={`flex-1 py-2.5 text-center text-[10px] font-semibold transition-colors ${mobileTab === 'corridors' ? 'text-amber-700' : 'text-stone-400'}`}
          >
            <div className="text-base mb-0.5">📊</div>
            Corridors
          </button>
          <button
            onClick={() => setPage('assistant')}
            className="flex-1 py-2.5 text-center text-[10px] font-semibold text-stone-400"
          >
            <div className="text-base mb-0.5">💡</div>
            AI
          </button>
        </div>
      </div>

      <style>{globalStyles}</style>

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
};

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap');

  * { font-family: 'Source Sans 3', sans-serif; }
  .font-serif { font-family: 'Playfair Display', serif; }
  body { background-color: #faf7f2; }

  .float-up { animation: floatUp 0.4s ease-out forwards; }
  @keyframes floatUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

  .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .leaflet-container { background: #faf7f2; }
  .leaflet-control-zoom { border: 1px solid #d6d3d1 !important; border-radius: 6px !important; background: white !important; }
  .leaflet-control-zoom-in, .leaflet-control-zoom-out { color: #92400e !important; background: white !important; border: none !important; font-weight: bold; font-size: 18px; }
  .leaflet-control-zoom-in:hover, .leaflet-control-zoom-out:hover { background-color: #f5f5f4 !important; }
  .decay-tooltip-wrapper { font-family: 'Source Sans 3', sans-serif !important; }
  .leaflet-popup-content { font-family: 'Source Sans 3', sans-serif; color: #292524; }
`;

export default App;
