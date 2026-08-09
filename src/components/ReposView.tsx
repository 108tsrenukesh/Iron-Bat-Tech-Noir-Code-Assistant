import React, { useState } from 'react';
import { Repository } from '../types';
import { INITIAL_REPOS } from '../data/mockCodebase';

interface ReposViewProps {
  onSelectRepoFile: (repoId: string, fileName: string) => void;
}

export const ReposView: React.FC<ReposViewProps> = ({ onSelectRepoFile }) => {
  const [repos, setRepos] = useState<Repository[]>(INITIAL_REPOS);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [repoInput, setRepoInput] = useState('');

  const handleAddRepo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim()) return;

    const newRepo: Repository = {
      id: `repo-${Date.now()}`,
      name: repoInput.trim().split('/')[1] || repoInput.trim(),
      subtitle: repoInput.trim(),
      lang: 'TS',
      langColor: 'text-[#00F2FE] bg-[#00F2FE]/10',
      updated: 'Just connected',
      status: 'active',
      filesCount: 14,
      branch: 'main',
    };

    setRepos([newRepo, ...repos]);
    setRepoInput('');
    setShowConnectModal(false);
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#050508] pt-16 pb-24 px-4 md:px-8 max-w-2xl mx-auto relative overflow-y-auto">
      {/* Background Ambient Glows */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-5 pt-4">
        {/* Header / Status Banner */}
        <div className="flex flex-col gap-2 bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h1 className="font-code text-xl md:text-2xl font-extrabold text-[#E0E0E0] uppercase tracking-wide flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00F2FE]">dashboard</span>
              Codebase Command
            </h1>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_10px_#10B981]" />
              <span className="font-code text-[10px] text-[#10B981] font-bold uppercase tracking-wider">
                UPLINK ONLINE
              </span>
            </div>
          </div>
          <p className="font-body text-xs text-[#A0A0A0]">
            Batcomputer Neural Link connected to active codebase repositories. Select a repository to inspect call chains.
          </p>

          {/* Scanning Bar */}
          <div className="w-full bg-[#1A1A22] rounded-full h-1 overflow-hidden relative mt-1">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-[#00F2FE] animate-scanning w-1/3" />
          </div>
        </div>

        {/* Repositories Cards */}
        <div className="flex flex-col gap-3">
          <span className="font-code text-xs font-bold text-[#A0A0A0] uppercase tracking-widest px-1">
            Connected Repositories ({repos.length})
          </span>

          {repos.map((repo) => (
            <div
              key={repo.id}
              onClick={() => onSelectRepoFile(repo.id, 'auth.js')}
              className="group relative flex flex-col p-4 md:p-5 gap-2 rounded-2xl bg-white/5 border border-white/10 hover:border-[#00F2FE] transition-all cursor-pointer backdrop-blur-md hover:shadow-[0_0_20px_rgba(0,242,254,0.15)]"
            >
              <div className="flex justify-between items-start w-full">
                <div className="flex flex-col">
                  <span className="font-code text-sm md:text-base text-[#E0E0E0] font-bold group-hover:text-[#00F2FE] transition-colors">
                    {repo.name}
                  </span>
                  <span className="font-code text-xs text-[#A0A0A0] mt-0.5">
                    {repo.subtitle}
                  </span>
                </div>

                <span className="material-symbols-outlined text-[#00F2FE] text-xl group-hover:scale-110 transition-transform">
                  link
                </span>
              </div>

              {/* Badges & Easter Egg Label */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`font-code text-[10px] px-2.5 py-0.5 rounded-full border border-[#00F2FE]/30 text-[#00F2FE] bg-[#00F2FE]/10 font-bold`}>
                  {repo.lang}
                </span>

                <span className="font-code text-[10px] text-[#A0A0A0] flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">history</span>
                  {repo.updated}
                </span>

                {/* Easter Egg Tag */}
                <span className="font-code text-[10px] text-[#FFD700] bg-[#FFD700]/10 border border-[#FFD700]/30 px-2 py-0.5 rounded-full ml-auto">
                  {repo.name.includes('react') ? 'Quantum Entanglement Lib' : 'Inter-Dimensional Gateway'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Connect GitHub Arsenal CTA Button (Tech Gold Accent #FFD700) */}
        <button
          onClick={() => setShowConnectModal(true)}
          className="w-full mt-2 py-4 px-6 rounded-2xl bg-[#1A1A22] text-[#FFD700] border-2 border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.2)] hover:bg-[#2A2A34] hover:shadow-[0_0_25px_rgba(255,215,0,0.4)] transition-all flex items-center justify-center gap-3 group active:scale-98"
        >
          <span className="material-symbols-outlined text-lg group-hover:rotate-90 transition-transform">
            add_link
          </span>
          <span className="font-code text-xs font-bold uppercase tracking-widest">
            Connect Your GitHub Arsenal
          </span>
        </button>
      </div>

      {/* GitHub Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#101018] border-2 border-[#FFD700] rounded-2xl p-6 w-full max-w-md shadow-[0_0_30px_rgba(255,215,0,0.3)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-code text-base font-bold text-[#FFD700] uppercase tracking-wider">
                Connect GitHub Repository
              </h3>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-[#A0A0A0] hover:text-[#FFFFFF]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="font-body text-xs text-[#CCCCCC] mb-4">
              Enter GitHub repository URL or namespace (e.g., owner/repository) to link directly into Iron Bat AI diagnostic engine.
            </p>

            <form onSubmit={handleAddRepo} className="flex flex-col gap-4">
              <input
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="e.g. facebook/react"
                className="bg-[#1A1A22] border border-[#3A3A44] rounded-xl p-3 font-code text-xs text-[#E0E0E0] focus:outline-none focus:border-[#FFD700]"
                autoFocus
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 font-code text-xs text-[#A0A0A0] hover:text-[#FFFFFF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-code text-xs font-bold text-[#050508] bg-[#FFD700] rounded-xl hover:brightness-110 shadow-[0_0_12px_rgba(255,215,0,0.5)] transition-all"
                >
                  Link Repository
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
