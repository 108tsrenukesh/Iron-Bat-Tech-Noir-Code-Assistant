import React, { useState } from 'react';
import { ConnectedRepo } from '../types';

interface ReposViewProps {
  onSelectRepoFile: (repoId: string, fileName: string) => void;
  onConnectRepo: (repoUrl: string) => Promise<any>;
  connectedRepos: ConnectedRepo[];
}

export const ReposView: React.FC<ReposViewProps> = ({ onSelectRepoFile, onConnectRepo, connectedRepos }) => {
  const [repoInput, setRepoInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [showConnectModal, setShowConnectModal] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim() || isConnecting) return;
    setConnectError('');
    setIsConnecting(true);
    try {
      await onConnectRepo(repoInput.trim());
      setRepoInput('');
      setShowConnectModal(false);
    } catch (err: any) {
      setConnectError(err.message || 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#050508] pt-16 pb-24 px-4 md:px-8 max-w-2xl mx-auto relative overflow-y-auto">
      <div className="absolute top-10 left-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-5 pt-4">
        {/* Header */}
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
            Connect any public GitHub repository. Iron Bat fetches the file tree, asks Gemini which files are relevant, and answers your questions about the entire codebase.
          </p>
        </div>

        {/* Connected Repos */}
        {connectedRepos.length > 0 && (
          <div className="flex flex-col gap-3">
            <span className="font-code text-xs font-bold text-[#A0A0A0] uppercase tracking-widest px-1">
              Connected Repositories ({connectedRepos.length})
            </span>
            {connectedRepos.map((repo) => (
              <div
                key={repo.id}
                onClick={() => onSelectRepoFile(repo.id, '')}
                className="group relative flex flex-col p-4 md:p-5 gap-2 rounded-2xl bg-white/5 border border-white/10 hover:border-[#00F2FE] transition-all cursor-pointer backdrop-blur-md hover:shadow-[0_0_20px_rgba(0,242,254,0.15)]"
              >
                <div className="flex justify-between items-start w-full">
                  <div className="flex flex-col">
                    <span className="font-code text-sm md:text-base text-[#E0E0E0] font-bold group-hover:text-[#00F2FE] transition-colors">
                      {repo.repo}
                    </span>
                    <span className="font-code text-xs text-[#A0A0A0] mt-0.5">
                      {repo.owner}/{repo.repo} @ {repo.branch}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[#00F2FE] text-xl group-hover:scale-110 transition-transform">
                    link
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="font-code text-[10px] px-2.5 py-0.5 rounded-full border border-[#00F2FE]/30 text-[#00F2FE] bg-[#00F2FE]/10 font-bold">
                    {repo.filteredFiles} files
                  </span>
                  <span className="font-code text-[10px] text-[#A0A0A0] flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">history</span>
                    {repo.connectedAt}
                  </span>
                  <span className="font-code text-[10px] text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 px-2 py-0.5 rounded-full ml-auto">
                    READY
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Connect Button */}
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

        {/* Quick Start Tips */}
        <div className="flex flex-col gap-2 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
          <span className="font-code text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">
            Quick Start
          </span>
          {[
            { icon: "link", text: "Paste a public GitHub repo URL above" },
            { icon: "chat", text: "Ask: \"What is this repo about?\"" },
            { icon: "security", text: "Ask: \"What security features does this have?\"" },
            { icon: "architecture", text: "Ask: \"How is the code structured?\"" },
          ].map((tip, idx) => (
            <div key={idx} className="flex items-center gap-2 text-[#CCCCCC]">
              <span className="material-symbols-outlined text-[#00F2FE] text-sm">{tip.icon}</span>
              <span className="font-body text-xs">{tip.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#101018] border-2 border-[#FFD700] rounded-2xl p-6 w-full max-w-md shadow-[0_0_30px_rgba(255,215,0,0.3)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-code text-base font-bold text-[#FFD700] uppercase tracking-wider">
                Connect GitHub Repository
              </h3>
              <button onClick={() => setShowConnectModal(false)} className="text-[#A0A0A0] hover:text-[#FFFFFF]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="font-body text-xs text-[#CCCCCC] mb-4">
              Enter a public GitHub repo URL or owner/repo format. Iron Bat will fetch the file tree and begin analysis.
            </p>

            <form onSubmit={handleConnect} className="flex flex-col gap-4">
              <input
                type="text"
                value={repoInput}
                onChange={(e) => { setRepoInput(e.target.value); setConnectError(''); }}
                placeholder="e.g. facebook/react or github.com/owner/repo"
                className="bg-[#1A1A22] border border-[#3A3A44] rounded-xl p-3 font-code text-xs text-[#E0E0E0] focus:outline-none focus:border-[#FFD700]"
                autoFocus
              />
              {connectError && (
                <p className="font-code text-xs text-red-400">{connectError}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowConnectModal(false)} className="px-4 py-2 font-code text-xs text-[#A0A0A0] hover:text-[#FFFFFF]">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConnecting || !repoInput.trim()}
                  className="px-5 py-2 font-code text-xs font-bold text-[#050508] bg-[#FFD700] rounded-xl hover:brightness-110 shadow-[0_0_12px_rgba(255,215,0,0.5)] transition-all disabled:opacity-40"
                >
                  {isConnecting ? 'Connecting...' : 'Link Repository'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
