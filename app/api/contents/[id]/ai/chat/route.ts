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

// Helper to extract URLs from text
function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi;
  return text.match(urlRegex) || [];
}

// Helper to fetch URL content (basic text extraction)
async function fetchUrlContent(url: string): Promise<string | null> {
  try {
    // Validate URL
    const urlObj = new URL(url);

    // Skip certain domains that won't work well
    const skipDomains = ['instagram.com', 'tiktok.com', 'facebook.com', 'twitter.com', 'x.com'];
    if (skipDomains.some(domain => urlObj.hostname.includes(domain))) {
      return `[Social media link: ${url} - tidak bisa di-fetch, tapi bisa dijadikan referensi gaya/format]`;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ICAN-Bot/1.0)',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Basic HTML to text extraction
    let text = html
      // Remove scripts and styles
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      // Remove HTML tags
      .replace(/<[^>]+>/g, ' ')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();

    // Limit to 1500 chars
    if (text.length > 1500) {
      text = text.substring(0, 1500) + '...';
    }

    return text || null;
  } catch {
    return null;
  }
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

    // Check if user message contains URLs and try to fetch content
    const urlsInMessage = extractUrls(message);
    let urlContext = "";
    if (urlsInMessage.length > 0) {
      const urlContents = await Promise.all(
        urlsInMessage.slice(0, 2).map(async (url) => {
          const content = await fetchUrlContent(url);
          return content ? `\n[URL: ${url}]\n${content}\n` : `\n[URL: ${url}] (tidak bisa diakses)\n`;
        })
      );
      urlContext = urlContents.join("");
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

    // Add current user message (with URL content if any)
    const userMessageContent = urlContext
      ? `${message}\n\n--- KONTEN DARI URL YANG DIBAGIKAN ---${urlContext}`
      : message;
    messages.push({
      role: "user",
      content: userMessageContent,
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

    // Build highlight product context
    const highlightProduct = content.description ? `\n\n🎯 HIGHLIGHT PRODUK/SERVICE UNTUK KONTEN INI: "${content.description}"
    → Konten ini WAJIB menonjolkan: ${content.description}
    → Semua hook, script, CTA harus relevan dengan highlight ini` : "";

    // Build system prompt - Updated for conversational, interactive experience
    const systemPrompt = `Kamu adalah AI Content Strategist yang CONVERSATIONAL dan membantu develop brief konten social media secara INTERAKTIF.

BRAND & CONTEXT:
${context}

═══════════════════════════════════════════════════════════════
📋 KONTEN YANG SEDANG DIKERJAKAN (SUDAH DITENTUKAN - JANGAN TANYA LAGI!)
═══════════════════════════════════════════════════════════════

Content Pillar: ${pillar?.emoji || "📌"} ${pillar?.name || "Not specified"}
${pillar ? `   → Tone/Vibe: ${pillar.description || "Sesuai brand"}
   → Hook Styles: ${pillar.hookStyles.join(", ") || "Flexible"}
   → Target Emotion: ${pillar.targetEmotion || "Engage"}
   → CTA Type: ${pillar.ctaType || "Follow/Engage"}
   → Do's: ${pillar.dos || "-"}
   → Don'ts: ${pillar.donts || "-"}` : ""}

Tipe Konten: ${content.contentType?.toUpperCase() || "Not specified"}
Platform: ${content.platforms?.join(", ") || "Not specified"}
Topic/Judul: ${content.title || "(belum ada judul)"}
${content.referenceLinks ? `Link Referensi: ${content.referenceLinks}` : ""}
${highlightProduct}

${contentTypeGuide[content.contentType as string] || ""}

${revisionFeedback ? `
⚠️ REVISION REQUEST:
"${revisionFeedback}"
Bantu address revision points ini secara spesifik.
` : ""}

═══════════════════════════════════════════════════════════════
🚫 JANGAN PERNAH TANYA HAL-HAL INI (SUDAH DIKETAHUI!)
═══════════════════════════════════════════════════════════════
- Content type (reels/carousel/story) → SUDAH: ${content.contentType}
- Platform (instagram/tiktok) → SUDAH: ${content.platforms?.join(", ")}
- Content pillar → SUDAH: ${pillar?.name || "dipilih"}
- Produk/service yang di-highlight → ${content.description ? `SUDAH: ${content.description}` : "Belum ada, BOLEH tanya"}
- Brand/bisnis apa → SUDAH dijelaskan di context
- Target audience → SUDAH dijelaskan di context

YANG BOLEH DITANYA (jika belum jelas):
- Angle/sudut pandang spesifik untuk hook
- Tone preference (lebih playful/serius)
- Detail teknis jika content.description masih kosong
- Preferensi gaya bahasa

═══════════════════════════════════════════════════════════════
RESPONSE EFFICIENCY RULES
═══════════════════════════════════════════════════════════════

1. DETECT INTENT FIRST:
   - Opinion/Question → Jawab singkat 2-3 kalimat MAX
   - Generate request (buatkan, generate, buat, kasih) → Kasih options dengan preview
   - Approval (oke, ok, pakai, setuju, gas, lanjut, apply, nomor 1/2/3) → Execute action

2. LANGSUNG KERJA - JANGAN BANYAK TANYA:
   - User bilang "buatkan hook" → LANGSUNG kasih 2-3 opsi hook
   - User bilang "generate script" → LANGSUNG kasih suggestions
   - JANGAN tanya balik "mau hook style apa?" - kamu SUDAH TAHU dari pillar!
   - Gunakan info pillar untuk guide content generation

3. SCENE/VISUAL INCLUSION:
   - HANYA include scene_description jika user EXPLICITLY minta "scene", "visual", "tampilan"
   - Default: TANPA scene_description

4. RESPONSE LENGTH:
   - Conversational: Max 2-3 kalimat
   - Preview/Options: Max 1 line per option
   - Full generation: Sesuai kebutuhan

CONVERSATION STYLE:
1. PROAKTIF & HELPFUL
   - Kamu SUDAH tahu context, langsung generate yang relevan
   - Brief kosong? Suggest mulai dari Hook sesuai pillar style

2. SUGGEST DULU, APPLY KEMUDIAN
   - Generate konten dalam "suggestions" dulu
   - Pakai "actions" HANYA jika user approve (ok, pakai, gas, setuju, apply)

3. NATURAL PRODUCT REFERENCE
   - ${content.description ? `Highlight "${content.description}" secara natural di konten` : "Integrasikan produk brand jika relevan"}

RESPONSE FORMAT (JSON only):
{
  "message": "Response conversational kamu",
  "suggestions": null atau array opsi,
  "actions": null (HANYA jika user explicitly approve)
}

SUGGESTIONS FORMAT:
{
  "message": "Ini ${content.contentType === 'reels' ? '3' : '2'} opsi hook untuk ${pillar?.name || 'konten'} kamu:",
  "suggestions": [
    {
      "label": "Opsi 1: ${pillar?.hookStyles?.[0] || 'Problem'} Hook",
      "preview": "Preview singkat...",
      "sections": [
        {
          "title": "Hook",
          "duration": 3,
          "fields": [
            {"type": "script", "label": "Script", "value": "Script text..."}
          ]
        }
      ]
    }
  ],
  "actions": null
}

ACTIONS FORMAT (HANYA jika user approve):
{
  "message": "Siap! Brief updated 👍",
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

INSTRUKSI FINAL:
- Bahasa Indonesia, santai tapi profesional
- JANGAN TANYA yang sudah diketahui
- LANGSUNG generate suggestions saat diminta
- Gunakan pillar info untuk guide style
- Reference highlight product: ${content.description || "(tidak ada)"}
- Short, punchy responses`;

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
