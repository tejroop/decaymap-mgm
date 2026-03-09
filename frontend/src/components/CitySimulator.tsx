// Component for CitySimulator

interface CitySimulatorProps {
    currentRisk: number;
    onInterventionChange: (reductions: { patrols: number; lighting: number; sanitation: number }) => void;
    reductions: { patrols: number; lighting: number; sanitation: number };
}

export default function CitySimulator({ currentRisk, onInterventionChange, reductions }: CitySimulatorProps) {
    // Calculate simulated risk with a floor of 10
    const simulatedRisk = Math.max(
        10,
        currentRisk - (reductions.patrols * 2.4) - (reductions.lighting * 1.8) - (reductions.sanitation * 1.5)
    );

    const riskDiff = currentRisk - simulatedRisk;

    return (
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xl flex flex-col h-full overflow-y-auto">
            <div className="mb-6">
                <h3 className="text-xs font-bold text-emerald-600 mb-1 tracking-widest uppercase flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Prescriptive AI Simulator
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                    Allocate resources to see the projected impact on the 90-day trajectory of the selected block.
                </p>
            </div>

            <div className="space-y-6 flex-1">
                {/* Code Enforcement Slider */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-stone-700">Code Enforcement Patrols</label>
                        <span className="text-xs font-bold text-amber-600">+{reductions.patrols} hrs/wk</span>
                    </div>
                    <p className="text-[10px] text-stone-400 mb-2">Reduces environmental hazards & violations.</p>
                    <input
                        type="range"
                        min="0"
                        max="10"
                        value={reductions.patrols}
                        className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        onChange={(e) => {
                            onInterventionChange({ ...reductions, patrols: parseInt(e.target.value) });
                        }}
                    />
                </div>

                {/* Street Lighting Slider */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-stone-700">Upgrade Street Lighting</label>
                        <span className="text-xs font-bold text-amber-600">{reductions.lighting} blocks</span>
                    </div>
                    <p className="text-[10px] text-stone-400 mb-2">Improves safety perception and deters dumping.</p>
                    <input
                        type="range"
                        min="0"
                        max="10"
                        value={reductions.lighting}
                        className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        onChange={(e) => {
                            onInterventionChange({ ...reductions, lighting: parseInt(e.target.value) });
                        }}
                    />
                </div>

                {/* Sanitation Slider */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-stone-700">Rapid Sanitation Cleanup</label>
                        <span className="text-xs font-bold text-amber-600">{reductions.sanitation} sites</span>
                    </div>
                    <p className="text-[10px] text-stone-400 mb-2">Clears abandoned properties and illegal dumping.</p>
                    <input
                        type="range"
                        min="0"
                        max="10"
                        value={reductions.sanitation}
                        className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        onChange={(e) => {
                            onInterventionChange({ ...reductions, sanitation: parseInt(e.target.value) });
                        }}
                    />
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-stone-100">
                <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500 opacity-5 rounded-bl-full" />

                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <div className="text-[10px] uppercase tracking-wider font-bold text-stone-500 mb-1">
                                Predicted 90d Risk
                            </div>
                            <div className="text-xs text-stone-400">With Interventions</div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-black text-emerald-600 shadow-sm flex items-center justify-end gap-1">
                                {simulatedRisk.toFixed(1)}
                                {riskDiff > 0 && (
                                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>

                    {riskDiff > 0 && (
                        <div className="mt-3 bg-emerald-100/50 rounded p-2 text-center border border-emerald-200/50">
                            <span className="text-xs font-bold text-emerald-700">
                                Risk Reduced by {riskDiff.toFixed(1)} pts
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
