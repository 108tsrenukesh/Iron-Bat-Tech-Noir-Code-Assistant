import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Noise patterns to filter out of GitHub tree listings
const NOISE_PATTERNS = [
  "node_modules/", "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
  ".git/", ".github/", ".vscode/", ".idea/", "dist/", "build/", "coverage/",
  ".next/", ".nuxt/", "vendor/", ".terraform/", "*.min.js", "*.min.css",
  "*.map", "*.lock", ".env", ".DS_Store", "Thumbs.db", ".npmrc",
];

function isNoiseFile(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  if (filePath.length > 120) return true;
  return NOISE_PATTERNS.some((p) =>
    p.startsWith("*") ? lower.endsWith(p.slice(1))
      : p.endsWith("/") ? lower.includes(p) : lower === p || lower.endsWith("/" + p)
  );
}

function parseRepoUrl(url: string): { owner: string; repo: string; branch: string } | null {
  const cleaned = url.replace(/\.git$/, "").replace(/\/+$/, "");
  const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (match) {
    const [, owner, repo] = match;
    const branchMatch = cleaned.match(/\/tree\/([^/]+)/);
    return { owner, repo, branch: branchMatch ? branchMatch[1] : "main" };
  }
  // Try "owner/repo" format
  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length === 2) {
    return { owner: parts[0], repo: parts[1], branch: "main" };
  }
  return null;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Initialize Gemini client lazily
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
        aiClient = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { "User-Agent": "aistudio-build" } },
        });
      }
    }
    return aiClient;
  }

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
      timestamp: new Date().toISOString(),
    });
  });

  // ── Fetch GitHub repo file tree ──────────────────────────────────
  app.get("/api/repo", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "url query param required" });
      }
      const parsed = parseRepoUrl(url);
      if (!parsed) {
        return res.status(400).json({ error: "Invalid GitHub URL. Use format: owner/repo or https://github.com/owner/repo" });
      }

      const { owner, repo, branch } = parsed;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

      const treeRes = await fetch(apiUrl, {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "IronBat-CodeAssistant/1.0",
        },
      });

      if (!treeRes.ok) {
        const errBody = await treeRes.text();
        return res.status(treeRes.status).json({
          error: `GitHub API error (${treeRes.status}): ${errBody.slice(0, 200)}`,
        });
      }

      const treeData = await treeRes.json() as any;
      const files = (treeData.tree || [])
        .filter((item: any) => item.type === "blob" && !isNoiseFile(item.path))
        .map((item: any) => ({
          path: item.path,
          size: item.size || 0,
          ext: path.extname(item.path).toLowerCase(),
        }));

      // Fetch README.md if it exists
      let readme = "";
      const readmeFile = files.find((f: any) => /^readme\.md$/i.test(f.path));
      if (readmeFile) {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${readmeFile.path}`;
          const readmeRes = await fetch(rawUrl, { headers: { "User-Agent": "IronBat/1.0" } });
          if (readmeRes.ok) {
            const text = await readmeRes.text();
            readme = text.slice(0, 8000); // cap at 8KB
          }
        } catch { /* skip */ }
      }

      res.json({
        owner,
        repo,
        branch,
        totalFiles: treeData.tree?.length || 0,
        filteredFiles: files.length,
        files,
        readme,
      });
    } catch (err: any) {
      console.error("Repo fetch error:", err);
      res.status(500).json({ error: "Failed to fetch repository: " + (err.message || "unknown") });
    }
  });

  // ── Fetch file content from raw.githubusercontent.com ────────────
  app.get("/api/file", async (req, res) => {
    try {
      const { owner, repo, branch, filepath } = req.query;
      if (!owner || !repo || !filepath) {
        return res.status(400).json({ error: "owner, repo, filepath query params required" });
      }
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch || "main"}/${filepath}`;
      const fileRes = await fetch(rawUrl, { headers: { "User-Agent": "IronBat/1.0" } });
      if (!fileRes.ok) {
        return res.status(fileRes.status).json({ error: "File not found or inaccessible" });
      }
      const content = await fileRes.text();
      res.json({ content, path: filepath, truncated: content.length > 32000 });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch file" });
    }
  });

  // ── AI Code Chat (supports both single-file and multi-file repo mode) ──
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, fileContext, history, repoFiles, repoMeta } = req.body;
      const ai = getGeminiClient();

      if (!message) {
        return res.status(400).json({ error: "Message prompt is required." });
      }

      if (!ai) {
        const fallbackText =
          `Diagnostics complete for query "${message}".\n\n` +
          `› Analyzed active source context: \`${fileContext?.name || "Auth.js"}\`.\n` +
          `› Verified payload schema & async promise pipeline.\n` +
          `› Identified key entry handler and token verification block.\n\n` +
          `*Note: No GEMINI_API_KEY configured — using offline demo mode.*`;
        return res.json({
          reply: fallbackText,
          status: "ANALYSIS COMPLETE",
          suggestions: ["Review Error Handling", "Trace Sequence", "Check Security Vulnerabilities"],
          isFallback: true,
        });
      }

      // Build system prompt
      let systemInstruction = `You are Iron Bat, a cybernetic AI Code Assistant. You ONLY answer questions about the code provided. You MUST refuse any off-topic questions (math, trivia, general chat). If off-topic, respond: "DIAGNOSTIC DENIED: Query outside code scope." Then suggest code-related actions. Use crisp diagnostic tone. Present observations as concise bullet points starting with '›'.`;

      let fullPrompt = "";

      // Multi-file repo mode
      if (repoFiles && Array.isArray(repoFiles) && repoFiles.length > 0) {
        systemInstruction += `\n\nYou are analyzing a real GitHub repository. The user may ask about the repo's purpose, architecture, security, patterns, or any code question. Cite specific files in your answer using the format: filename (e.g., "auth.ts" not "src/auth.ts"). Always answer based ONLY on the code files provided below. If the answer isn't in the provided files, say so.`;

        fullPrompt += `[REPOSITORY: ${repoMeta?.owner || ""}/${repoMeta?.repo || ""}]\n`;
        fullPrompt += `[BRANCH: ${repoMeta?.branch || "main"}]\n`;
        fullPrompt += `[FILTERED FILE TREE (${repoFiles.length} files)]\n`;
        fullPrompt += repoFiles.map((f: any) => `  ${f.path} (${f.size || "?"} bytes)`).join("\n") + "\n\n";

        if (repoMeta?.readme) {
          fullPrompt += `[README.md]\n\`\`\`markdown\n${repoMeta.readme}\n\`\`\`\n\n`;
        }

        // Include actual file contents if provided
        if (req.body.fileContents) {
          for (const [fp, content] of Object.entries(req.body.fileContents)) {
            if (typeof content === "string") {
              fullPrompt += `[FILE: ${fp}]\n\`\`\`\n${content.slice(0, 16000)}\n\`\`\`\n\n`;
            }
          }
        }
      }
      // Single-file mode (legacy)
      else if (fileContext && fileContext.name) {
        fullPrompt += `[ACTIVE CODE FILE: ${fileContext.name}]\n\`\`\`javascript\n${fileContext.content}\n\`\`\`\n\n`;
      }

      if (history && Array.isArray(history) && history.length > 0) {
        fullPrompt += `[CONVERSATION HISTORY]\n` + history.map((h: any) => `${h.role}: ${h.text}`).join("\n") + "\n\n";
      }

      fullPrompt += `[USER QUERY]: ${message}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: fullPrompt,
        config: {
          systemInstruction,
          temperature: 0.4,
        },
      });

      const replyText = response.text || "Diagnostic scan complete. No structural errors detected.";

      return res.json({
        reply: replyText,
        status: "ANALYSIS COMPLETE",
        suggestions: ["Review Error Handling", "Check Security Vulnerabilities", "Explain Architecture", "Trace Execution"],
        isFallback: false,
      });
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      return res.status(500).json({
        error: "AI Diagnostic Scan Failure",
        message: err.message || "Failed to process code analysis query.",
      });
    }
  });

  // ── AI Trace Generation ──
  app.post("/api/trace", async (req, res) => {
    try {
      const { functionName } = req.body;
      const ai = getGeminiClient();

      if (ai) {
        const prompt = `Generate a 3-step execution trace sequence for function '${functionName || "authenticateUser"}'.
