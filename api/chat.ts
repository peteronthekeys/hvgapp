import { runChat, ChatRequestBody } from "../server/gemini";

// Vercel serverless function (Node runtime, Web handler signature).
// Local dev uses the same runChat via server.ts's Express route instead.
export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as ChatRequestBody;
    if (!body || typeof body.message !== "string") {
      return Response.json({ error: "message is required" }, { status: 400 });
    }
    const result = await runChat(body);
    return Response.json(result);
  } catch (error) {
    console.error("Chat Error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}
