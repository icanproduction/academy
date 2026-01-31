import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  getContentWithAI,
  getClientById,
  notion,
  saveContentChatMessage,
} from "@/lib/notion";
import { getOrCompileContext } from "@/lib/context-compiler";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Helper to get pillar info
async function getPillarInfo(pillarId: string) {
  if (!pillarId) return null;
  try {
    const page = (await notion.pages.retrieve({ page_id: pillarId })) as any;
    return {
      name: page.properties["Name"]?.title?.[0]?.plain_text || "",
      emoji: page.properties["Emoji"]?.rich_text?.[0]?.plain_text || "",
      description: page.properties["Description"]?.rich_text?.[0]?.plain_text || "",
      hookStyles: page.properties["Hook Styles"]?.multi_select?.map((s: any) => s.name) || [],
      targetEmotion: page.properties["Target Emotion"]?.select?.name || "",
      ctaType: page.properties["CTA Type"]?.select?.name || "",
      dos: page.properties["Dos"]?.rich_text?.[0]?.plain_text || "",
      donts: page.properties["Donts"]?.rich_text?.[0]?.plain_text || "",
    };
  } catch {
    return null;
  }
}

// Helper to get latest review feedback
async function getLatestReviewFeedback(contentId: string): Promise<string | null> {
  try {
    const reviewDbId = process.env.NOTION_CONTENT_REVIEWS_DB_ID?.trim();
    if (!reviewDbId) return null;

    const response = await notion.databases.query({
      database_id: reviewDbId,
      filter: {
        property: "Content",
        relation: { contains: contentId },
      },
      sorts: [{ timestamp: "created_time", direction: "descending" }],
      page_size: 1,
    });

    if (response.results.length === 0) return null;

    const review = response.results[0] as any;
    const decision = review.properties["Decision"]?.select?.name;

    if (decision !== "revision") return null;

    return review.properties["Feedback"]?.rich_text?.[0]?.plain_text || null;
  } catch {
    return null;
  }
}

// Convert brief sections to text for AI context
function briefToText(sections: any[]): string {
  if (!sections || sections.length === 0) return "(Empty - no sections yet)";

  return sections
    .map((s) => {
      const fields = s.fields
        ?.map((f: any) => `  ${f.label || f.type}: ${f.value || "(empty)"}`)
        .join("\n");
      return `[${s.title}] (${s.duration || 0}s)\n${fields || "  (no fields)"}`;
    })
    .join("\n\n");
}

// POST /api/contents/[id]/ai/chat - AI chat with brief context
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentId } = await params;
    const { message, briefSections, conversationHistory } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    // Get content
    const content = await getContentWithAI(contentId);
    if (!content) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    // Get client context
    const { context } = await getOrCompileContext(content.clientId);

    // Get pillar info
    const pillar = await getPillarInfo(content.pillarId);

    // Get revision feedback if in revision status
    let revisionFeedback: string | null = null;
    if (content.status === "idea_revision" || content.status === "production_revision") {
      revisionFeedback = await getLatestReviewFeedback(contentId);
    }

    // Build conversation messages for Claude
    const messages: { role: "user" | "assistant"; content: string }[] = [];

    // Add brief state as context
    const briefText = briefToText(briefSections || []);
    messages.push({
      role: "user",
      content: `Current Brief State:\n${briefText}`,
    });
    messages.push({
      role: "assistant",
      content: "Understood, I can see the current brief.",
    });

    // Add conversation history with windowing (keep last 8 messages for context efficiency)
    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      const maxMessages = 8;
      const windowedHistory = conversationHistory.length > maxMessages
        ? conversationHistory.slice(-maxMessages)
        : conversationHistory;

      windowedHistory.forEach(
        (msg: { role: "user" | "assistant"; content: string }) => {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      );
    }

    // Add current user message
    messages.push({
      role: "user",
      content: message,
    });

    // Content type specific guidance
    const contentTypeGuide: Record<string, string> = {
      reels: `
FORMAT REELS/VIDEO:
- Hook (3-5 detik): Opening yang mencuri perhatian
- Body/Scene (15-45 detik): Isi konten utama dengan value
- CTA (3-5 detik): Call to action yang jelas
- Total durasi ideal: 30-60 detik`,
      carousel: `
FORMAT CAROUSEL:
- Slide 1: Cover yang menarik perhatian (hook visual + text)
- Slide 2-9: Content breakdown dengan value tiap slide
- Slide terakhir: CTA dan engagement prompt`,
      story: `
FORMAT STORY:
- Quick, casual, engaging
- Max 15 detik per story
- Bisa interactive (poll, question, quiz)
- Direct dan personal tone`,
    };

    // Build system prompt - Updated for conversational, interactive experience
    const systemPrompt = `Kamu adalah AI Content Strategist yang CONVERSATIONAL dan membantu develop brief konten social media secara INTERAKTIF.

BRAND & CONTEXT:
${context}

CONTENT PILLAR: ${pillar?.emoji || ""} ${pillar?.name || "Not specified"}
${pillar ? `• Tone: ${pillar.description}
• Hook Styles: ${pillar.hookStyles.join(", ")}
• Target Emotion: ${pillar.targetEmotion}
• CTA Type: ${pillar.ctaType}
• Do's: ${pillar.dos}
• Don'ts: ${pillar.donts}` : ""}

