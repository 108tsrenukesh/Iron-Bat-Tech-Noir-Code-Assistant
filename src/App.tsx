/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppTab, ChatMessage, RepoMeta, ConnectedRepo } from './types';
import { INITIAL_FILES } from './data/mockCodebase';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { AIChatPane } from './components/AIChatPane';
import { TraceSequenceView } from './components/TraceSequenceView';
import { ReposView } from './components/ReposView';
import { ConfigView } from './components/ConfigView';
import { SearchModal } from './components/SearchModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('repos');
  const [currentFileId, setCurrentFileId] = useState<string>('auth.js');
  const [files] = useState(INITIAL_FILES);
  const [showSearch, setShowSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnectingRepo, setIsConnectingRepo] = useState(false);

  const [connectedRepos, setConnectedRepos] = useState<ConnectedRepo[]>([]);
  const [activeRepoMeta, setActiveRepoMeta] = useState<RepoMeta | null>(null);
  const [activeRepoFileContents, setActiveRepoFileContents] = useState<Record<string, string>>({});

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'user',
      text: 'Explain authenticateUser',
      timestamp: '10:42 AM',
    },
    {
      id: 'msg-2',
      sender: 'ai',
      text: 'Scanning authorization logic... This function validates the JWT from the request header.',
      statusLabel: 'ANALYSIS COMPLETE',
      bullets: [
        'Checks for the presence of an authorization header.',
        "Verifies the header begins with 'Bearer '.",
        'Extracts and returns a 401 if validation fails.',
      ],
      snippetAction: 'Review Error Handling',
      timestamp: '10:42 AM',
    },
  ]);

  const currentFile = files[currentFileId] || files['auth.js'];

  // ── Connect repo ──────────────────────────────────────────────
  const handleConnectRepo = async (repoUrl: string): Promise<void> => {
    setIsConnectingRepo(true);
    try {
      const res = await fetch(`/api/repo?url=${encodeURIComponent(repoUrl)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to connect');

      const repoMeta: RepoMeta = {
        owner: data.owner,
        repo: data.repo,
        branch: data.branch,
        totalFiles: data.totalFiles,
        filteredFiles: data.filteredFiles,
        files: data.files,
        readme: data.readme || '',
      };

      const conn: ConnectedRepo = {
        id: `repo-${Date.now()}`,
        owner: data.owner,
        repo: data.repo,
        branch: data.branch,
        filteredFiles: data.filteredFiles,
        totalFiles: data.totalFiles,
        connectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setConnectedRepos((prev) => [conn, ...prev]);
      setActiveRepoMeta(repoMeta);

      // Fetch key files
      const important = data.files
        .filter((f: any) => {
          const name = f.path.split('/').pop()?.toLowerCase() || '';
          return name === 'readme.md' || name === 'package.json' || name === 'cargo.toml' || name === 'go.mod' ||
            ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.yaml', '.yml', '.toml', '.md', '.json'].includes(f.ext);
        })
        .slice(0, 8);

      const contents: Record<string, string> = {};
      for (const file of important) {
        try {
          const fileRes = await fetch(`/api/file?owner=${data.owner}&repo=${data.repo}&branch=${data.branch}&filepath=${encodeURIComponent(file.path)}`);
          const fileData = await fileRes.json();
          if (fileRes.ok && fileData.content) contents[file.path] = fileData.content;
        } catch { /* skip */ }
      }
      setActiveRepoFileContents(contents);

      setActiveTab('assistant');
      setMessages([{
        id: `repo-welcome-${Date.now()}`,
        sender: 'ai',
        text: `Connected to ${data.owner}/${data.repo} (${data.filteredFiles} files indexed).\n\nReady for codebase analysis. Ask me anything.`,
        statusLabel: 'REPO CONNECTED',
        bullets: [
          `${data.totalFiles} total files, ${data.filteredFiles} relevant`,
          `Branch: ${data.branch}`,
          data.readme ? 'README loaded' : 'No README found',
        ],
        snippetAction: 'What is this repo about?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsConnectingRepo(false);
    }
  };

  // ── Disconnect repo ───────────────────────────────────────────
  const handleDisconnectRepo = useCallback((repoId: string) => {
    setConnectedRepos((prev) => prev.filter((r) => r.id !== repoId));
    if (activeRepoMeta) {
      setActiveRepoMeta(null);
      setActiveRepoFileContents({});
    }
  }, [activeRepoMeta]);

  // ── Send chat message (race-safe via functional update) ───────
  const handleSendMessage = useCallback(async (text: string) => {
    if (isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const body: any = {
        message: text,
        history: [], // will be set from current messages
      };

      // Get latest messages for history (functional update avoids stale closure)
      setMessages((prev) => {
        body.history = prev.slice(-6).map((m) => ({ role: m.sender, text: m.text }));
        return prev; // no state change, just reading
      });

      if (activeRepoMeta) {
        body.repoMeta = activeRepoMeta;
        body.repoFiles = activeRepoMeta.files;
        body.fileContents = activeRepoFileContents;
      } else {
        body.fileContext = {
          name: currentFile.name,
          content: currentFile.content.map((c) => `${c.lineNumber}: ${c.code}`).join('\n'),
        };
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      let replyText = data.reply || 'Analysis complete. Try asking a specific code question.';
      let bullets: string[] = data.bullets || [];
      let statusLabel = data.status || 'ANALYSIS COMPLETE';

      if (replyText.includes('›')) {
        const parts = replyText.split(/›\s*/);
        replyText = parts[0].trim();
        bullets = parts.slice(1).map((b: string) => b.trim()).filter(Boolean);
      }

      if (replyText.startsWith('DIAGNOSTIC DENIED')) {
        statusLabel = 'DIAGNOSTIC DENIED';
      }

      setMessages((prev) => [...prev, {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        statusLabel,
        bullets: bullets.length > 0 ? bullets : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: 'Connection error. Check your network and try again.',
        statusLabel: 'ERROR',
        bullets: ['Server may be restarting.', 'Try again in a few seconds.'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, activeRepoMeta, activeRepoFileContents, currentFile]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    if (isLoading) return;
    if (suggestion === 'Trace Sequence' || suggestion === 'View Trace Sequence') {
      setActiveTab('trace');
    } else {
      handleSendMessage(suggestion);
    }
  }, [isLoading, handleSendMessage]);

  const handleSelectRepoFile = useCallback((repoId: string, fileName: string) => {
    if (fileName && files[fileName]) setCurrentFileId(fileName);
    setActiveTab('assistant');
  }, [files]);

  // ── Keyboard shortcut for search ──────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#050508] text-[#E0E0E0] font-sans flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]" />
        <div className="absolute top-[20%] right-[15%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px]" />
      </div>

      <Header
        activeTab={activeTab}
        currentFilePath={activeRepoMeta ? `${activeRepoMeta.owner}/${activeRepoMeta.repo}` : currentFile.path}
        onSearchClick={() => setShowSearch(true)}
        onBackClick={activeTab === 'trace' ? () => setActiveTab('assistant') : undefined}
      />

      <main className="flex-1 flex flex-col relative w-full h-screen pt-16 pb-16 overflow-hidden z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'assistant' && (
            <motion.div
              key="assistant"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex flex-col h-[calc(100vh-8rem)] w-full relative overflow-hidden"
            >
              {!activeRepoMeta ? (
                /* Empty state: no repo connected */
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-[#00F2FE]/10 border-2 border-[#00F2FE]/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#00F2FE] text-3xl">link</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h2 className="font-code text-lg font-bold text-[#E0E0E0] uppercase tracking-wider">No Repository Connected</h2>
                    <p className="font-body text-sm text-[#A0A0A0] max-w-sm">
                      Connect a GitHub repository to start analyzing code, asking questions, and tracing call chains.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('repos')}
                    className="py-3 px-6 rounded-2xl bg-[#FFD700]/10 border-2 border-[#FFD700] text-[#FFD700] font-code text-xs font-bold uppercase tracking-widest hover:bg-[#FFD700]/20 transition-all shadow-[0_0_15px_rgba(255,215,0,0.2)]"
                  >
                    <span className="material-symbols-outlined text-sm align-middle mr-2">add_link</span>
                    Connect a Repository
                  </button>
                  <div className="flex flex-col gap-1.5 text-[#6A7280] font-body text-xs">
                    <span>Or try the demo mode with the mock codebase below</span>
                  </div>
                </div>
              ) : (
                <div className="h-12 flex-shrink-0 bg-[#1A1A22] border-b border-[#3A3A44] flex items-center px-4 gap-3">
                  <span className="material-symbols-outlined text-[#00F2FE] text-sm">folder_open</span>
                  <span className="font-code text-xs text-[#E0E0E0] font-bold">{activeRepoMeta.owner}/{activeRepoMeta.repo}</span>
                  <span className="font-code text-[10px] text-[#A0A0A0]">·</span>
                  <span className="font-code text-[10px] text-[#00F2FE]">{activeRepoMeta.filteredFiles} files</span>
                  <span className="font-code text-[10px] text-[#A0A0A0]">·</span>
                  <span className="font-code text-[10px] text-[#A0A0A0]">{activeRepoMeta.branch}</span>
                  <button
                    onClick={() => { setActiveRepoMeta(null); setActiveRepoFileContents({}); }}
                    className="ml-auto text-[#A0A0A0] hover:text-red-400 transition-colors"
                    title="Disconnect repo"
                  >
                    <span className="material-symbols-outlined text-sm">link_off</span>
                  </button>
                </div>
              )}

              <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                <AIChatPane
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  onSuggestionClick={handleSuggestionClick}
                  isRepoMode={!!activeRepoMeta}
                  repoName={activeRepoMeta?.repo}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'trace' && (
            <motion.div key="trace" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 overflow-hidden">
              <TraceSequenceView onOpenFile={(fileName) => { if (files[fileName]) setCurrentFileId(fileName); setActiveTab('assistant'); }} />
            </motion.div>
          )}

          {activeTab === 'repos' && (
            <motion.div key="repos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-1 overflow-hidden">
              <ReposView
                onSelectRepoFile={handleSelectRepoFile}
                onConnectRepo={handleConnectRepo}
                onDisconnectRepo={handleDisconnectRepo}
                connectedRepos={connectedRepos}
                isConnecting={isConnectingRepo}
              />
            </motion.div>
          )}

          {activeTab === 'config' && (
            <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-hidden">
              <ConfigView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {showSearch && (
        <SearchModal files={files} onSelectFile={(fileId) => { setCurrentFileId(fileId); setActiveTab('assistant'); }} onClose={() => setShowSearch(false)} />
      )}

      <Navigation activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />
    </div>
  );
}
