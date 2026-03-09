import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface StreamingMessageProps {
    text: string;
    isStreaming: boolean;
    onComplete?: () => void;
    className?: string;
}

const markdownComponents = {
    p: ({ children }: any) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
    strong: ({ children }: any) => <strong className="font-bold text-stone-900">{children}</strong>,
    ul: ({ children }: any) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
    li: ({ children }: any) => <li>{children}</li>,
    h3: ({ children }: any) => <h3 className="font-bold text-stone-800 text-sm mt-3 mb-1">{children}</h3>,
    h4: ({ children }: any) => <h4 className="font-semibold text-stone-700 text-xs mt-2 mb-1 uppercase tracking-wider">{children}</h4>,
};

export const StreamingMessage: React.FC<StreamingMessageProps> = ({
    text,
    isStreaming,
    onComplete,
    className
}) => {
    const [displayedText, setDisplayedText] = useState(isStreaming ? '' : text);

    useEffect(() => {
        if (!isStreaming) {
            setDisplayedText(text);
            return;
        }

        let i = 0;
        // Chunking text to make it look a bit more like LLM tokens
        const interval = setInterval(() => {
            setDisplayedText(text.slice(0, i));
            i += Math.floor(Math.random() * 3) + 1; // Stream 1-3 chars at a time
            if (i > text.length) {
                setDisplayedText(text);
                clearInterval(interval);
                if (onComplete) onComplete();
            }
        }, 15);

        return () => clearInterval(interval);
    }, [text, isStreaming, onComplete]);

    return (
        <div className={`markdown-content ${className || ''}`}>
            <ReactMarkdown components={markdownComponents}>{displayedText}</ReactMarkdown>
            {isStreaming && displayedText.length < text.length && (
                <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-amber-500 animate-pulse align-middle" />
            )}
        </div>
    );
};
