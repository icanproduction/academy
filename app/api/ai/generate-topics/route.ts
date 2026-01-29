import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getOrCompileContext } from "@/lib/context-compiler";

interface TopicSuggestion {
  id: string;
  title: string;
  description: string;
  angle: string;
}

// POST /api/ai/generate-topics - Generate topic suggestions
export async function POST(request: NextRequest) {
  try {
    // Check API key first
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY not configured");
      return NextResponse.json(
        { success: false, error: "AI service not configured" },
        { status: 500 }
      );
    }

    // Initialize Anthropic client inside the function
    const anthropic = new Anthropic({ apiKey });

    const {
      clientId,
      contentType,
      platforms,
      pillar,
      products,
      cachedContext,
    } = await request.json();

    console.log("Generate topics request:", { clientId, contentType, pillar: pillar?.name, products: products?.length });

    if (!clientId || !contentType || !pillar) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use cached context if available, otherwise compile fresh
    let context = cachedContext;
    if (!context) {
      try {
        const contextResult = await getOrCompileContext(clientId);
        context = contextResult.context;
        console.log("Context compiled, length:", context?.length);
      } catch (contextError: any) {
        console.error("Error compiling context:", contextError);
        // Use minimal context if compilation fails
        context = `Client ID: ${clientId}`;
      }
    }

    if (!context) {
      context = `Client ID: ${clientId}`;
    }

    // Build product highlight section
    let productSection = "";
    if (products && products.length > 0) {
      productSection = `
PRODUK YANG INGIN DI-HIGHLIGHT:
${products.map((p: any) => `- ${p.name}: ${p.description || ""}`).join("\n")}
`;
    }

    // Content type format hints
    const formatHints: Record<string, string> = {
      reels: "Video pendek 15-60 detik dengan hook kuat di 3 detik pertama",
      carousel: "Slide images dengan text overlay, 5-10 slides",
      story: "Format vertikal casual, bisa interaktif (poll/quiz)",
    };

    // System prompt - keep it concise to save tokens
    const systemPrompt = `Kamu adalah content strategist untuk brand. Generate 5 ide topic konten.

BRAND CONTEXT (RINGKAS):
${context.substring(0, 1500)}

CONTENT PILLAR: ${pillar.emoji} ${pillar.name}
Deskripsi: ${pillar.description}
${productSection}
FORMAT: ${contentType.toUpperCase()} - ${formatHints[contentType] || ""}
PLATFORM: ${platforms?.join(", ") || "Instagram"}

OUTPUT FORMAT (JSON array, tanpa markdown):
[
  {
    "id": "1",
    "title": "Judul singkat dan catchy",
    "description": "Penjelasan singkat apa yang dibahas (1-2 kalimat)",
    "angle": "Sudut pandang unik/hook utama"
  }
]

RULES:
- 5 topic berbeda, relevan dengan pillar
- Judul menarik, mudah dipahami
- Sesuaikan dengan brand voice
- Fokus pada value untuk audience
- Jika ada produk, integrasikan secara natural (tidak hard-sell)`;

    // Call Claude API with minimal tokens
    console.log("Calling Anthropic API...");
    let response;
    try {
      response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: "Generate 5 topic suggestions dalam format JSON array.",
          },
        ],
        system: systemPrompt,
      });
      console.log("Anthropic API response received");
    } catch (apiError: any) {
      console.error("Anthropic API error:", apiError.message);
      return NextResponse.json(
        { success: false, error: `AI API error: ${apiError.message}` },
        { status: 500 }
      );
    }

    // Extract response text
    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    console.log("AI response text length:", responseText.length);

    // Parse JSON from response
    let topics: TopicSuggestion[] = [];
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      let jsonString = responseText;

      // Remove markdown code blocks if present
      const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1];
      }

      // Extract JSON array
      const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        topics = JSON.parse(jsonMatch[0]);
        console.log("Parsed topics count:", topics.length);
      } else {
        console.error("No JSON array found in response:", responseText.substring(0, 200));
      }
    } catch (parseError: any) {
      console.error("Error parsing topics:", parseError.message);
      console.error("Response was:", responseText.substring(0, 500));
      // Fallback: create topics from text
      topics = [
        {
          id: "1",
          title: "Topic 1",
          description: "Gagal memparse response AI",
          angle: "Silakan coba generate ulang",
        },
      ];
    }

    // Ensure we have valid topics
    topics = topics.slice(0, 5).map((t, idx) => ({
      id: String(idx + 1),
      title: t.title || `Topic ${idx + 1}`,
      description: t.description || "",
      angle: t.angle || "",
    }));

    return NextResponse.json({
      success: true,
      topics,
      context: cachedContext ? undefined : context, // Only return context if freshly compiled
    });
  } catch (error: any) {
    console.error("Error generating topics:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Unknown error occurred" },
      { status: 500 }
    );
  }
}

// GET /api/ai/generate-topics - Health check
export async function GET() {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  return NextResponse.json({
    success: true,
    configured: hasApiKey,
    message: hasApiKey ? "AI service is configured" : "ANTHROPIC_API_KEY not set",
  });
}
