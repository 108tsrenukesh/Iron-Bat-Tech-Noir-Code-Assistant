import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface AIChatPaneProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onSuggestionClick?: (suggestion: string) => void;
  isRepoMode?: boolean;
  repoName?: string;
}

export const AIChatPane: React.FC<AIChatPaneProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onSuggestionClick,
  isRepoMode,
  repoName,
}) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const aiAvatarUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuCWMr6UDCI8X4xEM1zXUlvo-t1nSmQcrXOzrH8QQHfd5PEgaZA09eW4CLuKdgyB1EMp1SYFeytdw3VqUNvrncCFpx5r5N9nmoH4zL8DjVGLArJ4uD5GeseNIpPEFNTbgQoQpNFGtFwHo7tI0sF8W2CMf3cjVCn7I5UJ2FkOgeV6_COr7cPsOlQ-oyg6FW2hqLNDiYOH3P_fZRaNRHwHDufHE2RCXUuXSkT0-HRhmvjEw88P_f1utFlNsw";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="flex-1 flex flex-col bg-[#050508] relative min-h-0 overflow-hidden">
      {/* NOX Slit Top Indicator Bar */}
      <div className="h-1 bg-[#1A1A22] relative w-full overflow-hidden">
        <div className="h-full bg-[#00F2FE] shadow-[0_0_12px_#00F2FE] w-1/3 animate-pulse mx-auto rounded-full" />
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-5 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className="w-full flex flex-col gap-2">
            {msg.sender === 'user' ? (
              /* User Bubble - Right aligned speech bubble */
              <div className="self-end max-w-[88%] md:max-w-[75%] relative group">
                <div className="bg-[#1A1A22] border border-[#3A3A44] p-3.5 md:p-4 rounded-2xl rounded-tr-none text-[#E0E0E0] shadow-lg">
                  <p className="font-body text-xs md:text-sm text-[#E0E0E0] leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              </div>
            ) : (
              /* AI Response Bubble - Left aligned with Iron Bat avatar */
              <div className="self-start max-w-[95%] md:max-w-[88%] flex gap-3 relative">
                {/* Holographic Avatar */}
                <div className="relative w-10 h-10 flex-shrink-0 mt-1">
                  <div className="absolute inset-0 rounded-full border border-[#00F2FE] shadow-[0_0_12px_rgba(0,242,254,0.4)] animate-pulse" />
                  <img
                    src={aiAvatarUrl}
                    alt="Iron Bat AI"
                    className="w-full h-full rounded-full object-cover border border-[#00F2FE]/60 relative z-10 bg-[#050508]"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#050508] rounded-full flex items-center justify-center z-20 border border-[#00F2FE]/40">
                    <div className="w-1.5 h-1.5 bg-[#00F2FE] rounded-full shadow-[0_0_6px_#00F2FE]" />
                  </div>
                </div>

                {/* AI Bubble Body - Immersive Glass Panel */}
                <div className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none backdrop-blur-md shadow-xl flex flex-col gap-2.5">
                  {/* Status Header */}
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <span className="material-symbols-outlined text-[#00F2FE] text-sm">memory</span>
                    <span className="font-code text-[11px] text-[#A0A0A0] uppercase tracking-wider font-bold">
                      {msg.statusLabel || 'ANALYSIS COMPLETE'}
                    </span>
                  </div>

                  {/* Main Content */}
                  <div className="font-body text-xs md:text-sm text-[#E0E0E0] leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </div>

                  {/* Bullet Points */}
                  {msg.bullets && msg.bullets.length > 0 && (
                    <ul className="font-body text-xs text-[#CCCCCC] flex flex-col gap-1.5 pt-2 border-t border-white/10">
                      {msg.bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#00F2FE] font-bold mt-0.5">›</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Interactive Action Button */}
                  {msg.snippetAction && (
                    <button
                      onClick={() => onSuggestionClick && onSuggestionClick(msg.snippetAction!)}
                      className="mt-1 w-full text-left bg-[#101018] border border-[#00F2FE]/40 hover:border-[#00F2FE] p-2.5 rounded-xl flex items-center justify-between transition-all group/btn shadow-[0_0_10px_rgba(0,242,254,0.1)]"
                    >
                      <span className="font-code text-xs text-[#00F2FE] font-medium group-hover/btn:underline truncate">
                        {msg.snippetAction}
                      </span>
                      <span className="material-symbols-outlined text-sm text-[#00F2FE]">
                        arrow_forward
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="self-start flex gap-2.5 items-center text-[#00F2FE] font-code text-xs animate-pulse p-2">
            <span className="material-symbols-outlined animate-spin text-sm">sync</span>
            <span>IRON BAT SCANNING CODE MATRIX...</span>
          </div>
        )}
      </div>

      {/* Suggestion Chips */}
      <div className="px-4 py-1.5 flex gap-2 overflow-x-auto bg-[#08080C] border-t border-[#1A1A22] no-scrollbar">
        {(isRepoMode
          ? ['What is this repo about?', 'What security features?', 'How is the code structured?', 'Find all API endpoints', 'Check for vulnerabilities']
          : ['Explain authenticateUser', 'Review Error Handling', 'Trace Sequence', 'Check Security Vulnerabilities']
        ).map((chip, idx) => (
          <button
            key={idx}
            onClick={() => onSuggestionClick && onSuggestionClick(chip)}
            className="flex-shrink-0 font-code text-[11px] text-[#00F2FE] bg-[#101018] border border-[#00F2FE]/40 hover:border-[#00F2FE] hover:bg-[#00F2FE]/10 px-3 py-1 rounded-full transition-all shadow-xs"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 md:p-4 bg-[#08080C] border-t border-[#1A1A22] relative z-20">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isRepoMode ? `Ask about ${repoName || 'the repo'}...` : "Ask Iron Bat about the code..."}
            className="flex-1 bg-[#1A1A22] border border-[#3A3A44] rounded-full py-2.5 px-4 font-code text-xs md:text-sm text-[#E0E0E0] placeholder-[#6A7280] focus:outline-none focus:border-[#00F2FE] focus:shadow-[0_0_12px_rgba(0,242,254,0.3)] transition-all"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-[#00F2FE] text-[#050508] font-bold rounded-full hover:brightness-110 shadow-[0_0_15px_rgba(0,242,254,0.5)] disabled:opacity-40 disabled:shadow-none transition-all"
          >
            <span className="material-symbols-outlined text-base font-bold">send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
