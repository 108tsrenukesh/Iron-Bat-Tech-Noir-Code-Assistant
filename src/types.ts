export type AppTab = 'repos' | 'assistant' | 'trace' | 'config';

export interface CodeFile {
  id: string;
  name: string;
  path: string;
  language: 'javascript' | 'typescript' | 'python' | 'html' | 'css' | 'json';
  version: string;
  startLine: number;
  content: Array<{
    lineNumber: number;
    code: string;
    isHighlighted?: boolean;
    isPrimary?: boolean;
  }>;
}

export interface TraceStep {
  id: string;
  file: string;
  lines: string;
  code: string;
  highlight: string;
  description?: string;
}

export interface Repository {
  id: string;
  name: string;
  subtitle: string;
  lang: string;
  langColor: string;
  updated: string;
  status: 'active' | 'scanning' | 'connected';
  filesCount: number;
  branch: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  statusLabel?: string;
  bullets?: string[];
  snippetText?: string;
  snippetAction?: string;
  timestamp: string;
}

export interface SystemConfig {
  model: string;
  autoAnalyzeOnSelect: boolean;
  soundEffects: boolean;
  halftoneDensity: 'low' | 'medium' | 'high' | 'off';
  glowTheme: 'cyan' | 'gold' | 'neon';
  fontSize: 'sm' | 'md' | 'lg';
}
