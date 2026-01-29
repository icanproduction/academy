import { NextRequest, NextResponse } from "next/server";
import { getContents, createContent, getClientPillars, ContentType, ContentStatus, ContentPlatform } from "@/lib/notion";

// GET /api/contents - List contents with pillar info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId") || undefined;
    const status = searchParams.get("status") as ContentStatus | undefined;
    const contentType = searchParams.get("type") as ContentType | undefined;
    const platform = searchParams.get("platform") as ContentPlatform | undefined;

    if (!clientId) {
      return NextResponse.json([]);
    }

    // Fetch contents and pillars in parallel for better performance
    const [contents, pillars] = await Promise.all([
      getContents(clientId, { status, contentType, platform }),
      getClientPillars(clientId),
    ]);

    // Map pillar info to contents
    const pillarsMap = new Map(pillars.map(p => [p.id, p]));

    const enrichedContents = contents.map(content => {
      const pillar = pillarsMap.get(content.pillarId);
      return {
        ...content,
        pillarName: pillar?.name || "",
        pillarEmoji: pillar?.emoji || "📌",
        pillarColor: pillar?.color || "blue",
      };
    });

    // Return array directly for compatibility
    return NextResponse.json(enrichedContents);
  } catch (error: any) {
    console.error("Error fetching contents:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/contents - Create content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, ...data } = body;

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "clientId is required" },
        { status: 400 }
      );
    }

    const contentId = await createContent(clientId, data);

    return NextResponse.json({ success: true, id: contentId });
  } catch (error: any) {
    console.error("Error creating content:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
