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
            pin: { type: Type.BOOLEAN },
            elements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["text", "cube", "glbObject", "image", "video", "marquee", "carousel", "counter", "svg", "grid", "gallery", "lottie"] },
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
                  items: { type: Type.ARRAY, items: { type: Type.STRING } },
                  speedPxPerSec: { type: Type.NUMBER },
                  direction: { type: Type.STRING, enum: ["left", "right"] },
                  gapRem: { type: Type.NUMBER },
                  slides: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        src: { type: Type.STRING },
                        caption: { type: Type.STRING },
                      },
                      required: ["id", "src"],
                    },
                  },
                  autoplayMs: { type: Type.NUMBER },
                  showDots: { type: Type.BOOLEAN },
                  showArrows: { type: Type.BOOLEAN },
                  from: { type: Type.NUMBER },
                  to: { type: Type.NUMBER },
                  decimals: { type: Type.NUMBER },
                  prefix: { type: Type.STRING },
                  suffix: { type: Type.STRING },
                  paths: { type: Type.ARRAY, items: { type: Type.STRING } },
                  viewBox: { type: Type.STRING },
                  strokeColor: { type: Type.STRING },
                  strokeWidth: { type: Type.NUMBER },
                  columns: { type: Type.NUMBER },
                  cards: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        body: { type: Type.STRING },
                        imageSrc: { type: Type.STRING },
                      },
                      required: ["id", "title"],
                    },
                  },
                  images: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        src: { type: Type.STRING },
                        alt: { type: Type.STRING },
                      },
                      required: ["id", "src"],
                    },
                  },
                  lightbox: { type: Type.BOOLEAN },
                  playMode: { type: Type.STRING, enum: ["scrub", "autoplay"] },
                  trigger: { type: Type.STRING, enum: ["scrub", "appear"] },
                  appear: {
                    type: Type.OBJECT,
                    properties: {
                      preset: { type: Type.STRING, enum: ["fade", "slide-up", "slide-left", "scale", "spring"] },
                      duration: { type: Type.NUMBER },
                      delay: { type: Type.NUMBER },
                      once: { type: Type.BOOLEAN },
                    },
                  },
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
   - marquee: infinite scrolling text/logo strip. Required: items (array of short strings). Optional: speedPxPerSec (default 80), direction ("left" | "right", default "left"), gapRem (default 3). Use for client-logo bands, tickers.
   - carousel: swipeable image slider with dots/arrows. Required: slides (array of { id, src, caption? } — always give each slide a unique id). Optional: autoplayMs (ms between auto-advances, default 0/off), showDots (default true), showArrows (default true). Use for image galleries, product shots, testimonial rotations.
   - counter: animated number that counts with scroll (or once on appear). Required: from, to. Optional: decimals (default 0), prefix, suffix. Use for stats bands ("4,000,000+ users").
   - svg: line-art that draws itself as you scroll. Required: paths (array of SVG path "d" strings). Optional: viewBox (default "0 0 100 100"), strokeColor (default "#2dd4bf"), strokeWidth (default 2). Use for underlines, diagrams, decorative strokes.
   - grid: responsive card grid. Required: cards [{id,title,body?,imageSrc?}]. Use for feature grids, service lists, team cards. Optional: columns (1-6, default 3).
   - gallery: image grid with a click-to-zoom lightbox. Required: images [{id,src,alt?}]. Use for photo grids, portfolios, product shots. Optional: columns (1-6, default 3), lightbox (default true).
   - lottie: a Lottie/After Effects JSON animation. Required: src (URL to a .json file), playMode ("scrub" | "autoplay"). Optional: loop (autoplay mode only, default true). "scrub" ties animation frames to scroll; "autoplay" plays once the element enters the viewport. Use for icon animations, illustrated micro-interactions.
5. If creating new elements, give them a unique UUID for the id.
6. Every element may include an optional layout: { x, y, width, anchor, z }. x/y/width are percentages (0-100); anchor is "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right" (default "center"). Omit layout to keep an element centered at its default size — for a background video, omitting layout makes it fill the whole scene.
7. A scene may include pin: boolean. Omit it (or set true) for a pinned scrubbed set-piece — the scene holds on screen while its elements' start/end scrub tweens play, the current default. Set pin: false for a normal flowing website section whose content should scroll past like a regular page section instead of holding.
8. In a pin: false flow scene, give elements trigger: "appear" instead of relying on start/end scrub — appear elements fade/slide/scale into place once as they scroll into view. Pair it with appear: { preset, duration, delay, once }. preset is "fade" | "slide-up" | "slide-left" | "scale" | "spring" (default reveal direction/style); duration and delay are seconds (defaults 0.8 and 0); once (default true) plays the reveal a single time — set false to replay every time the element re-enters view. trigger defaults to "scrub" (the existing start/end scroll-scrub behavior) when omitted.

