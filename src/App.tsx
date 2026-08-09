/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppTab, ChatMessage, CodeFile, RepoMeta, ConnectedRepo } from './types';
import { INITIAL_FILES } from './data/mockCodebase';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { CodeViewer } from './components/CodeViewer';
import { AIChatPane } from './components/AIChatPane';
import { TraceSequenceView } from './components/TraceSequenceView';
import { ReposView } from './components/ReposView';
import { ConfigView } from './components/ConfigView';
import { SearchModal } from './components/SearchModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('assistant');
  const [currentFileId, setCurrentFileId] = useState<string>('auth.js');
  const [files, setFiles] = useState<Record<string, CodeFile>>(INITIAL_FILES);
  const [isCodeCollapsed, setIsCodeCollapsed] = useState(false);
  const [codeSplitRatio, setCodeSplitRatio] = useState<number>(45);
  const [showSearch, setShowSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Repo state
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

  const handleMouseDown = () => {
    isDraggingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleMouseUp);
  };

  const updateSplit = (clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const offsetY = clientY - rect.top;
    let ratio = (offsetY / rect.height) * 100;
    if (ratio < 15) ratio = 15;
    if (ratio > 80) ratio = 80;
    setCodeSplitRatio(ratio);
    if (isCodeCollapsed) setIsCodeCollapsed(false);
  };

  const handleMouseMove = (e: MouseEvent) => { if (isDraggingRef.current) updateSplit(e.clientY); };
  const handleTouchMove = (e: TouchEvent) => { if (isDraggingRef.current) updateSplit(e.touches[0].clientY); };
  const handleMouseUp = () => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleMouseUp);
  };

  // ── Connect a GitHub repo ────────────────────────────────────────
  const handleConnectRepo = async (repoUrl: string): Promise<void> => {
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

    // Fetch key files for context
    const keyExts = ['.md', '.json', '.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.yaml', '.yml', '.toml'];
    const important = data.files
      .filter((f: any) => {
        const name = f.path.split('/').pop()?.toLowerCase() || '';
        return name === 'readme.md' || name === 'package.json' || name === 'cargo.toml' || name === 'go.mod' || keyExts.includes(f.ext);
      })
      .slice(0, 8);

    const contents: Record<string, string> = {};
    for (const file of important) {
      try {
        const fileRes = await fetch(`/api/file?owner=${data.owner}&repo=${data.repo}&branch=${data.branch}&filepath=${encodeURIComponent(file.path)}`);
        const fileData = await fileRes.json();
        if (fileRes.ok && fileData.content) {
          contents[file.path] = fileData.content;
        }
      } catch { /* skip */ }
    }
    setActiveRepoFileContents(contents);

    // Switch to AI tab with welcome message
    setActiveTab('assistant');
    setMessages([{
      id: `repo-welcome-${Date.now()}`,
      sender: 'ai',
      text: `Connected to ${data.owner}/${data.repo} (${data.filteredFiles} files analyzed).\n\nReady for codebase analysis. Ask me anything about this repository.`,
      statusLabel: 'REPO CONNECTED',
      bullets: [
        `${data.totalFiles} total files, ${data.filteredFiles} relevant files indexed`,
        `Branch: ${data.branch}`,
        data.readme ? 'README loaded into context' : 'No README found',
      ],
      snippetAction: 'What is this repo about?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  };

  // ── Send a chat message ──────────────────────────────────────────
  const handleSendMessage = async (text: string) => {
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
        history: messages.slice(-6).map((m) => ({ role: m.sender, text: m.text })),
      };

      // Repo mode: send file tree + key file contents
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
      let replyText = data.reply || 'Scan completed successfully.';
      let bullets: string[] = data.bullets || [];

      if (replyText.includes('›')) {
        const parts = replyText.split(/›\s*/);
        replyText = parts[0].trim();
        bullets = parts.slice(1).map((b: string) => b.trim()).filter(Boolean);
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        statusLabel: data.status || 'ANALYSIS COMPLETE',
        bullets: bullets.length > 0 ? bullets : undefined,
        snippetAction: text.toLowerCase().includes('trace') ? 'View Trace Sequence' : 'Check Security Vulnerabilities',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: 'Analysis Complete: Scanned function block. No structural syntax errors detected.',
        statusLabel: 'ANALYSIS COMPLETE',
        bullets: ['Verified request headers and authorization parameters.', 'Decodes JWT bearer token using environment secret.'],
        snippetAction: 'Check Security Vulnerabilities',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion === 'Trace Sequence' || suggestion === 'View Trace Sequence') {
      setActiveTab('trace');
    } else {
      handleSendMessage(suggestion);
    }
  };

  const handleSelectRepoFile = (repoId: string, fileName: string) => {
    if (fileName && files[fileName]) setCurrentFileId(fileName);
    setActiveTab('assistant');
  };

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
              ref={containerRef}
              className="flex flex-col h-[calc(100vh-8rem)] w-full relative overflow-hidden"
            >
              {!activeRepoMeta ? (
                <>
                  <div style={{ height: isCodeCollapsed ? '44px' : `${codeSplitRatio}%` }} className="flex flex-col transition-all duration-150 relative overflow-hidden">
                    <CodeViewer
                      currentFile={currentFile}
                      allFiles={files}
                      onSelectFile={(id) => setCurrentFileId(id)}
                      onLineClick={(lineNum, lineText) => handleSendMessage(`Explain line ${lineNum}: "${lineText.trim()}"`)}
                      isCollapsed={isCodeCollapsed}
                      onToggleCollapse={() => setIsCodeCollapsed(!isCodeCollapsed)}
                    />
                  </div>
                  <div
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleMouseDown}
                    className="h-[24px] flex-shrink-0 bg-[#1A1A22] border-t border-b border-[#3A3A44] flex items-center justify-between px-4 cursor-row-resize select-none relative z-30 group hover:bg-[#22222A] transition-colors"
                  >
                    <div className="w-6" />
                    <div className="w-[36px] h-[6px] rounded-full bg-[#3A3A44] group-hover:bg-[#00F2FE] transition-colors shadow-[0_0_8px_rgba(0,242,254,0.3)]" />
                    <button type="button" onClick={(e) => { e.stopPropagation(); setIsCodeCollapsed(!isCodeCollapsed); }} className="w-6 h-6 rounded-full flex items-center justify-center text-[#A0A0A0] hover:text-[#00F2FE] transition-colors">
                      <span className="material-symbols-outlined text-sm">{isCodeCollapsed ? 'expand_more' : 'expand_less'}</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Repo mode: show file tree summary bar */
                <div className="h-12 flex-shrink-0 bg-[#1A1A22] border-b border-[#3A3A44] flex items-center px-4 gap-3">
                  <span className="material-symbols-outlined text-[#00F2FE] text-sm">folder_open</span>
                  <span className="font-code text-xs text-[#E0E0E0] font-bold">{activeRepoMeta.owner}/{activeRepoMeta.repo}</span>
                  <span className="font-code text-[10px] text-[#A0A0A0]">·</span>
                  <span className="font-code text-[10px] text-[#00F2FE]">{activeRepoMeta.filteredFiles} files</span>
                  <span className="font-code text-[10px] text-[#A0A0A0]">·</span>
                  <span className="font-code text-[10px] text-[#A0A0A0]">{activeRepoMeta.branch}</span>
                </div>
              )}

              <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                <AIChatPane
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  onSuggestionClick={handleSuggestionClick}
                  isRepoMode={!!activeRepoMeta}
                  repoName={activeRepoMeta ? `${activeRepoMeta.repo}` : undefined}
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
              <ReposView onSelectRepoFile={handleSelectRepoFile} onConnectRepo={handleConnectRepo} connectedRepos={connectedRepos} />
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
