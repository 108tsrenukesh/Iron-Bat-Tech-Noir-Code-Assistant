import React, { useState } from 'react';
import { CodeFile } from '../types';

interface CodeViewerProps {
  currentFile: CodeFile;
  allFiles: Record<string, CodeFile>;
  onSelectFile: (fileId: string) => void;
  onLineClick?: (lineNum: number, lineText: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  currentFile,
  allFiles,
  onSelectFile,
  onLineClick,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [showFileMenu, setShowFileMenu] = useState(false);

  // Reduced 4-color syntax palette renderer
  const renderSyntax = (lineText: string) => {
    // Keywords: #FF6FB5
    // Strings: #7CE38B
    // Functions & Identifiers: #00F2FE
    // Comments: #6A7280 italic
    // All other code: #E0E0E0

    if (lineText.trim().startsWith('//')) {
      return <span className="text-[#6A7280] italic">{lineText}</span>;
    }

    const tokens = lineText.split(/(\b(?:export|const|let|var|async|function|class|return|if|else|try|catch|await|import|from|static|typeof|new)\b|'[^']*'|"[^"]*"|`[^`]*`|\/\/.+$)/g);

    return tokens.map((token, idx) => {
      if (!token) return null;

      // Keywords
      if (['export', 'const', 'let', 'var', 'async', 'function', 'class', 'return', 'if', 'else', 'try', 'catch', 'await', 'import', 'from', 'static', 'typeof', 'new'].includes(token)) {
        return <span key={idx} className="text-[#FF6FB5] font-semibold">{token}</span>;
      }

      // Strings
      if (token.startsWith("'") || token.startsWith('"') || token.startsWith('`')) {
        return <span key={idx} className="text-[#7CE38B]">{token}</span>;
      }

      // Comments
      if (token.startsWith('//')) {
        return <span key={idx} className="text-[#6A7280] italic">{token}</span>;
      }

      // Functions and Identifiers (#00F2FE) vs General Code (#E0E0E0)
      const funcParts = token.split(/(\b[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()|\b(?:authenticateUser|verify|login|post|fetch|startsWith|split|dispatch|handleSubmit|validateData|apiCall|status|json)\b)/g);

      return funcParts.map((sub, sidx) => {
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(sub) && (
          ['authenticateUser', 'verify', 'login', 'post', 'fetch', 'startsWith', 'split', 'dispatch', 'handleSubmit', 'validateData', 'apiCall', 'status', 'json'].includes(sub)
        )) {
          return <span key={`${idx}-${sidx}`} className="text-[#00F2FE] font-medium">{sub}</span>;
        }
        return <span key={`${idx}-${sidx}`} className="text-[#E0E0E0]">{sub}</span>;
      });
    });
  };

  return (
    <div className="flex flex-col bg-[#08080C] w-full h-full relative overflow-hidden transition-all duration-300">
      {/* Pane Header - Halftone pattern confined only to header and edges */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1A1A22] border-b border-[#3A3A44] z-10 select-none relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-20 z-0"
          style={{
            backgroundImage: 'radial-gradient(#6A7280 1px, transparent 1px)',
            backgroundSize: '6px 6px',
          }}
        />

        {/* Left: Interactive File Dropdown Selector */}
        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={() => setShowFileMenu(!showFileMenu)}
            className="flex items-center gap-2 text-[#00F2FE] hover:text-[#7ce38b] font-code text-xs font-bold uppercase tracking-wider py-1 px-2.5 rounded bg-[#101018] border border-[#00F2FE]/30 hover:border-[#00F2FE] transition-all shadow-[0_0_10px_rgba(0,242,254,0.15)]"
          >
            <span className="material-symbols-outlined text-sm">terminal</span>
            <span>{currentFile.name}</span>
            <span className="material-symbols-outlined text-xs">expand_more</span>
          </button>

          {/* File Selector Dropdown */}
          {showFileMenu && (
            <div className="absolute top-9 left-0 w-60 bg-[#1A1A22] border border-[#00F2FE]/50 rounded-xl shadow-2xl z-50 py-1.5 font-code text-xs backdrop-blur-xl">
              <div className="px-3 py-1.5 text-[10px] text-[#A0A0A0] uppercase font-bold tracking-widest border-b border-[#3A3A44]">
                Select File
              </div>
              {(Object.values(allFiles) as CodeFile[]).map((file) => (
                <button
                  key={file.id}
                  onClick={() => {
                    onSelectFile(file.id);
                    setShowFileMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#2A2A34] transition-colors ${
                    file.id === currentFile.id ? 'text-[#00F2FE] font-bold bg-[#00F2FE]/10 border-l-2 border-[#00F2FE]' : 'text-[#CCCCCC]'
                  }`}
                >
                  <span className="truncate">{file.name}</span>
                  <span className="text-[10px] text-[#A0A0A0] uppercase">{file.language}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Path & Version */}
        <div className="flex items-center gap-3 relative z-10">
          <span className="font-code text-[11px] text-[#A0A0A0] truncate max-w-[200px] hidden sm:inline">
            {currentFile.path}
          </span>
          <span className="font-code text-[10px] text-[#00F2FE] bg-[#00F2FE]/10 px-2 py-0.5 rounded border border-[#00F2FE]/30">
            {currentFile.version}
          </span>
        </div>
      </div>

      {/* Code Area - NO grid or halftone pattern directly behind code text */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto bg-[#08080C] p-2 md:p-3 font-code text-[13px] leading-[1.65] relative">
          <table className="w-full text-left border-collapse table-fixed">
            <tbody>
              {currentFile.content.map((row) => (
                <tr
                  key={row.lineNumber}
                  onClick={() => onLineClick && onLineClick(row.lineNumber, row.code)}
                  className={`group cursor-pointer transition-colors ${
                    row.isHighlighted
                      ? 'bg-[#00F2FE]/10 border-l-2 border-[#00F2FE]'
                      : 'hover:bg-[#1A1A22]/70'
                  }`}
                >
                  {/* Line Number Gutter with soft-wrap glyph ↳ */}
                  <td className="w-12 text-right pr-3 select-none text-[#6A7280] align-top pt-0.5 font-mono text-xs">
                    <div className="flex items-center justify-end gap-1">
                      <span>{row.lineNumber}</span>
                      <span className="text-[#00F2FE]/40 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">↳</span>
                    </div>
                  </td>

                  {/* Code Line Content - Soft-wraps, continuation keeps indentation */}
                  <td className="pl-3 py-0.5 border-l border-[#22222A] whitespace-pre-wrap break-words text-[#E0E0E0] font-normal align-top">
                    {renderSyntax(row.code)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isCollapsed && (
        <div className="px-4 py-2 bg-[#08080C] flex items-center justify-between font-code text-xs text-[#A0A0A0]">
          <span className="truncate text-[#E0E0E0]">{currentFile.path}</span>
          <span className="text-[#00F2FE] text-[10px] uppercase font-bold">[COLLAPSED]</span>
        </div>
      )}
    </div>
  );
};
