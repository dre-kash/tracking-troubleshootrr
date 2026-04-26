import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return errorResponse(
      "GEMINI_API_KEY is not set. Add it to your environment variables.",
      400
    );
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  let messages: { role: string; content: string }[];
  try {
    ({ messages } = await req.json());
  } catch {
    return errorResponse("Invalid request body.", 400);
  }

  // Convert to Gemini format: role is "user" | "model", content goes in parts
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const lastMessage = messages[messages.length - 1];

  const chat = model.startChat({ history });

  let streamResult: Awaited<ReturnType<typeof chat.sendMessageStream>>;
  try {
    streamResult = await chat.sendMessageStream(lastMessage.content);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error from Gemini API.";
    return errorResponse(message, 502);
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of streamResult.stream) {
        const text = chunk.text();
        if (text) controller.enqueue(encoder.encode(text));
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

