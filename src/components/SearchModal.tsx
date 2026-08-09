import React, { useState } from 'react';
import { CodeFile } from '../types';

interface SearchModalProps {
  files: Record<string, CodeFile>;
  onSelectFile: (fileId: string) => void;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ files, onSelectFile, onClose }) => {
  const [query, setQuery] = useState('');

  const filteredFiles = (Object.values(files) as CodeFile[]).filter(file => {
    const q = query.toLowerCase();
    if (!q) return true;
    if (file.name.toLowerCase().includes(q)) return true;
    if (file.path.toLowerCase().includes(q)) return true;
    return file.content.some(line => line.code.toLowerCase().includes(q));
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1f1f27] border-2 border-[#00dce6] rounded-xl w-full max-w-xl shadow-[0_0_30px_rgba(0,220,230,0.3)] overflow-hidden flex flex-col max-h-[70vh]">
        {/* Search Header */}
        <div className="p-4 bg-[#13131a] border-b border-[#3a494b] flex items-center gap-3">
          <span className="material-symbols-outlined text-[#00dce6]">search</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files, symbols, or functions (e.g. authenticateUser)..."
            className="flex-1 bg-transparent font-code text-xs md:text-sm text-[#e4e1ec] placeholder-[#849495] focus:outline-none"
            autoFocus
          />
          <button onClick={onClose} className="text-[#849495] hover:text-[#e4e1ec]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-2 font-code text-xs">
          {filteredFiles.length === 0 ? (
            <div className="p-8 text-center text-[#849495]">No symbols or files found matching "{query}"</div>
          ) : (
            filteredFiles.map((file) => (
              <button
                key={file.id}
                onClick={() => {
                  onSelectFile(file.id);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-lg hover:bg-[#34343d] flex flex-col gap-1 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[#00dce6] font-bold group-hover:text-[#6ff6ff] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">terminal</span>
                    {file.name}
                  </span>
                  <span className="text-[10px] text-[#849495] uppercase">{file.language}</span>
                </div>
                <span className="text-[11px] text-[#b9cacb] truncate opacity-70">{file.path}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
