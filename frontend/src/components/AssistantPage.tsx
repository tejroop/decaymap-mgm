import React, { useState, useRef, useEffect } from 'react';
import type { BlockCollection, BlockFeature, Corridor, CityOverview } from '../types';
import {
  answerQuestion,
  getSuggestedQuestions,
  type ChatMessage,
  type ChatContext,
} from '../aiExplainer';
import { getBlightColor, getRiskLabel } from '../utils';

interface AssistantPageProps {
  blocks: BlockCollection | null;
  corridors: Corridor[];
  overview: CityOverview | null;
  onNavigateToMap: (block?: BlockFeature) => void;
}

const AssistantPage: React.FC<AssistantPageProps> = ({
  blocks,
  corridors,
  overview,
  onNavigateToMap,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<BlockFeature | null>(null);
  const [mobileTab, setMobileTab] = useState<'chat' | 'browse'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ctx: ChatContext = { blocks, corridors, overview, selectedBlock };
  const suggestions = getSuggestedQuestions(ctx);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: text.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const answer = answerQuestion(text, ctx);
      const assistantMsg: ChatMessage = { role: 'assistant', text: answer, timestamp: Date.now() };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 500 + Math.random() * 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  // Quick stats for the sidebar
  const criticalBlocks = blocks?.features.filter(f => f.properties.risk_level === 'critical') ?? [];
  const topBlocks = [...criticalBlocks].sort((a, b) => b.properties.composite_score - a.properties.composite_score).slice(0, 8);

  return (
    <div className="w-full flex flex-col bg-stone-50" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="px-4 lg:px-6 py-3 lg:py-4 bg-white border-b border-stone-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <svg className="w-4 h-4 lg:w-6 lg:h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h1 className="font-serif text-sm lg:text-xl text-stone-800">City Life Assistant</h1>
            <p className="text-[10px] lg:text-xs text-stone-500 hidden lg:block">Explainable AI for Montgomery's Urban Data</p>
          </div>
        </div>
        <button
          onClick={() => onNavigateToMap()}
          className="flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg bg-stone-100 hover:bg-stone-200 transition-colors text-xs lg:text-sm text-stone-700 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span className="hidden lg:inline">Back to</span> Map
        </button>
      </div>

      {/* Mobile tab switcher */}
      <div className="flex lg:hidden bg-white border-b border-stone-200 flex-shrink-0">
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2 text-xs font-semibold text-center transition-colors ${mobileTab === 'chat' ? 'text-amber-700 border-b-2 border-amber-500' : 'text-stone-400'}`}
        >
          💡 Chat
        </button>
        <button
          onClick={() => setMobileTab('browse')}
          className={`flex-1 py-2 text-xs font-semibold text-center transition-colors ${mobileTab === 'browse' ? 'text-amber-700 border-b-2 border-amber-500' : 'text-stone-400'}`}
        >
          ⚠️ Critical Blocks
        </button>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Sidebar — Block browser (desktop always, mobile when browsing) */}
        <div className={`${mobileTab === 'browse' ? 'flex' : 'hidden'} lg:flex w-full lg:w-[300px] border-r border-stone-200 bg-white flex-col flex-shrink-0`}>
          {/* City summary card */}
          <div className="p-4 border-b border-stone-200">
            <h3 className="font-serif text-sm font-semibold text-stone-800 mb-2">City Overview</h3>
            {overview && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-stone-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-stone-800">{overview.total_blocks}</div>
                  <div className="text-[10px] text-stone-500">Total Blocks</div>
                </div>
                <div className="bg-red-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-red-700">{overview.blocks_critical}</div>
                  <div className="text-[10px] text-stone-500">Critical</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-orange-700">{overview.corridor_count}</div>
                  <div className="text-[10px] text-stone-500">Corridors</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-amber-700">{overview.accelerating_count}</div>
                  <div className="text-[10px] text-stone-500">Accelerating</div>
                </div>
              </div>
            )}
          </div>

          {/* Critical blocks list */}
          <div className="p-3 border-b border-stone-200">
            <h3 className="font-serif text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              Critical Blocks — Click to Explore
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {topBlocks.map(block => {
              const p = block.properties;
              const isActive = selectedBlock?.properties.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedBlock(isActive ? null : block);
                    if (!isActive) {
                      handleSend(`Why is ${p.name} rated ${p.risk_level}?`);
                      setMobileTab('chat');
                    }
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-stone-100 transition-all ${
                    isActive ? 'bg-amber-50 border-l-4 border-l-amber-500' : 'hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-stone-800 truncate">{p.name}</span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded text-white ml-2 flex-shrink-0"
                      style={{ backgroundColor: getBlightColor(p.composite_score) }}
                    >
                      {p.composite_score.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-stone-500">
                    <span>{getRiskLabel(p.risk_level)}</span>
                    <span>·</span>
                    <span>{p.decay_trend}</span>
                    {p.in_corridor && (
                      <>
                        <span>·</span>
                        <span className="text-blue-600 font-semibold">In Corridor</span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* View on map button */}
          {selectedBlock && (
            <div className="p-3 border-t border-stone-200 bg-stone-50">
              <button
                onClick={() => onNavigateToMap(selectedBlock)}
                className="w-full py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                View on Map
              </button>
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className={`${mobileTab === 'chat' ? 'flex' : 'hidden'} lg:flex flex-1 flex-col bg-stone-50`} style={{ minHeight: 0 }}>
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6">
            {messages.length === 0 ? (
              /* Welcome state */
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-6 lg:mb-8 pt-4 lg:pt-8">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-3 lg:mb-4">
                    <svg className="w-7 h-7 lg:w-9 lg:h-9 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h2 className="font-serif text-xl lg:text-2xl text-stone-800 mb-2">
                    What would you like to know about Montgomery?
                  </h2>
                  <p className="text-xs lg:text-sm text-stone-500 max-w-md mx-auto">
                    I analyze 19 open datasets to explain urban decay patterns, blight corridors, and neighborhood health. Every answer is traceable to real data.
                  </p>
                </div>

                {/* Suggestion grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-3">
                  {suggestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q)}
                      className="text-left p-3 lg:p-4 rounded-xl bg-white border border-stone-200 hover:border-amber-300 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
                          <span className="text-amber-600 text-sm">{['?', '!', '📊', '🏘️', '⚙️', '🌿'][i] ?? '💡'}</span>
                        </div>
                        <span className="text-sm text-stone-700 leading-snug">{q}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Data transparency callout */}
                <div className="mt-6 lg:mt-8 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-semibold text-amber-800 mb-1">Explainable by Design</h4>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        Every score, rating, and recommendation traces back to specific data points from Montgomery's open datasets.
                        No black boxes — ask "why?" about any block and get a transparent breakdown.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Message history */
              <div className="max-w-2xl mx-auto space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        msg.role === 'user' ? 'bg-stone-200' : 'bg-gradient-to-br from-amber-500 to-orange-600'
                      }`}>
                        {msg.role === 'user' ? (
                          <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        )}
                      </div>
                      <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-line ${
                        msg.role === 'user'
                          ? 'bg-amber-500 text-white rounded-tr-sm'
                          : 'bg-white border border-stone-200 text-stone-700 rounded-tl-sm shadow-sm'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="px-4 py-3 rounded-xl rounded-tl-sm bg-white border border-stone-200 text-stone-500 shadow-sm">
                        <span className="inline-flex gap-1">
                          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>·</span>
                          <span className="animate-bounce" style={{ animationDelay: '150ms' }}>·</span>
                          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>·</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="px-3 lg:px-8 py-3 lg:py-4 border-t border-stone-200 bg-white flex-shrink-0">
            <div className="max-w-2xl mx-auto flex gap-2 lg:gap-3">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about urban decay..."
                className="flex-1 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
              />
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isTyping}
                className="px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-sm hover:from-amber-600 hover:to-orange-700 disabled:opacity-40 transition-all flex items-center gap-1.5 lg:gap-2"
              >
                <span className="hidden lg:inline">Send</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <div className="max-w-2xl mx-auto mt-1.5 lg:mt-2 text-center hidden lg:block">
              <span className="text-[10px] text-stone-400">
                Explainable AI · Every answer traces to real Montgomery open data · No black boxes
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantPage;
