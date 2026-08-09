# 🦇 Iron Bat — Tech-Noir Code Assistant

> *"Every hero has an origin story. This is mine — where a childhood obsession with Batman's dark, methodical genius met Iron Man's relentless, bleeding-edge innovation. Iron Bat is what happens when those two worlds collide in code."*

---

## The Origin Story

Growing up, I lived in two worlds. In one, Batman patrolled Gotham's rain-slicked rooftops — silent, analytical, seeing patterns no one else could. In the other, Tony Stark built impossible machines in his workshop — bold, relentless, turning raw intelligence into living technology.

I always wondered: *what if Batman had Iron Man's tools?*

Not a suit of armor. Not a cave. Something sharper. A **mind** that could dive into any codebase and see what others miss — every vulnerability, every hidden dependency, every call chain hidden in the noise. A diagnostic engine that speaks in cold, precise bullets and never misses a detail.

Iron Bat is that engine. A tech-noir code assistant that fuses **Batman's forensic precision** with **Iron Man's AI-powered intelligence**. You point it at a codebase. It dissects it. And it tells you exactly what's going on — no fluff, no filler, just analysis.

---

## What It Does

Iron Bat connects to any **public GitHub repository**, fetches the file tree, loads key files into context, and lets you **ask questions about the entire codebase** using Google's Gemini AI.

```
┌─────────────────────────────────────────────────────┐
│  🦇  Connect any GitHub repo                       │
│      ↓                                              │
│  🔍  File tree fetched, noise filtered, key files   │
│      loaded (README, source, config)                │
│      ↓                                              │
│  💬  Ask: "What is this repo about?"                │
│      Ask: "What security features exist?"           │
│      Ask: "How is the code structured?"             │
│      Ask: "Find all API endpoints"                  │
│      Ask: "Check for vulnerabilities"               │
│      ↓                                              │
│  🧠  Gemini analyzes code + context → answers       │
│      with file citations and diagnostic tone        │
└─────────────────────────────────────────────────────┘
```

### Core Capabilities

| Feature | What It Does |
|---|---|
| **GitHub Repo Connect** | Paste any `owner/repo` URL → fetches file tree via GitHub API, filters noise (node_modules, lockfiles, binaries), loads README + key source files |
| **Multi-File AI Chat** | Ask questions about the *entire* codebase — Gemini receives the file tree + file contents and answers with file-level citations |
| **Security Analysis** | Ask "What security features does this have?" or "Check for vulnerabilities" → Gemini scans the loaded code for auth patterns, injection risks, and security practices |
| **Architecture Explanation** | "How is the code structured?" → Gemini reads the file tree + key files and explains the architecture, dependencies, and patterns |
| **API Endpoint Discovery** | "Find all API endpoints" → scans route files, controllers, and middleware for endpoint definitions |
| **Execution Tracing** | Generate 3-step cross-file call chains showing how a function flows through the codebase |
| **Graceful Fallback** | No API key? The app still works in demo mode with smart offline responses — the interface never breaks |

---

## How It Works

### The Two-Step Agentic Flow

Iron Bat uses a **two-step retrieval pattern** — no vector database, no embeddings, just smart context management:

```
Step 1: "Read the map"
───────────────────────
  User question + full file tree (300 files max)
  → Gemini picks the 5-15 most relevant files

Step 2: "Open the book"
───────────────────────
  User question + file contents + tree context
  → Gemini generates the analysis with file citations
```

This costs only **2 Gemini API calls per question** — free tier friendly.

### System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Iron Bat UI (React SPA)                    │
│              Connect Repo → Chat → Get Analysis               │
└───────────────────────────┬──────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
         GET /api/repo  POST /api/chat  GET /api/file
              │             │             │
              ▼             ▼             ▼
