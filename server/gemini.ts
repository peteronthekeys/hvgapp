import { GoogleGenAI, Type } from "@google/genai";

// The single source of the AI editing contract, shared by the local Express
// server (server.ts) and the Vercel serverless function (api/chat.ts).
// Type-drift law (AGENTS.md): the element `type` enum below and the system
// prompt's allowed-type list must stay in sync with src/types.ts and the
// renderers in src/components/PreviewPanel.tsx.

export interface ChatHistoryMessage {
  role: string;
  parts: { text: string }[];
}

export interface ChatRequestBody {
  message: string;
  currentSchema: unknown;
  history: ChatHistoryMessage[];
}

export interface ChatResult {
  text: string;
  newSchema: unknown;
}

const updateSchemaDeclaration = {
  name: "updateSchema",
  description:
    "Updates the scroll animation builder schema based on the user's request. Always provide the FULL updated schema.",
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
                required: ["id", "type", "start", "end", "startY", "endY", "startOpacity", "endOpacity"],
              },
            },
          },
          required: ["id", "height", "elements"],
        },
      },
    },
    required: ["scenes"],
  },
};

const buildSystemInstruction = (currentSchema: unknown) => `You are an AI assistant that controls a "No-Code Scroll Animation Builder".
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

let cachedAi: GoogleGenAI | null = null;

const getAi = (): GoogleGenAI => {
  if (!cachedAi) {
    cachedAi = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return cachedAi;
};

export async function runChat({ message, currentSchema, history }: ChatRequestBody): Promise<ChatResult> {
  const formattedHistory = (history ?? []).map(msg => ({
    role: msg.role,
    parts: msg.parts,
  }));

  const contents = [...formattedHistory, { role: "user", parts: [{ text: message }] }];

  const response = await getAi().models.generateContent({
    model: "gemini-3.5-flash",
    contents,
    config: {
      systemInstruction: buildSystemInstruction(currentSchema),
      tools: [{ functionDeclarations: [updateSchemaDeclaration] }],
      temperature: 0.1,
    },
  });

  const functionCalls = response.functionCalls;
  let newSchema: unknown = null;
  const textResponse = response.text || "I have updated the schema.";

  if (functionCalls && functionCalls.length > 0) {
    const call = functionCalls[0];
    if (call.name === "updateSchema") {
      newSchema = call.args;
    }
  }

  return { text: textResponse, newSchema };
}
