import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return errorResponse(
      "ANTHROPIC_API_KEY is not set. Add it to your environment variables.",
      400
    );
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let messages: unknown;
  try {
    ({ messages } = await req.json());
  } catch {
    return errorResponse("Invalid request body.", 400);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let stream: any;
  try {
    stream = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: messages as any,
      stream: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error from Anthropic API.";
    return errorResponse(message, 502);
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(event.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
