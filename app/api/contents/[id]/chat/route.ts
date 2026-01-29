import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  getContentWithAI,
  updateContentAIChat,
  getClientById,
  notion,
  saveContentChatMessage,
  getContentChatHistory,
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
    };
  } catch {
    return null;
  }
}

// POST /api/contents/[id]/chat - Chat with AI for content development
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentId } = await params;
    const { message, conversationHistory } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    // Get content with AI fields
    const content = await getContentWithAI(contentId);
    if (!content) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    // Get client context for AI
    const { context } = await getOrCompileContext(content.clientId);

    // Get pillar info
    const pillar = await getPillarInfo(content.pillarId);

    // Build conversation messages for Claude
    const messages: { role: "user" | "assistant"; content: string }[] = [];

    // Add conversation history
    if (Array.isArray(conversationHistory)) {
      conversationHistory.forEach(
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
    const contentTypeGuide = {
      reels: `
FORMAT REELS/VIDEO:
- Hook (3-5 detik): Opening yang mencuri perhatian
- Body/Scene (15-45 detik): Isi konten utama dengan value
- CTA (3-5 detik): Call to action yang jelas
- Total durasi ideal: 30-60 detik
- Caption: Max 2200 karakter, mulai dengan hook text`,
      carousel: `
FORMAT CAROUSEL:
- Slide 1: Cover yang menarik perhatian (hook visual + text)
- Slide 2-9: Content breakdown dengan value tiap slide
- Slide terakhir: CTA dan engagement prompt
- Caption: Summarize value + CTA + relevant hashtags`,
      story: `
FORMAT STORY:
- Quick, casual, engaging
- Max 15 detik per story
- Bisa interactive (poll, question, quiz)
- Direct dan personal tone`,
    };

    // System prompt for content development
    const systemPrompt = `Kamu adalah AI Content Strategist untuk membantu develop ide konten social media.

CONTEXT BRAND & CLIENT:
${context}

CONTENT PILLAR:
${pillar ? `${pillar.emoji} ${pillar.name}: ${pillar.description}
Hook Styles: ${pillar.hookStyles.join(", ")}
Target Emotion: ${pillar.targetEmotion}
CTA Type: ${pillar.ctaType}` : "No pillar info"}

KONTEN YANG SEDANG DIKERJAKAN:
- Tipe: ${content.contentType?.toUpperCase()}
- Platform: ${content.platforms?.join(", ")}
- Judul/Topic: ${content.title}
- Deskripsi Awal: ${content.description || "(tidak ada)"}
- Reference: ${content.referenceLinks || "(tidak ada)"}

${contentTypeGuide[content.contentType as keyof typeof contentTypeGuide] || ""}

TUGAS UTAMA:
1. Bantu user develop ide konten ini menjadi brief yang siap produksi
2. Generate hook options yang sesuai dengan pillar dan brand voice
3. Susun struktur konten (scene by scene untuk video, slide by slide untuk carousel)
4. Buat draft caption yang engaging

PANDUAN RESPON:
- Bahasa Indonesia yang casual tapi profesional
- Berikan opsi/alternatif jika diminta
- Jelaskan reasoning di balik rekomendasi
- Sesuaikan dengan brand voice dan target audience
- Jika user minta generate sesuatu, berikan output yang lengkap dan actionable

PENTING:
- Jangan terlalu panjang lebar, fokus pada yang user butuhkan
- Jika diminta hook, berikan 2-3 alternatif
- Format output dengan jelas menggunakan headers dan bullets
- Tanyakan jika butuh klarifikasi

OUTPUT MARKERS (untuk parsing):
- Jika generate HOOK, gunakan format: [HOOK OPTIONS] ... [/HOOK]
- Jika generate STRUCTURE, gunakan format: [STRUCTURE] ... [/STRUCTURE]
- Jika generate CAPTION, gunakan format: [CAPTION] ... [/CAPTION]`;

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

    // Parse and save generated content
    const hookMatch = assistantMessage.match(/\[HOOK OPTIONS?\]([\s\S]*?)\[\/HOOK\]/i);
    const structureMatch = assistantMessage.match(/\[STRUCTURE\]([\s\S]*?)\[\/STRUCTURE\]/i);
    const captionMatch = assistantMessage.match(/\[CAPTION\]([\s\S]*?)\[\/CAPTION\]/i);

    const updates: any = {};
    if (hookMatch) updates.generatedHook = hookMatch[1].trim();
    if (structureMatch) updates.generatedStructure = structureMatch[1].trim();
    if (captionMatch) updates.generatedCaption = captionMatch[1].trim();

    // Calculate sequence number for new messages
    const existingHistory = conversationHistory || [];
    const nextSeq = existingHistory.length + 1;

    // Save messages to Notion Chat History DB (async, don't block response)
    const savePromises = [
      saveContentChatMessage(contentId, content.clientId, "user", message, nextSeq),
      saveContentChatMessage(contentId, content.clientId, "assistant", assistantMessage, nextSeq + 1),
    ];

    // Also save to content fields for quick access (limited to 2000 chars for summary)
    const newHistory = [...existingHistory,
      { role: "user", content: message },
      { role: "assistant", content: assistantMessage }
    ].slice(-20);
    updates.chatHistory = JSON.stringify(newHistory);

    // Execute saves in parallel
    await Promise.all([
      ...savePromises,
      Object.keys(updates).length > 0 ? updateContentAIChat(contentId, updates) : Promise.resolve(),
    ]);

    return NextResponse.json({
      success: true,
      response: assistantMessage,
      extracted: {
        hook: hookMatch ? hookMatch[1].trim() : null,
        structure: structureMatch ? structureMatch[1].trim() : null,
        caption: captionMatch ? captionMatch[1].trim() : null,
      },
    });
  } catch (error: any) {
    console.error("Error in content chat:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/contents/[id]/chat - Get AI chat data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentId } = await params;
    const { searchParams } = new URL(request.url);
    const fullHistory = searchParams.get("full") === "true";

    const content = await getContentWithAI(contentId);
    if (!content) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    // Get chat history - prefer from database if full history requested
    let chatHistory: { role: string; content: string }[] = [];

    if (fullHistory) {
      // Fetch from database for complete history
      const dbHistory = await getContentChatHistory(contentId);
      chatHistory = dbHistory.map((msg) => ({
        role: msg.role,
        content: msg.message,
      }));
    }

    // Fallback to JSON field if DB history is empty
    if (chatHistory.length === 0 && content.chatHistory) {
      try {
        chatHistory = JSON.parse(content.chatHistory);
      } catch {
        chatHistory = [];
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        chatHistory,
        generatedHook: content.generatedHook,
        generatedStructure: content.generatedStructure,
        generatedCaption: content.generatedCaption,
        description: content.description,
      },
    });
  } catch (error: any) {
    console.error("Error fetching chat data:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
