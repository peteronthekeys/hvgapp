import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { runChat } from "./server/gemini";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Same runChat as the Vercel function (api/chat.ts) — one copy of the AI contract.
  app.post("/api/chat", async (req, res) => {
    try {
      const result = await runChat(req.body);
      res.json(result);
    } catch (error: any) {
      console.error("Chat Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    // Serve the standalone player build (after `npm run build:player`) so the
    // export feature can fetch /player/player.js locally in dev, same as prod.
    // Mounted before the Vite middleware so it takes precedence over the SPA.
    app.use("/player", express.static(path.join(process.cwd(), "dist/player"), { fallthrough: true }));

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