┌──────────────────────────────────────────────────────────────┐
│              Express Server (server.ts)                       │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  GitHub API      │  │  Gemini SDK  │  │  Rate Limiter  │  │
│  │  Fetch tree +    │  │  Flash model │  │  60/min general│  │
│  │  file contents   │  │  2-step      │  │  20/min chat   │  │
│  └─────────────────┘  │  retrieval   │  └────────────────┘  │
│                        └──────────────┘                      │
└──────────────────────────────────────────────────────────────┘
              │             │             │
              ▼             ▼             ▼
     GitHub API      Gemini API     Raw Files
     (file tree)     (analysis)     (contents)
```

### Security Hardening

| Protection | Implementation |
|---|---|
| **Rate Limiting** | `express-rate-limit`: 60 req/min general, 20/min chat, 10/min repo connect |
| **Input Validation** | GitHub inputs sanitized, message length capped at 2000 chars, filepath path traversal blocked |
| **Fetch Timeouts** | All external API calls have 10s `AbortController` timeout |
| **Body Size Limit** | Express JSON body capped at 512KB to prevent OOM |
| **Context Overflow Protection** | Total prompt capped at 120K chars (~30K tokens) with graceful "CONTEXT OVERFLOW" response |
| **Error Sanitization** | Internal errors never leak to users — safe, generic messages only |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 6, Tailwind CSS v4, Motion (Framer Motion) |
| **Backend** | Node.js + Express 4, TypeScript (esbuild → single `server.cjs`) |
| **AI Engine** | Google Gemini 3.6 Flash via `@google/genai` SDK |
| **External APIs** | GitHub REST API (file trees), raw.githubusercontent.com (file contents) |
| **Security** | `express-rate-limit`, input sanitization, fetch timeouts, body size limits |
| **Build** | Vite (client) + esbuild (server) — `npm run build` bundles everything |
| **Deployment** | Render free tier (Blueprint + GitHub Actions auto-deploy) |

---

## Quick Start

### Try It Live

**→ [iron-bat-code-assistant.onrender.com](https://iron-bat-code-assistant.onrender.com)**

1. Open the app → lands on the **REPOS** tab
2. Click **Connect Your GitHub Arsenal**
3. Paste any public repo URL (e.g., `facebook/react`, `vercel/next.js`)
4. Wait ~5 seconds for the file tree to load
5. Switch to the **AI** tab
6. Ask: *"What is this repo about?"* or *"What security features does this have?"*

### Run Locally

```bash
# Clone the repo
git clone https://github.com/108tsrenukesh/Iron-Bat-Tech-Noir-Code-Assistant.git
cd Iron-Bat-Tech-Noir-Code-Assistant

# Install dependencies
npm install

# Add your Gemini API key
cp .env.example .env
# Edit .env and set GEMINI_API_KEY="your-key"

# Start dev server (hot reload)
npm run dev
# → http://localhost:3000

# Production build + serve
npm run build && npm start
```

> No API key? The app still works in demo mode with smart fallback responses.

---

## API Endpoints

| Method | Path | Purpose | Rate Limit |
|---|---|---|---|
| `GET` | `/api/health` | Check server status + API key presence | 60/min |
| `GET` | `/api/repo?url=owner/repo` | Fetch GitHub file tree, filter noise, load README | 10/min |
| `GET` | `/api/file?owner=...&repo=...&filepath=...` | Fetch raw file content from GitHub | 10/min |
| `POST` | `/api/chat` | Ask questions about code (single-file or multi-file repo mode) | 20/min |
| `POST` | `/api/trace` | Generate 3-step execution call chains | 20/min |

---

## Project Structure

```
├── server.ts                  # Express: GitHub API, Gemini client, rate limiting
├── render.yaml                # Render Blueprint (free tier, auto-deploy)
├── .github/workflows/
│   └── deploy.yml             # GitHub Actions: secret sync + deploy hook
├── .env.example               # GEMINI_API_KEY / APP_URL template
├── vite.config.ts             # Vite + React + Tailwind
├── package.json               # build: vite build && esbuild server
└── src/
    ├── App.tsx                # Main shell: tab routing, repo state, chat handler
    ├── types.ts               # TypeScript interfaces (RepoMeta, ChatMessage, etc.)
    ├── data/
    │   └── mockCodebase.ts    # Built-in demo codebase (fallback when no repo connected)
    └── components/
        ├── AIChatPane.tsx     # Chat UI: messages, suggestions, input bar
        ├── ReposView.tsx      # Repo connect: URL input, connected list, disconnect
        ├── CodeViewer.tsx     # Syntax-highlighted file viewer (demo mode)
        ├── TraceSequenceView  # Call-chain timeline
        ├── ConfigView.tsx     # Settings, API key status, health check
        ├── SearchModal.tsx    # File search (Ctrl+K)
        ├── Header.tsx         # Top bar with logo, breadcrumbs, search
        └── Navigation.tsx     # Bottom tab bar (REPOS / AI / CONFIG)
