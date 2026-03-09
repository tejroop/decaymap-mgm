import React, { useState, useRef, useEffect } from 'react';
import type { BlockCollection, BlockFeature, Corridor, CityOverview } from '../types';
import { answerQuestion, getSuggestedQuestions, type ChatMessage, type ChatContext } from '../aiExplainer';
import { StreamingMessage } from './StreamingMessage';

interface ChatPanelProps {
  blocks: BlockCollection | null;
  corridors: Corridor[];
  overview: CityOverview | null;
  selectedBlock: BlockFeature | null;
  interventions?: { patrols: number; lighting: number; sanitation: number };
}

const ChatPanel: React.FC<ChatPanelProps> = ({ blocks, corridors, overview, selectedBlock, interventions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: "Hello! I'm the DecayMap AI Assistant. I can explain any block's risk rating, describe blight corridors, and help you understand Montgomery's urban decay data. Click a block on the map and ask me about it, or try one of the suggested questions below.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ctx: ChatContext = { blocks, corridors, overview, selectedBlock, interventions };
  const suggestions = getSuggestedQuestions(ctx);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // When selected block changes, add a context message
  useEffect(() => {
    if (selectedBlock && isOpen) {
      const contextMsg: ChatMessage = {
        role: 'assistant',
        text: `You've selected "${selectedBlock.properties.name}" (${selectedBlock.properties.risk_level} risk, score ${selectedBlock.properties.composite_score.toFixed(1)}). Ask me anything about this block — why it's rated this way, what actions are recommended, or about service access in the area.`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, contextMsg]);
    }
  }, [selectedBlock?.properties.id]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: text.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate brief "thinking" delay for realism
    setTimeout(() => {
      const answer = answerQuestion(text, ctx);
      const assistantMsg: ChatMessage = { role: 'assistant', text: answer, timestamp: Date.now(), isStreaming: true };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 400 + Math.random() * 600);
  };

  const handleStreamingComplete = (timestamp: number) => {
    setMessages(prev => prev.map(m => m.timestamp === timestamp ? { ...m, isStreaming: false } : m));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group"
        style={{ zIndex: 1001 }}
        aria-label="Open AI Assistant"
      >
        <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">AI</span>
      </button>
    );
  }

  return (
    <div
      className="absolute bottom-6 right-6 w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden float-up"
      style={{ zIndex: 1001 }}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div>
            <h3 className="font-serif text-sm font-semibold">City Life Assistant</h3>
            <p className="text-[10px] text-white/80">Explainable AI · Powered by DecayMap</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/80 hover:text-white transition-colors"
          aria-label="Close chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-line ${msg.role === 'user'
                  ? 'bg-amber-500 text-white rounded-br-sm'
                  : 'bg-stone-100 text-stone-700 rounded-bl-sm'
                }`}
            >
              {msg.role === 'assistant' ? (
                <StreamingMessage
                  text={msg.text}
                  isStreaming={!!msg.isStreaming}
                  onComplete={() => handleStreamingComplete(msg.timestamp)}
                />
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-stone-100 text-stone-500 px-4 py-2.5 rounded-xl rounded-bl-sm text-sm flex items-center gap-1">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>·</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>·</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>·</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="flex flex-wrap gap-1.5">
            {suggestions.slice(0, 4).map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="px-2.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] text-amber-800 hover:bg-amber-100 transition-colors truncate max-w-full"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-3 py-3 border-t border-stone-200 flex gap-2 flex-shrink-0 bg-stone-50">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about any block or corridor..."
          className="flex-1 px-3 py-2 rounded-lg bg-white border border-stone-200 text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
        />
        <button
          onClick={() => handleSend(input)}
          disabled={!input.trim() || isTyping}
          className="px-3 py-2 rounded-lg bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 disabled:opacity-40 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
