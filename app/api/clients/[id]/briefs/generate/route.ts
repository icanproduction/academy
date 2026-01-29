import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  getClientById,
  getClientPillarsExtended,
  getClientProducts,
  createReelsBriefRequest,
  updateReelsBriefRequest,
} from "@/lib/notion";
import { getOrCompileContext } from "@/lib/context-compiler";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// POST /api/clients/[id]/briefs/generate - Generate a new brief
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const body = await request.json();

    const { pillarId, productIds, topic, keyMessage, duration, referenceLinks, notes } = body;

    if (!pillarId || !topic || !keyMessage) {
      return NextResponse.json(
        { success: false, error: "Pillar, topic, and key message are required" },
        { status: 400 }
      );
    }

    // Get client context
    const compiledContext = await getOrCompileContext(clientId);

    // Get pillar details
    const pillars = await getClientPillarsExtended(clientId);
    const pillar = pillars.find((p) => p.id === pillarId);

    if (!pillar) {
      return NextResponse.json(
        { success: false, error: "Pillar not found" },
        { status: 404 }
      );
    }

    // Get selected products
    let productsList = "";
    if (productIds && productIds.length > 0) {
      const products = await getClientProducts(clientId, { isActive: true });
      const selectedProducts = products.filter((p) => productIds.includes(p.id));
      productsList = selectedProducts.map((p) => p.productName).join(", ");
    }

    // Build AI prompt
    const systemPrompt = `Kamu adalah content strategist profesional untuk brand di bawah ini. Generate Reels brief yang spesifik dan actionable dalam Bahasa Indonesia.

${compiledContext.context}

RULES:
- Buat brief yang detail dan siap dieksekusi oleh tim produksi
- Sesuaikan dengan brand voice dan target audience
- Hook harus menarik perhatian dalam 3 detik pertama
- Scene breakdown harus jelas dengan timestamp
- Caption harus engaging dan sesuai brand voice
- Sertakan hashtag yang relevan

OUTPUT FORMAT:
1. 🎯 OBJECTIVE (1-2 kalimat tujuan konten)

2. 🪝 HOOK OPTIONS (3 alternatif hook - 2 teks berbasis, 1 visual hook)

3. 🎬 SCENE BREAKDOWN (timestamp detail: visual, audio, text overlay untuk setiap scene)

4. 📝 CAPTION (caption lengkap dengan hashtag)

5. 🎵 AUDIO SUGGESTIONS (rekomendasi audio/music)

6. 📌 PRODUCTION NOTES (tips untuk produksi)`;

    const userPrompt = `BRIEF REQUEST:
Pillar: ${pillar.name} (${pillar.targetEmotion || "Educate"})
Hook style: ${pillar.hookStyles?.join(", ") || "Various"}
CTA: ${pillar.ctaType || "Follow"}
Products: ${productsList || "None"}
Topic: ${topic}
Key Message: ${keyMessage}
Duration: ${duration}
References: ${referenceLinks || "None"}
Notes: ${notes || "None"}

Generate complete Reels brief:`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    // Extract the generated text
    const generatedBrief = message.content[0].type === "text" ? message.content[0].text : "";

    // Save to Notion
    const briefId = await createReelsBriefRequest(clientId, {
      pillarId,
      productIds: productIds || [],
      topic,
      keyMessage,
      duration,
      referenceLinks: referenceLinks || "",
      notes: notes || "",
      generatedBrief,
      status: "Generated",
    });

    return NextResponse.json({
      success: true,
      briefId,
      brief: generatedBrief,
    });
  } catch (error: any) {
    console.error("Error generating brief:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
