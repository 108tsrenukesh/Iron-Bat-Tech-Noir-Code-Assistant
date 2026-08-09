import React from 'react';
import { AppTab } from '../types';

interface HeaderProps {
  activeTab: AppTab;
  currentFilePath: string;
  onSearchClick: () => void;
  onBackClick?: () => void;
  titleOverride?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  currentFilePath,
  onSearchClick,
  onBackClick,
  titleOverride,
}) => {
  const logoUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuASZBhJbmbTLmE6FkIte5vKWi-yQ2iGOcfxjJvCZPH4OWVvnDJ8DKjs6gRNVFUat2PX-Uv_p9ydztQbI4H90lus9FEayOQ9hRu1xMgj9dV0YdaBtyBUr3_DZeE6_EYSKGly6VIYN_nZ6p0mrXG2EslqFzIEz67YU4qA-pmYyIVSw0L9kSYw19e3YJuqp3mu4Ng94xiYZy_EyhvfuFXqqRKOG1qFqdtkSCBcSjhoeo1rKelfvl92XfWLpQ";
  const profileUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuCWMr6UDCI8X4xEM1zXUlvo-t1nSmQcrXOzrH8QQHfd5PEgaZA09eW4CLuKdgyB1EMp1SYFeytdw3VqUNvrncCFpx5r5N9nmoH4zL8DjVGLArJ4uD5GeseNIpPEFNTbgQoQpNFGtFwHo7tI0sF8W2CMf3cjVCn7I5UJ2FkOgeV6_COr7cPsOlQ-oyg6FW2hqLNDiYOH3P_fZRaNRHwHDufHE2RCXUuXSkT0-HRhmvjEw88P_f1utFlNsw";

  const getSectionTitle = () => {
    if (titleOverride) return titleOverride;
    switch (activeTab) {
      case 'repos': return 'REPOS';
      case 'assistant': return 'ASSISTANT';
      case 'trace': return 'TRACE SEQUENCE';
      case 'config': return 'CONFIG';
      default: return 'ASSISTANT';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-xl pt-safe border-b border-white/10 shadow-lg">
      <div className="h-16 px-4 md:px-6 flex items-center justify-between gap-3">
        {/* Left: Logo & Breadcrumbs or Back */}
        <div className="flex items-center gap-3 overflow-hidden">
          {onBackClick ? (
            <button
              onClick={onBackClick}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:border-[#00F2FE] text-[#00F2FE] transition-colors"
              title="Step Back"
            >
              <span className="material-symbols-outlined text-lg">arrow_back_ios_new</span>
            </button>
          ) : (
            <div className="relative group flex-shrink-0">
              <img
                src={logoUrl}
                alt="Iron Bat Logo"
                className="h-9 w-auto object-contain filter drop-shadow-[0_0_8px_rgba(0,242,254,0.5)] transition-transform group-hover:scale-105"
              />
            </div>
          )}

          <div className="flex flex-col truncate">
            <span className="font-code text-[11px] font-bold text-[#00F2FE] uppercase tracking-widest leading-none mb-1">
              {getSectionTitle()}
            </span>
            <span className="font-code text-xs text-[#A0A0A0] truncate">
              {currentFilePath || 'repo: react-app / src / auth'}
            </span>
          </div>
        </div>

        {/* Right: Search & Profile */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onSearchClick}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#E0E0E0] hover:text-[#00F2FE] hover:border-[#00F2FE]/50 transition-all"
            title="Search codebase (Ctrl+K)"
          >
            <span className="material-symbols-outlined text-lg">search</span>
          </button>

          <div className="relative group cursor-pointer">
            <div className="absolute -inset-0.5 rounded-full bg-[#00F2FE]/40 blur-xs group-hover:bg-[#00F2FE] transition-all" />
            <img
              src={profileUrl}
              alt="Profile Avatar"
              className="relative w-8 h-8 rounded-full border border-[#00F2FE] object-cover bg-black"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
