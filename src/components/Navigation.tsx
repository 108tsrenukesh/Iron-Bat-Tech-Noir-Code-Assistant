import React from 'react';
import { AppTab } from '../types';

interface NavigationProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe bg-[#050508]/90 backdrop-blur-xl border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        {/* REPOS Tab */}
        <button
          onClick={() => onTabChange('repos')}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-2xl transition-all duration-200 ${
            activeTab === 'repos'
              ? 'text-[#00F2FE] shadow-[0_0_15px_rgba(0,242,254,0.3)] bg-[#00F2FE]/10 border border-[#00F2FE]/30'
              : 'text-[#A0A0A0] hover:text-[#E0E0E0] hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-xl">folder</span>
          <span className="font-code text-[10px] font-bold tracking-wider mt-0.5">REPOS</span>
        </button>

        {/* AI Tab (Assistant) */}
        <button
          onClick={() => onTabChange('assistant')}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-2xl transition-all duration-200 ${
            activeTab === 'assistant' || activeTab === 'trace'
              ? 'text-[#00F2FE] shadow-[0_0_15px_rgba(0,242,254,0.3)] bg-[#00F2FE]/10 border border-[#00F2FE]/30'
              : 'text-[#A0A0A0] hover:text-[#E0E0E0] hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-xl">smart_toy</span>
          <span className="font-code text-[10px] font-bold tracking-wider mt-0.5">AI</span>
        </button>

        {/* CONFIG Tab */}
        <button
          onClick={() => onTabChange('config')}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-2xl transition-all duration-200 ${
            activeTab === 'config'
              ? 'text-[#00F2FE] shadow-[0_0_15px_rgba(0,242,254,0.3)] bg-[#00F2FE]/10 border border-[#00F2FE]/30'
              : 'text-[#A0A0A0] hover:text-[#E0E0E0] hover:bg-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-xl">settings</span>
          <span className="font-code text-[10px] font-bold tracking-wider mt-0.5">CONFIG</span>
        </button>
      </div>
    </nav>
  );
};