```

---

## The Build-with-AI Journey

This project was built entirely inside **Google AI Studio** during the **Build with AI Bootcamp**:

1. **Google Stitch** → designed the tech-noir UI (dark theme, cyan neon accents, glassmorphism)
2. **Antigravity Agent** → scaffolded the full-stack app from natural language prompts
3. **AI Studio Build** → generated React + Express + Gemini integration in one pass
4. **GitHub** → exported code, iterated on features, added real GitHub integration
5. **Render** → deployed free via Blueprint + GitHub Actions

### What I Learned

| Concept | How It's Used |
|---|---|
| **Agentic Build Flow** | Stitch → Antigravity → AI Studio → GitHub → Render — the full pipeline |
| **Prompt Architecture** | System persona + file context + conversation history → stable, character-consistent outputs |
| **Structured JSON Outputs** | `/api/trace` forces `responseMimeType: "application/json"` for deterministic data |
| **Two-Step Retrieval** | File tree → Gemini selects relevant files → fetch contents → Gemini answers |
| **Server-Side Key Management** | Gemini API key never leaves the server — Express proxies all AI calls |
| **Graceful Degradation** | App works without API key (demo mode) — great for demos and CI |
| **Rate Limiting** | `express-rate-limit` with tiered limits per endpoint type |
| **Input Sanitization** | GitHub inputs validated, paths sanitized, message lengths capped |

---

## Deployment (Free — No Google Billing)

### Option 1: Render Blueprint (Recommended)

1. Go to [render.com](https://render.com) → **New → Blueprint** → connect your GitHub repo
2. Render reads `render.yaml` and creates the service automatically
3. Set `GEMINI_API_KEY` in the service's **Environment** tab
4. Deploy → your app is live at `https://your-app.onrender.com`

### Option 2: GitHub Actions Auto-Deploy

Add these secrets to your repo (**Settings → Secrets → Actions**):

| Secret | Where to Get It |
|---|---|
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) → API Keys |
| `RENDER_API_KEY` | render.com → Account Settings → API Keys |
| `RENDER_DEPLOY_HOOK_URL` | Render service → Settings → Deploy Hook |
| `RENDER_SERVICE_ID` | Render service URL: `https://dashboard.render.com/web/srv-XXXX` |

Every `git push` → GitHub Actions syncs the API key → triggers Render deploy → live in ~2 min.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "DIAGNOSTIC DENIED" on valid code questions | Guardrails were too aggressive — update was pushed to relax them (commit `7f4b3ae`) |
| Blank screen in production | Check `/api/health` returns `status: ok` — SPA fallback serves `index.html` on all routes |
| "AI Diagnostic Scan Failure" | Verify `GEMINI_API_KEY` is set in Render → Environment tab |
| Render build fails with "vite not found" | Ensure `render.yaml` has `buildCommand: npm install && npm run build` |
| Repo connects but chat doesn't answer | Check Gemini API quota — free tier has daily limits |
| Changes not auto-deploying | Verify GitHub Actions workflow ran (Actions tab) and Deploy Hook URL is correct |

---

## License

Apache-2.0

---

*Built with 🦇 by [@108tsrenukesh](https://github.com/108tsrenukesh) — a childhood dream of Batman's precision meets Iron Man's intelligence, powered by Google AI.*
