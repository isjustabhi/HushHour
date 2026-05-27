import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { parse } from "partial-json";
import { z } from "zod";
import { MODERATION_SYSTEM_PROMPT } from "@/lib/moderation-prompt";
import { ModerationResultSchema, RoleSchema, VibeTagSchema } from "@/lib/schemas";

const ModerateRequestSchema = z.object({
  message_body: z.string().min(1).max(1000),
  sender_role: RoleSchema,
  session_vibe_tag: VibeTagSchema.nullable(),
  recent_messages: z.array(z.string().max(1000)).max(3),
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function extractJsonObject(raw: string): string {
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return raw;
  }
  return raw.slice(firstBrace, lastBrace + 1);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = ModerateRequestSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid moderation input" }, { status: 400 });
  }

  try {
    const stream = await anthropic.messages.stream({
      model: "claude-3-5-haiku-latest",
      max_tokens: 300,
      temperature: 0,
      system: MODERATION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: JSON.stringify(parsedBody.data),
        },
      ],
    });

    let accumulatedText = "";
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        accumulatedText += event.delta.text;
      }
    }

    const rawJson = extractJsonObject(accumulatedText.trim());

    let moderationCandidate: unknown;
    try {
      moderationCandidate = JSON.parse(rawJson);
    } catch {
      moderationCandidate = parse(rawJson);
    }

    const moderationResult = ModerationResultSchema.parse(moderationCandidate);
    return NextResponse.json(moderationResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Moderation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
