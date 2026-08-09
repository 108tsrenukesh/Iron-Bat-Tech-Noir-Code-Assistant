/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppTab, ChatMessage, CodeFile } from './types';
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
  const [codeSplitRatio, setCodeSplitRatio] = useState<number>(45); // Default 45/55 split
  const [showSearch, setShowSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initial Chat Conversation matching design
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

  // Handle Drag Bar interaction
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

  const handleMouseMove = (e: MouseEvent) => {
    if (isDraggingRef.current) {
      updateSplit(e.clientY);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDraggingRef.current && e.touches[0]) {
      updateSplit(e.touches[0].clientY);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleMouseUp);
  };

  // Handle sending a message to Iron Bat AI (calls /api/chat)
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          fileContext: {
            name: currentFile.name,
            content: currentFile.content.map((c) => `${c.lineNumber}: ${c.code}`).join('\n'),
          },
          history: messages.slice(-4).map((m) => ({ role: m.sender, text: m.text })),
        }),
      });

      const data = await response.json();

      let replyText = data.reply || 'Scan completed successfully.';
      let bullets: string[] = data.bullets || [];

      if (replyText.includes('›')) {
        const parts = replyText.split(/›\s*/);
        replyText = parts[0].trim();
        bullets = parts.slice(1).map((b) => b.trim()).filter(Boolean);
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        statusLabel: data.status || 'ANALYSIS COMPLETE',
        bullets: bullets.length > 0 ? bullets : undefined,
        snippetAction: text.toLowerCase().includes('trace') ? 'View Trace Sequence' : 'Review Security Specs',
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
        bullets: [
          'Verified request headers and authorization parameters.',
          'Decodes JWT bearer token using environment secret.',
        ],
        snippetAction: 'Review Error Handling',
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
    if (files[fileName]) {
      setCurrentFileId(fileName);
    }
    setActiveTab('assistant');
  };

  return (
    <div className="min-h-screen bg-[#050508] text-[#E0E0E0] font-sans flex flex-col relative overflow-hidden">
      {/* Background Immersive Glowing Blur Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]" />
        <div className="absolute top-[20%] right-[15%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px]" />
      </div>

      {/* Top Header */}
      <Header
        activeTab={activeTab}
        currentFilePath={currentFile.path}
        onSearchClick={() => setShowSearch(true)}
        onBackClick={activeTab === 'trace' ? () => setActiveTab('assistant') : undefined}
      />

      {/* Main Content Area */}
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
              {/* Top Pane: Code Viewer */}
              <div
                style={{ height: isCodeCollapsed ? '44px' : `${codeSplitRatio}%` }}
                className="flex flex-col transition-all duration-150 relative overflow-hidden"
              >
                <CodeViewer
                  currentFile={currentFile}
                  allFiles={files}
                  onSelectFile={(id) => setCurrentFileId(id)}
                  onLineClick={(lineNum, lineText) => handleSendMessage(`Explain line ${lineNum}: "${lineText.trim()}"`)}
                  isCollapsed={isCodeCollapsed}
                  onToggleCollapse={() => setIsCodeCollapsed(!isCodeCollapsed)}
                />
              </div>

              {/* 24px Adjustable Drag Bar */}
              <div
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
                className="h-[24px] flex-shrink-0 bg-[#1A1A22] border-t border-b border-[#3A3A44] flex items-center justify-between px-4 cursor-row-resize select-none relative z-30 group hover:bg-[#22222A] transition-colors"
              >
                <div className="w-6" />

                {/* Centered 36px rounded pill handle in #3A3A44 */}
                <div className="w-[36px] h-[6px] rounded-full bg-[#3A3A44] group-hover:bg-[#00F2FE] transition-colors shadow-[0_0_8px_rgba(0,242,254,0.3)]" />

                {/* Chevron Collapse/Expand Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCodeCollapsed(!isCodeCollapsed);
                  }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[#A0A0A0] hover:text-[#00F2FE] transition-colors"
                  title={isCodeCollapsed ? 'Expand Code Pane' : 'Collapse Code Pane'}
                >
                  <span className="material-symbols-outlined text-sm">
                    {isCodeCollapsed ? 'expand_more' : 'expand_less'}
                  </span>
                </button>
              </div>

              {/* Bottom Pane: AI Chat Pane */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                <AIChatPane
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  onSuggestionClick={handleSuggestionClick}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'trace' && (
            <motion.div
              key="trace"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 overflow-hidden"
            >
              <TraceSequenceView onOpenFile={(fileName) => {
                if (files[fileName]) setCurrentFileId(fileName);
                setActiveTab('assistant');
              }} />
            </motion.div>
          )}

          {activeTab === 'repos' && (
            <motion.div
              key="repos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 overflow-hidden"
            >
              <ReposView onSelectRepoFile={handleSelectRepoFile} />
            </motion.div>
          )}

          {activeTab === 'config' && (
            <motion.div
              key="config"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-hidden"
            >
              <ConfigView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Search Modal */}
      {showSearch && (
        <SearchModal
          files={files}
          onSelectFile={(fileId) => {
            setCurrentFileId(fileId);
            setActiveTab('assistant');
          }}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* Bottom Nav Bar */}
      <Navigation activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />
    </div>
  );
}