Example — updateSchema args for a 2-scene pinned hero (background video, headline, parallaxing image) followed by a pin:false flow section with an appear-revealed card:
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
    },
    {
      "id": "s3", "height": 120, "pin": false,
      "elements": [
        { "id": "e4", "type": "text", "content": "Feature One", "trigger": "appear", "appear": { "preset": "slide-up", "duration": 0.6 }, "layout": { "x": 20, "y": 50, "width": 25 }, "start": 0, "end": 1, "startY": 0, "endY": 0, "startOpacity": 1, "endOpacity": 1 }
      ]
    }
  ]
}
`;

// AI-output firewall: the live/renderable set (type-drift law) plus the
// still-recognized placeholder strings from src/types.ts. Anything outside
// both is dropped rather than passed through to the client.
const LIVE_ELEMENT_TYPES = new Set(["text", "cube", "glbObject", "image", "video", "marquee", "carousel", "counter", "svg", "grid", "gallery", "lottie"]);
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
  // lottie has no fallback content without a src — drop the element rather
  // than emit an empty animation the AI never actually specified.
  if (type === "lottie" && (typeof source.src !== "string" || !source.src.trim())) return null;

  const sanitized: Record<string, unknown> = {
    ...source,
    id: typeof source.id === "string" && source.id ? source.id : crypto.randomUUID(),
    start: coerceNumber(source.start, 0),
    end: coerceNumber(source.end, 1),
    startY: coerceNumber(source.startY, 0),
    endY: coerceNumber(source.endY, 0),
    startOpacity: coerceNumber(source.startOpacity, 1),
    endOpacity: coerceNumber(source.endOpacity, 1),
  };

  if (type === "marquee") {
    const items = Array.isArray(source.items)
      ? source.items.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];
    sanitized.items = items.length > 0 ? items : ["MARQUEE"];
  }

  if (type === "carousel") {
    const slides = Array.isArray(source.slides)
      ? source.slides
          .filter((slide): slide is Record<string, unknown> => !!slide && typeof slide === "object")
          .map(slide => {
            const sanitizedSlide: Record<string, unknown> = {
              id: typeof slide.id === "string" && slide.id ? slide.id : crypto.randomUUID(),
              src: typeof slide.src === "string" ? slide.src : "",
            };
            if (typeof slide.caption === "string") {
              sanitizedSlide.caption = slide.caption;
            }
            return sanitizedSlide;
          })
      : [];
    sanitized.slides = slides;
  }

  if (type === "counter") {
    sanitized.from = coerceNumber(source.from, 0);
    sanitized.to = coerceNumber(source.to, 100);
  }

  if (type === "svg") {
    const paths = Array.isArray(source.paths)
      ? source.paths.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];
    sanitized.paths = paths.length > 0 ? paths : ["M10 50 L90 50"];
  }

  if (type === "grid") {
    const cards = Array.isArray(source.cards)
      ? source.cards
          .filter((card): card is Record<string, unknown> => !!card && typeof card === "object")
          .map(card => {
            const sanitizedCard: Record<string, unknown> = {
              id: typeof card.id === "string" && card.id ? card.id : crypto.randomUUID(),
              title: typeof card.title === "string" ? card.title : "",
            };
            if (typeof card.body === "string") {
              sanitizedCard.body = card.body;
            }
            if (typeof card.imageSrc === "string") {
              sanitizedCard.imageSrc = card.imageSrc;
            }
            return sanitizedCard;
          })
      : [];
    sanitized.cards = cards;
    if (typeof source.columns === "number") {
      sanitized.columns = Math.min(6, Math.max(1, Math.round(source.columns)));
    }
  }

  if (type === "gallery") {
    const images = Array.isArray(source.images)
      ? source.images
          .filter((image): image is Record<string, unknown> => !!image && typeof image === "object")
          .map(image => {
            const sanitizedImage: Record<string, unknown> = {
              id: typeof image.id === "string" && image.id ? image.id : crypto.randomUUID(),
              src: typeof image.src === "string" ? image.src : "",
            };
            if (typeof image.alt === "string") {
              sanitizedImage.alt = image.alt;
            }
            return sanitizedImage;
          })
      : [];
    sanitized.images = images;
    if (typeof source.columns === "number") {
      sanitized.columns = Math.min(6, Math.max(1, Math.round(source.columns)));
    }
  }

  if (type === "lottie") {
    sanitized.src = (source.src as string).trim();
    sanitized.playMode = source.playMode === "autoplay" ? "autoplay" : "scrub";
  }

  return sanitized;
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