KONTEN SAAT INI:
• ID: ${content.uniqueId || content.id}
• Tipe: ${content.contentType?.toUpperCase() || "Not specified"}
• Platform: ${content.platforms?.join(", ") || "Not specified"}
• Topic: ${content.title || "(belum ada)"}
• Deskripsi: ${content.description || "(belum ada)"}

${contentTypeGuide[content.contentType as string] || ""}

${revisionFeedback ? `
⚠️ REVISION REQUEST:
"${revisionFeedback}"
Bantu address revision points ini secara spesifik.
` : ""}

RESPONSE EFFICIENCY RULES (CRITICAL):
1. DETECT INTENT FIRST:
   - Opinion/Question (menurutmu, gimana, kenapa, apa) -> Jawab singkat 2-3 kalimat MAX, TANPA structured format
   - Generate request (buatkan, generate, buat, kasih) -> Kasih options dengan preview singkat
   - Approval (oke, ok, pakai, setuju, gas, lanjut) -> Respond minimal + execute action

2. PROGRESSIVE DISCLOSURE:
   - Jangan langsung kasih semua detail
   - Kasih preview/summary dulu (1 line per option MAX)
   - Expand detail hanya jika diminta

3. SCENE/VISUAL INCLUSION - VERY IMPORTANT:
   - HANYA include scene_description jika user EXPLICITLY minta "scene", "visual", "tampilan", "breakdown"
   - Untuk request "buatkan hook" / "buatkan script" -> HANYA kasih Script field, TANPA scene_description
   - Default: TANPA scene_description kecuali diminta

4. RESPONSE LENGTH:
   - Conversational response: Max 2-3 kalimat
   - Preview/Options: Max 1 line per option di preview
   - Full generation: Sesuai kebutuhan tapi EFISIEN

CONVERSATION STYLE:
1. CONVERSATIONAL & DUA ARAH
   - Jangan langsung generate konten panjang
   - Tanya clarifying questions jika perlu
   - Pahami dulu intent user sebelum suggest

2. IDENTIFIKASI "TITIK KOSONG"
   - Lihat brief saat ini, apa yang masih kurang?
   - Proaktif suggest prioritas jika brief kosong

3. SUGGEST DULU, APPLY KEMUDIAN
   - JANGAN langsung pakai "actions" untuk modify brief
   - Kasih opsi/preview dulu dalam "suggestions"
   - Tunggu user approve dengan kata: "ok", "pakai", "apply", "setuju", "gas"

4. NATURAL PRODUCT REFERENCE
   - Integrasikan produk/service brand secara natural
   - Jangan forced mention, harus relevan dengan context

RESPONSE FORMAT (JSON only):
{
  "message": "Response conversational kamu",
  "suggestions": null atau array opsi,
  "actions": null (HANYA jika user explicitly approve)
}

SUGGESTIONS FORMAT (ketika kasih opsi):
{
  "message": "Ini ${content.contentType === 'reels' ? '3' : '2'} opsi hook, pilih yang cocok:",
  "suggestions": [
    {
      "label": "Opsi 1: Problem Hook",
      "preview": "Buka dengan pain point audience...",
      "sections": [
        {
          "title": "Hook",
          "duration": 3,
          "fields": [
            {"type": "script", "label": "Script", "value": "Script text here..."}
          ]
        }
      ]
    }
  ],
  "actions": null
}

NOTE: scene_description field HANYA ditambahkan jika user explicitly minta visual/scene!

ACTIONS FORMAT (HANYA jika user approve dengan kata: "ok", "pakai", "apply", "setuju", "gas"):
{
  "message": "Siap! Brief updated dengan opsi yang dipilih 👍",
  "suggestions": null,
  "actions": [
    {
      "type": "create_section",
      "section_title": "Hook",
      "duration": 3,
      "fields": [...]
    }
  ]
}

FIELD TYPES: scene_description, script, editor_notes, duration, transition, text_overlay, audio_notes, product_mention, cta

INSTRUKSI PENTING:
- Bahasa: Indonesian, santai tapi profesional
- SELALU tanya dulu kalau request masih ambigu
- Generate konten dalam "suggestions", TIDAK langsung "actions"
- Hanya pakai "actions" kalau user EXPLICITLY setuju
- Short, punchy responses - jangan overwhelming
- Reference product HANYA kalau natural dan relevan`;

    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      system: systemPrompt,
      messages: messages,
    });

    // Extract response text
    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Try to parse JSON response
    let parsedResponse = {
      message: responseText,
      suggestions: null as any,
      actions: null as any,
    };

    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If parsing fails, use raw text as message
      parsedResponse = {
        message: responseText,
        suggestions: null,
        actions: null,
      };
    }

    // Save to chat history (async, don't block)
    const nextSeq = (conversationHistory?.length || 0) + 1;
    Promise.all([
      saveContentChatMessage(contentId, content.clientId, "user", message, nextSeq),
      saveContentChatMessage(
        contentId,
        content.clientId,
        "assistant",
        parsedResponse.message,
        nextSeq + 1
      ),
    ]).catch(console.error);

    return NextResponse.json({
      success: true,
      ...parsedResponse,
    });
  } catch (error: any) {
    console.error("Error in AI chat:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
