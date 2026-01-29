import { NextRequest, NextResponse } from "next/server";
import { getContentWithAI, updateContent, deleteContent, notion } from "@/lib/notion";

// Helper to get pillar info
async function getPillarInfo(pillarId: string) {
  if (!pillarId) return { name: "", emoji: "", color: "" };
  try {
    const page = (await notion.pages.retrieve({ page_id: pillarId })) as any;
    return {
      name: page.properties["Name"]?.title?.[0]?.plain_text || "",
      emoji: page.properties["Emoji"]?.rich_text?.[0]?.plain_text || "",
      color: page.properties["Color"]?.select?.name || "",
    };
  } catch {
    return { name: "", emoji: "", color: "" };
  }
}

// GET /api/contents/[id] - Get content detail with pillar info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const content = await getContentWithAI(id);

    if (!content) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    // Get pillar info
    const pillar = await getPillarInfo(content.pillarId);

    return NextResponse.json({
      success: true,
      data: {
        ...content,
        pillarName: pillar.name,
        pillarEmoji: pillar.emoji,
        pillarColor: pillar.color,
      },
    });
  } catch (error: any) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/contents/[id] - Update content
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    await updateContent(id, body);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating content:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/contents/[id] - Delete (archive) content
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteContent(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting content:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
