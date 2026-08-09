import React, { useState } from 'react';

interface CallChainCard {
  id: string;
  filePath: string;
  lineRange: string;
  activeLine: number;
  previewLines: { lineNum: number; code: string }[];
  description: string;
}

interface TraceSequenceViewProps {
  onOpenFile?: (fileName: string) => void;
}

export const TraceSequenceView: React.FC<TraceSequenceViewProps> = ({ onOpenFile }) => {
  const [activeStepIndex, setActiveStepIndex] = useState(2); // Default to ApiClient.js

  const callChainCards: CallChainCard[] = [
    {
      id: 'step-1',
      filePath: 'src/App.js',
      lineRange: 'L100-104',
      activeLine: 102,
      previewLines: [
        { lineNum: 101, code: 'const handleSubmit = async (formData) => {' },
        { lineNum: 102, code: '  const user = await AuthService.login(formData);' },
        { lineNum: 103, code: "  dispatch({ type: 'SET_USER', payload: user });" },
      ],
      description: 'The flow initiates when submitForm is triggered in App.js upon user interaction. It collects form parameters and delegates credentials validation to the AuthService.',
    },
    {
      id: 'step-2',
      filePath: 'src/services/AuthService.js',
      lineRange: 'L44-46',
      activeLine: 45,
      previewLines: [
        { lineNum: 44, code: 'async login(credentials) {' },
        { lineNum: 45, code: "  const res = await ApiClient.post('/auth/login', credentials);" },
        { lineNum: 46, code: '  return res.data;' },
      ],
      description: 'AuthService encapsulates security handshake logic. It reformats payload tokens and invokes the underlying base ApiClient.',
    },
    {
      id: 'step-3',
      filePath: 'src/api/ApiClient.js',
      lineRange: 'L209-211',
      activeLine: 210,
      previewLines: [
        { lineNum: 209, code: 'async post(url, payload) {' },
        { lineNum: 210, code: "  return await fetch(this.baseUrl + url, { method: 'POST', body: JSON.stringify(payload) });" },
        { lineNum: 211, code: '}' },
      ],
      description: 'ApiClient executes the low-level HTTP POST request over the secure TLS socket, transmitting authorization headers to the backend.',
    },
  ];

  const currentStep = callChainCards[activeStepIndex];

  const handleStepBack = () => {
    if (activeStepIndex > 0) setActiveStepIndex(activeStepIndex - 1);
  };

  const handleNextFrame = () => {
    if (activeStepIndex < callChainCards.length - 1) setActiveStepIndex(activeStepIndex + 1);
  };

  const aiAvatarUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuCWMr6UDCI8X4xEM1zXUlvo-t1nSmQcrXOzrH8QQHfd5PEgaZA09eW4CLuKdgyB1EMp1SYFeytdw3VqUNvrncCFpx5r5N9nmoH4zL8DjVGLArJ4uD5GeseNIpPEFNTbgQoQpNFGtFwHo7tI0sF8W2CMf3cjVCn7I5UJ2FkOgeV6_COr7cPsOlQ-oyg6FW2hqLNDiYOH3P_fZRaNRHwHDufHE2RCXUuXSkT0-HRhmvjEw88P_f1utFlNsw";

  const renderSyntax = (codeText: string) => {
    const tokens = codeText.split(/(\b(?:const|async|return|await)\b|'[^']*'|"[^"]*")/g);
    return tokens.map((token, idx) => {
      if (['const', 'async', 'return', 'await'].includes(token)) {
        return <span key={idx} className="text-[#FF6FB5] font-semibold">{token}</span>;
      }
      if (token.startsWith("'") || token.startsWith('"')) {
        return <span key={idx} className="text-[#7CE38B]">{token}</span>;
      }
      if (['login', 'post', 'fetch', 'dispatch', 'handleSubmit', 'JSON', 'stringify'].some(k => token.includes(k))) {
        return <span key={idx} className="text-[#00F2FE]">{token}</span>;
      }
      return <span key={idx} className="text-[#E0E0E0]">{token}</span>;
    });
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#050508] pt-16 pb-20 relative overflow-hidden">
      {/* Background Immersive Glowing Blur Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Stack View: 3 Collapsed File Cards */}
      <div className="p-4 md:p-6 bg-white/5 border-b border-white/10 backdrop-blur-md relative z-10 overflow-y-auto max-h-[50vh]">
        <div className="max-w-xl mx-auto flex flex-col gap-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-code text-sm font-bold text-[#E0E0E0] uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00F2FE] text-base">route</span>
              Call Chain Sequence
            </h2>
            <span className="font-code text-[10px] text-[#00F2FE] bg-[#00F2FE]/10 px-2 py-0.5 rounded border border-[#00F2FE]/30">
              3 FRAMES ACTIVE
            </span>
          </div>

          {callChainCards.map((card, idx) => {
            const isActive = idx === activeStepIndex;
            return (
              <React.Fragment key={card.id}>
                {/* 32px Header Bar in #22222A */}
                <div
                  onClick={() => setActiveStepIndex(idx)}
                  className={`w-full rounded-lg overflow-hidden border transition-all cursor-pointer ${
                    isActive
                      ? 'border-[#00F2FE] shadow-[0_0_15px_rgba(0,242,254,0.25)] bg-[#0C0C12]'
                      : 'border-[#3A3A44] hover:border-[#00F2FE]/50 bg-[#08080C]'
                  }`}
                >
                  {/* Card Header (32px high, #22222A) */}
                  <div className={`h-[32px] px-3 bg-[#22222A] flex items-center justify-between font-code text-xs ${
                    isActive ? 'border-l-2 border-l-[#00F2FE]' : ''
                  }`}>
                    <div className="flex items-center gap-2 truncate">
                      <span className="material-symbols-outlined text-sm text-[#00F2FE]">
                        {isActive ? 'play_arrow' : 'description'}
                      </span>
                      <span className={`font-bold truncate ${isActive ? 'text-[#00F2FE]' : 'text-[#E0E0E0]'}`}>
                        {card.filePath}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#A0A0A0] font-mono flex-shrink-0">
                      {card.lineRange}
                    </span>
                  </div>

                  {/* 3-line syntax highlighted code preview */}
                  <div className="p-2.5 font-code text-[12px] leading-[1.6] bg-[#08080C] overflow-x-hidden">
                    {card.previewLines.map((line) => {
                      const isHighlightLine = line.lineNum === card.activeLine;
                      return (
                        <div
                          key={line.lineNum}
                          className={`flex items-center gap-3 px-2 py-0.5 rounded ${
                            isHighlightLine ? 'bg-[#00F2FE]/15 border-l-2 border-[#00F2FE]' : ''
                          }`}
                        >
                          <span className="w-8 text-right text-[#6A7280] text-[11px] select-none font-mono">
                            {line.lineNum}
                          </span>
                          <span className="truncate text-[#E0E0E0]">
                            {renderSyntax(line.code)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 20px connector containing downward chevron on 1px cyan vertical line at 40% opacity */}
                {idx < callChainCards.length - 1 && (
                  <div className="h-[20px] flex items-center justify-center relative my-0.5">
                    <div className="absolute inset-y-0 w-[1px] bg-[#00F2FE] opacity-40 left-1/2 -translate-x-1/2" />
                    <div className="relative z-10 w-5 h-5 rounded-full bg-[#1A1A22] border border-[#00F2FE]/40 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xs text-[#00F2FE]">
                        expand_more
                      </span>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Bottom Stack: Iron Bat AI Diagnostics */}
      <div className="flex-1 bg-[#050508] flex flex-col p-4 md:p-6 relative z-10 overflow-y-auto">
        <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-between gap-4">
          <div className="flex gap-4 items-start">
            {/* Holographic Diagnostics Avatar */}
            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-[#00F2FE] shadow-[0_0_15px_rgba(0,242,254,0.4)] flex-shrink-0 bg-[#1A1A22]">
              <img
                src={aiAvatarUrl}
                alt="Iron Bat AI"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Diagnostics Speech Container */}
            <div className="relative bg-white/5 border border-[#00F2FE]/50 p-4 rounded-2xl flex-1 backdrop-blur-md shadow-[0_0_15px_rgba(0,242,254,0.1)]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-code text-xs font-bold text-[#00F2FE] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">memory</span>
                  Iron Bat Diagnostics
                </span>
                <span className="text-[10px] text-[#A0A0A0] font-code">
                  FRAME {activeStepIndex + 1}/3
                </span>
              </div>
              <p className="font-body text-xs md:text-sm text-[#E0E0E0] leading-relaxed">
                {currentStep.description}
              </p>
            </div>
          </div>

          {/* Navigation Controls: Step Back / Next Frame */}
          <div className="grid grid-cols-2 gap-3 mt-auto pt-2">
            <button
              onClick={handleStepBack}
              disabled={activeStepIndex === 0}
              className="bg-[#1A1A22] border border-[#3A3A44] py-3 px-4 font-code text-xs font-bold text-[#E0E0E0] uppercase hover:bg-[#2A2A34] hover:border-[#00F2FE]/40 disabled:opacity-40 transition-all rounded-xl"
            >
              Step Back
            </button>
            <button
              onClick={handleNextFrame}
              disabled={activeStepIndex === callChainCards.length - 1}
              className="bg-gradient-to-r from-indigo-500 to-[#00F2FE] py-3 px-4 font-code text-xs font-bold text-[#050508] uppercase shadow-[0_0_15px_rgba(0,242,254,0.4)] hover:brightness-110 disabled:opacity-40 transition-all rounded-xl"
            >
              Next Frame
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
