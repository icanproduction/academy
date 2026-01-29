import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  getBriefConversations,
  createBriefConversation,
  updateReelsBriefRequest,
  notion,
} from "@/lib/notion";
import { getOrCompileContext } from "@/lib/context-compiler";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Helper to extract text from Notion property
function getText(prop: any): string {
  if (!prop) return "";
  if (prop.type === "title") return prop.title?.[0]?.plain_text || "";
  if (prop.type === "rich_text") return prop.rich_text?.[0]?.plain_text || "";
  if (prop.type === "select") return prop.select?.name || "";
  return "";
}

// POST /api/clients/[id]/briefs/[briefId]/chat - Chat refinement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; briefId: string }> }
) {
  try {
    const { id: clientId, briefId } = await params;
    const { message, conversationHistory } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    // Get brief details
    const briefPage = (await notion.pages.retrieve({ page_id: briefId })) as any;
    const currentBrief = getText(briefPage.properties["Generated Brief"]);
    const topic = getText(briefPage.properties["Topic"]);
    const keyMessage = getText(briefPage.properties["Key Message"]);

    // Get client context for AI
    const { context } = await getOrCompileContext(clientId);

    // Build conversation messages for Claude
    const messages: { role: "user" | "assistant"; content: string }[] = [];

    // Add conversation history
    if (Array.isArray(conversationHistory)) {
      conversationHistory.forEach((msg: { role: "user" | "assistant"; content: string }) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });
    }

    // Add current user message
    messages.push({
      role: "user",
      content: message,
    });

    // System prompt for refinement
    const systemPrompt = `Kamu adalah AI asisten untuk menyempurnakan brief konten Reels Instagram.

CONTEXT BRAND & CLIENT:
${context}

BRIEF SAAT INI:
Topic: ${topic}
Key Message: ${keyMessage}
---
${currentBrief}
---

TUGAS:
1. Dengarkan feedback/permintaan revisi dari user
2. Berikan respons yang membantu dan sesuai
3. Jika user meminta perubahan spesifik pada brief, berikan versi revisi yang lengkap
4. Gunakan bahasa Indonesia yang profesional tapi friendly
5. Tetap konsisten dengan brand voice dan guidelines client

PENTING:
- Jangan mengubah struktur brief secara drastis kecuali diminta
- Pertahankan format: Hook, Scene, CTA
- Pastikan revisi tetap sesuai dengan brand guidelines
- Jika diminta mengganti hook, berikan 2-3 alternatif`;

    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      system: systemPrompt,
      messages: messages,
    });

    // Extract response text
    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Save conversation to database
    await createBriefConversation(briefId, "user", message);
    await createBriefConversation(briefId, "assistant", assistantMessage);

    // If the response contains a revised brief, update it
    // Look for markers that indicate a complete brief revision
    if (
      assistantMessage.includes("HOOK:") ||
      assistantMessage.includes("Hook:") ||
      assistantMessage.includes("SCENE") ||
      assistantMessage.includes("Scene")
    ) {
      // Extract the revised brief from the response
      // This is a simple heuristic - in production, you might want more sophisticated parsing
      const briefMatch = assistantMessage.match(
        /((?:HOOK|Hook)[:\s][\s\S]*?(?:CTA|Cta|Call to Action)[:\s][\s\S]*?)(?:\n\n|$)/i
      );
      if (briefMatch) {
        await updateReelsBriefRequest(briefId, {
          generatedBrief: briefMatch[1].trim(),
          status: "Review",
        });
      }
    }

    return NextResponse.json({
      success: true,
      response: assistantMessage,
    });
  } catch (error: any) {
    console.error("Error in brief chat:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/clients/[id]/briefs/[briefId]/chat - Get conversation history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; briefId: string }> }
) {
  try {
    const { briefId } = await params;

    const conversations = await getBriefConversations(briefId);

    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
