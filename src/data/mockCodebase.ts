import { CodeFile, Repository, TraceStep } from '../types';

export const INITIAL_FILES: Record<string, CodeFile> = {
  'auth.js': {
    id: 'auth.js',
    name: 'Auth.js',
    path: 'react-app / src / auth',
    language: 'javascript',
    version: 'V. 1.0.42',
    startLine: 42,
    content: [
      { lineNumber: 42, code: "export const authenticateUser = async (req, res, next) => {" },
      { lineNumber: 43, code: "  const authHeader = req.headers.authorization;", isHighlighted: true },
      { lineNumber: 44, code: "  if (!authHeader || !authHeader.startsWith('Bearer ')) {", isHighlighted: true },
      { lineNumber: 45, code: "    return res.status(401).json({ error: 'Unauthorized' });", isHighlighted: true },
      { lineNumber: 46, code: "  }", isHighlighted: true },
      { lineNumber: 47, code: "  const token = authHeader.split(' ')[1];" },
      { lineNumber: 48, code: "  try {" },
      { lineNumber: 49, code: "    const decoded = jwt.verify(token, process.env.JWT_SECRET);" },
      { lineNumber: 50, code: "    req.user = decoded;" },
      { lineNumber: 51, code: "    next();" },
      { lineNumber: 52, code: "  } catch (err) {" },
      { lineNumber: 53, code: "    return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });" },
      { lineNumber: 54, code: "  }" },
      { lineNumber: 55, code: "};" }
    ]
  },
  'authservice.js': {
    id: 'authservice.js',
    name: 'AuthService.js',
    path: 'react-app / src / services',
    language: 'javascript',
    version: 'V. 1.0.18',
    startLine: 40,
    content: [
      { lineNumber: 40, code: "export class AuthService {" },
      { lineNumber: 41, code: "  static async login(userCredentials) {" },
      { lineNumber: 42, code: "    const payload = JSON.stringify(userCredentials);" },
      { lineNumber: 43, code: "    console.log('[AUTH_SERVICE] Dispatching payload:', payload);" },
      { lineNumber: 44, code: "    const token = await", isHighlighted: true },
      { lineNumber: 45, code: "      ApiClient.post('/auth', credentials);", isHighlighted: true },
      { lineNumber: 46, code: "    return token;", isHighlighted: true },
      { lineNumber: 47, code: "  }" },
      { lineNumber: 48, code: "}" }
    ]
  },
  'apiclient.js': {
    id: 'apiclient.js',
    name: 'ApiClient.js',
    path: 'react-app / src / api',
    language: 'javascript',
    version: 'V. 2.1.0',
    startLine: 208,
    content: [
      { lineNumber: 208, code: "export const ApiClient = {" },
      { lineNumber: 209, code: "  post: async (url, options = {}) => {", isHighlighted: true },
      { lineNumber: 210, code: "    const opts = { method: 'POST', ...options };", isHighlighted: true },
      { lineNumber: 211, code: "    return fetch(url, opts);", isHighlighted: true },
      { lineNumber: 212, code: "  }" },
      { lineNumber: 213, code: "};" }
    ]
  },
  'app.js': {
    id: 'app.js',
    name: 'App.js',
    path: 'react-app / src',
    language: 'javascript',
    version: 'V. 1.2.0',
    startLine: 99,
    content: [
      { lineNumber: 99, code: "const submitForm = async (userData) => {" },
      { lineNumber: 100, code: "  try {", isHighlighted: true },
      { lineNumber: 101, code: "    // Initiating authentication pipeline" },
      { lineNumber: 102, code: "    await AuthService.login(user);", isHighlighted: true },
      { lineNumber: 103, code: "  } catch (e) {", isHighlighted: true },
      { lineNumber: 104, code: "    showNotification('Auth Failed', e.message);" },
      { lineNumber: 105, code: "  }" },
      { lineNumber: 106, code: "};" }
    ]
  }
};

export const INITIAL_REPOS: Repository[] = [
  {
    id: 'repo-1',
    name: 'React Web App',
    subtitle: 'Quantum Entanglement Lib',
    lang: 'JS',
    langColor: 'text-[#e9c400] bg-[#e9c400]/10',
    updated: 'Updated 2h ago',
    status: 'active',
    filesCount: 14,
    branch: 'main'
  },
  {
    id: 'repo-2',
    name: 'Mobile API',
    subtitle: 'Inter-Dimensional Gateway',
    lang: 'PY',
    langColor: 'text-[#00dce6] bg-[#00dce6]/10',
    updated: 'Updated 5h ago',
    status: 'active',
    filesCount: 8,
    branch: 'v2-dev'
  },
  {
    id: 'repo-3',
    name: 'Auth Module',
    subtitle: 'Vault Protocol',
    lang: 'TS',
    langColor: 'text-on-surface-variant bg-surface-variant',
    updated: 'Scanning...',
    status: 'scanning',
    filesCount: 6,
    branch: 'security-patch'
  }
];

export const MOCK_TRACE_STEPS: TraceStep[] = [
  {
    id: 'step-1',
    file: 'App.js:102',
    lines: '100-104',
    code: 'await AuthService.login(user);',
    highlight: 'AuthService.login',
    description: 'Initiates user submission from the primary React component.'
  },
  {
    id: 'step-2',
    file: 'AuthService.js:45',
    lines: '44-46',
    code: "const token = await ApiClient.post('/auth');",
    highlight: 'ApiClient.post',
    description: 'Formats authentication credentials and triggers the HTTP client POST request.'
  },
  {
    id: 'step-3',
    file: 'ApiClient.js:210',
    lines: '209-211',
    code: 'return fetch(url, options);',
    highlight: 'fetch',
    description: 'Executes low-level browser network fetch request to the auth gateway.'
  }
];