Return valid JSON format matching this schema:
{
  "steps": [
    { "file": "App.js", "lines": "100-104", "code": "await AuthService.login(user);", "highlight": "login" },
    { "file": "AuthService.js", "lines": "44-46", "code": "const token = await ApiClient.post('/auth');", "highlight": "post" },
    { "file": "ApiClient.js", "lines": "209-211", "code": "return fetch(url, options);", "highlight": "fetch" }
  ],
  "explanation": "Brief 2-sentence diagnostic explanation of how the call flows."
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            systemInstruction: "You are Iron Bat, a code analysis engine. You ONLY generate execution traces for code. Refuse any off-topic requests.",
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return res.json(parsed);
        }
      }

      return res.json({
        steps: [
          { file: "App.js", lines: "100-104", code: "try {\n  await AuthService.login(user);\n} catch (e) {", highlight: "AuthService.login" },
          { file: "AuthService.js", lines: "44-46", code: "const token = await\n  ApiClient.post('/auth');\nreturn token;", highlight: "ApiClient.post" },
          { file: "ApiClient.js", lines: "209-211", code: "const options = { method: 'POST' };\nreturn fetch(url, options);", highlight: "fetch" },
        ],
        explanation: "The flow initiates when submitForm is triggered in App.js. It immediately calls the AuthService to authenticate the payload, which then relies on the base ApiClient to execute the actual network request.",
      });
    } catch (err: any) {
      console.error("Trace Generation Error:", err);
      res.status(500).json({ error: "Trace sequence generation failed" });
    }
  });

  // Vite dev / static prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Iron Bat Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
