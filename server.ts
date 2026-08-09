import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

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
          apiKey: apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      }
    }
    return aiClient;
  }

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
      timestamp: new Date().toISOString(),
    });
  });

  // AI Code Chat & Diagnostic Endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, fileContext, history } = req.body;
      const ai = getGeminiClient();

      if (!message) {
        return res.status(400).json({ error: "Message prompt is required." });
      }

      if (!ai) {
        // High quality fallback response if GEMINI_API_KEY is not configured
        const isExplainAuth = message.toLowerCase().includes("authenticateuser") || message.toLowerCase().includes("auth");
        
        const fallbackText = isExplainAuth
          ? `Scanning authorization logic... This function validates the JWT from the request header.\n\n` +
            `› Checks for the presence of an \`authorization\` header.\n` +
            `› Verifies the header begins with \`'Bearer '\`.\n` +
            `› Extracts and returns a 401 if validation fails.\n` +
            `› Decodes JWT payload using \`process.env.JWT_SECRET\`.`
          : `Diagnostics complete for query "${message}".\n\n` +
            `› Analyzed active source context: \`${fileContext?.name || 'Auth.js'}\`.\n` +
            `› Verified payload schema & async promise pipeline.\n` +
            `› Identified key entry handler and token verification block.`;

        return res.json({
          reply: fallbackText,
          status: "ANALYSIS COMPLETE",
          suggestions: ["Review Error Handling", "Check Token Expiration", "Generate Unit Tests", "Trace Execution"],
          isFallback: true,
        });
      }

      // Build context prompt
      let fullPrompt = `System: You are Iron Bat, a high-tech cybernetic AI Code Assistant operating in a tech-noir universe. Speak in crisp, authoritative diagnostic terms. Present observations using concise bullet points starting with '›'.\n\n`;

      if (fileContext && fileContext.name) {
        fullPrompt += `[ACTIVE CODE FILE: ${fileContext.name}]\n\`\`\`javascript\n${fileContext.content}\n\`\`\`\n\n`;
      }

      if (history && Array.isArray(history) && history.length > 0) {
        fullPrompt += `[CONVERSATION HISTORY]\n` + history.map(h => `${h.role}: ${h.text}`).join("\n") + `\n\n`;
      }

      fullPrompt += `[USER QUERY]: ${message}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: fullPrompt,
        config: {
          systemInstruction:
            "You are Iron Bat, a cybernetic AI Code Assistant. Provide direct, highly technical code analysis with 'ANALYSIS COMPLETE' tone, concise bullet points starting with '›', code snippet highlights, and practical error/optimization guidance.",
          temperature: 0.4,
        },
      });

      const replyText = response.text || "Diagnostic scan complete. No structural errors detected.";

      return res.json({
        reply: replyText,
        status: "ANALYSIS COMPLETE",
        suggestions: ["Review Error Handling", "Check Token Expiration", "Generate Unit Tests", "Trace Sequence"],
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

  // Code Trace Generation Endpoint
  app.post("/api/trace", async (req, res) => {
    try {
      const { functionName, codeSnippet } = req.body;
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
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return res.json(parsed);
        }
      }

      // Default trace fallback
      return res.json({
        steps: [
          {
            file: "App.js",
            lines: "100-104",
            code: "try {\n  await AuthService.login(user);\n} catch (e) {",
            highlight: "AuthService.login",
          },
          {
            file: "AuthService.js",
            lines: "44-46",
            code: "const token = await\n  ApiClient.post('/auth');\nreturn token;",
            highlight: "ApiClient.post",
          },
          {
            file: "ApiClient.js",
            lines: "209-211",
            code: "const options = { method: 'POST' };\nreturn fetch(url, options);",
            highlight: "fetch",
          },
        ],
        explanation:
          "The flow initiates when submitForm is triggered in App.js. It immediately calls the AuthService to authenticate the payload, which then relies on the base ApiClient to execute the actual network request.",
      });
    } catch (err: any) {
      console.error("Trace Generation Error:", err);
      res.status(500).json({ error: "Trace sequence generation failed" });
    }
  });

  // Vite middleware for dev / static serving for prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Iron Bat Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
