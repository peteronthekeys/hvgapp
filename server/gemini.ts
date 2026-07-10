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
                  type: { type: Type.STRING, enum: ["text", "cube", "glbObject", "image", "video"] },
                  content: { type: Type.STRING },
                  splitMode: { type: Type.STRING, enum: ["none", "chars", "words", "lines"] },
                  staggerEach: { type: Type.NUMBER },
                  tag: { type: Type.STRING, enum: ["h1", "h2", "p"] },
                  fontSize: { type: Type.NUMBER },
                  modelPath: { type: Type.STRING },
                  src: { type: Type.STRING },
                  srcset: { type: Type.STRING },
                  alt: { type: Type.STRING },
                  objectFit: { type: Type.STRING, enum: ["cover", "contain"] },
                  poster: { type: Type.STRING },
                  mode: { type: Type.STRING, enum: ["background", "clickToPlay"] },
                  loop: { type: Type.BOOLEAN },
                  start: { type: Type.NUMBER },
                  end: { type: Type.NUMBER },
                  startY: { type: Type.NUMBER },
                  endY: { type: Type.NUMBER },
                  startOpacity: { type: Type.NUMBER },
                  endOpacity: { type: Type.NUMBER },
                  layout: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER },
                      width: { type: Type.NUMBER },
                      anchor: {
                        type: Type.STRING,
                        enum: ["center", "top-left", "top-right", "bottom-left", "bottom-right"],
                      },
                      z: { type: Type.NUMBER },
                    },
                  },
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
4. Never emit an element type outside this set — these are the only types that render in the preview:
   - text: a headline/paragraph block. Required: content. Use for titles, captions, callouts. Optional: splitMode ("words" or "chars" for dramatic staggered reveals — use for hero headlines; "lines" for paragraph-level reveals; default "none"), staggerEach (seconds between each unit's reveal, default 0.03), tag ("h1" | "h2" | "p" for semantic heading level), fontSize (rem).
   - cube: a rotating 3D cube. No type-specific fields required. Use for a simple 3D accent.
   - glbObject: a GLB-backed 3D model. Required: modelPath (default "/models/scroll-orb.glb" unless the user gives another path). Use for custom 3D assets.
   - image: a static image. Required: src. Optional: srcset, alt, objectFit ("cover" | "contain", default "cover"). Use for photos, illustrations, logos.
   - video: an inline video. Required: src. Optional: poster, mode ("background" | "clickToPlay", default "background"), loop (default true for background). Prefer "background" mode unless the user explicitly wants a play button.
5. If creating new elements, give them a unique UUID for the id.
6. Every element may include an optional layout: { x, y, width, anchor, z }. x/y/width are percentages (0-100); anchor is "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right" (default "center"). Omit layout to keep an element centered at its default size — for a background video, omitting layout makes it fill the whole scene.

Example — updateSchema args for a 2-scene hero with a background video, a headline, and a parallaxing image:
{
  "scenes": [
    {
      "id": "s1", "height": 200,
      "elements": [
        { "id": "e1", "type": "video", "src": "https://example.com/hero.mp4", "mode": "background", "loop": true, "start": 0, "end": 1, "startY": 0, "endY": 0, "startOpacity": 1, "endOpacity": 1 },
        { "id": "e2", "type": "text", "content": "Welcome", "splitMode": "words", "start": 0, "end": 0.5, "startY": 100, "endY": 0, "startOpacity": 0, "endOpacity": 1 }
      ]
    },
    {
      "id": "s2", "height": 200,
      "elements": [
        { "id": "e3", "type": "image", "src": "https://example.com/photo.jpg", "layout": { "x": 70, "y": 50, "width": 30 }, "start": 0, "end": 1, "startY": 60, "endY": -60, "startOpacity": 0, "endOpacity": 1 }
      ]
    }
  ]
}
`;

// AI-output firewall: the live/renderable set (type-drift law) plus the
// still-recognized placeholder strings from src/types.ts. Anything outside
// both is dropped rather than passed through to the client.
const LIVE_ELEMENT_TYPES = new Set(["text", "cube", "glbObject", "image", "video"]);
const PLACEHOLDER_ELEMENT_TYPES = new Set([
  "environment",
  "object",
  "character",
  "action",
  "motion",
  "font",
  "component",
]);

function coerceNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function sanitizeElement(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  const type = typeof source.type === "string" ? source.type : "";
  if (!LIVE_ELEMENT_TYPES.has(type) && !PLACEHOLDER_ELEMENT_TYPES.has(type)) return null;

  return {
    ...source,
    id: typeof source.id === "string" && source.id ? source.id : crypto.randomUUID(),
    start: coerceNumber(source.start, 0),
    end: coerceNumber(source.end, 1),
    startY: coerceNumber(source.startY, 0),
    endY: coerceNumber(source.endY, 0),
    startOpacity: coerceNumber(source.startOpacity, 1),
    endOpacity: coerceNumber(source.endOpacity, 1),
  };
}

function sanitizeScene(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  const elements = Array.isArray(source.elements)
    ? source.elements.map(sanitizeElement).filter((el): el is Record<string, unknown> => el !== null)
    : [];

  return {
    ...source,
    id: typeof source.id === "string" && source.id ? source.id : crypto.randomUUID(),
    height: coerceNumber(source.height, 100),
    elements,
  };
}

/**
 * Runs on every updateSchema function call before it reaches the client.
 * The model can hallucinate malformed args (missing ids, out-of-range or
 * missing numerics, a type outside the live/placeholder set) — this coerces
 * the shape without importing client code (server stays self-contained;
 * the client's migrateSchema in src/schema/migrate.ts does a fuller pass
 * on load).
 */
export function sanitizeSchema(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as Record<string, unknown>).scenes)) {
    return { scenes: [] };
  }

  const source = raw as Record<string, unknown>;
  const scenes = (source.scenes as unknown[])
    .map(sanitizeScene)
    .filter((scene): scene is Record<string, unknown> => scene !== null);

  return { ...source, scenes };
}

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
      newSchema = sanitizeSchema(call.args);
    }
  }

  return { text: textResponse, newSchema };
}
