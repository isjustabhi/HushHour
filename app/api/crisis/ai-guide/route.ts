import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CrisisGuideRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(20),
});

const AI_GUIDE_SYSTEM_PROMPT = `You are HushHour's AI Safety Guide.

Your role:
- Be calm, warm, validating, and concise.
- Listen first. Reflect what the user said in plain words.
- Never minimize pain. Never shame. Never argue.
- Offer immediate grounding steps when useful (breathing, feet on floor, sip water, text a trusted person).
- Encourage connection to human support quickly and clearly.

Crisis protocol:
- If user indicates self-harm, suicidality, or immediate danger, explicitly recommend 988 (US) and emergency services if immediate danger.
- Suggest texting HOME to 741741 and contacting campus counseling.
- Keep supporting language present while routing to humans.

Boundaries:
- Do not claim to be a therapist.
- Do not provide dangerous instructions.
- Do not output JSON.
- Keep responses under 120 words unless user asks for more.
`;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = CrisisGuideRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const stream = await anthropic.messages.stream({
      model: "claude-3-5-haiku-latest",
      temperature: 0.2,
      max_tokens: 400,
      system: AI_GUIDE_SYSTEM_PROMPT,
      messages: parsed.data.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-cache",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI guide failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
