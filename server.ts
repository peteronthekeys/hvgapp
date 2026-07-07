import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, currentSchema, history } = req.body;
      
      const updateSchemaDeclaration = {
        name: "updateSchema",
        description: "Updates the scroll animation builder schema based on the user's request. Always provide the FULL updated schema.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  height: { type: Type.NUMBER },
                  elements: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ["text", "cube", "glbObject"] },
                        content: { type: Type.STRING },
                        modelPath: { type: Type.STRING },
                        start: { type: Type.NUMBER },
                        end: { type: Type.NUMBER },
                        startY: { type: Type.NUMBER },
                        endY: { type: Type.NUMBER },
                        startOpacity: { type: Type.NUMBER },
                        endOpacity: { type: Type.NUMBER },
                      },
                      required: ["id", "type", "start", "end", "startY", "endY", "startOpacity", "endOpacity"]
                    }
                  }
                },
                required: ["id", "height", "elements"]
              }
            }
          },
          required: ["scenes"]
        }
      };

      const systemInstruction = `You are an AI assistant that controls a "No-Code Scroll Animation Builder". 
The user will ask you to modify the animation schema or create new animations.
Current Schema:
${JSON.stringify(currentSchema)}

Rules:
1. Whenever the user wants to add, edit, or delete scenes or elements, you MUST use the updateSchema function call to apply the changes.
2. Provide a short, friendly text response explaining what you did.
3. If they just ask a question, answer it.
4. The only element types you may use are "text" (a "Text Block"), "cube" (a "3D Cube"), and "glbObject" (a GLB-backed 3D object loaded from modelPath) — these are the only types that render in the preview. Never emit any other type value.
5. If creating new elements, give them a unique UUID for the id.
6. For a glbObject, include modelPath. Use "/models/scroll-orb.glb" unless the user provides a different GLB path.
`;

      const formattedHistory = history.map((msg: any) => ({
        role: msg.role,
        parts: msg.parts
      }));

      const contents = [...formattedHistory, { role: "user", parts: [{ text: message }] }];

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: [updateSchemaDeclaration] }],
          temperature: 0.1,
        }
      });

      const functionCalls = response.functionCalls;
      let newSchema = null;
      let textResponse = response.text || "I have updated the schema.";

      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        if (call.name === "updateSchema") {
          newSchema = call.args;
        }
      }

      const modelParts = [];
      if (textResponse) modelParts.push({ text: textResponse });
      // If we made a function call, we don't necessarily need to persist the function call in history if we don't handle the result, but it's safe to just keep the text interaction.
      
      res.json({
        text: textResponse,
        newSchema: newSchema,
      });

    } catch (error: any) {
      console.error("Chat Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
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
