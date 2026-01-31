import { NextRequest, NextResponse } from "next/server";
import { notion } from "@/lib/notion";

// GET /api/contents/[id]/brief - Get brief sections
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentId } = await params;

    const page = (await notion.pages.retrieve({
      page_id: contentId,
    })) as any;

    const briefSectionsRaw =
      page.properties["Brief Sections"]?.rich_text?.[0]?.plain_text || "[]";

    let sections = [];
    try {
      sections = JSON.parse(briefSectionsRaw);
    } catch {
      sections = [];
    }

    return NextResponse.json({
      success: true,
      sections,
    });
  } catch (error: any) {
    console.error("Error fetching brief:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/contents/[id]/brief - Update brief sections
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentId } = await params;
    const { sections } = await request.json();

    // Validate sections
    if (!Array.isArray(sections)) {
      return NextResponse.json(
        { success: false, error: "Sections must be an array" },
        { status: 400 }
      );
    }

    // Convert to JSON string (Notion rich_text has 2000 char limit per block)
    const sectionsJson = JSON.stringify(sections);

    // If content is too long, we need to split it
    // For now, we'll store as-is and handle truncation if needed
    const maxLength = 2000;
    const truncated = sectionsJson.length > maxLength;

    await notion.pages.update({
      page_id: contentId,
      properties: {
        "Brief Sections": {
          rich_text: [
            {
              type: "text",
              text: {
                content: truncated
                  ? sectionsJson.substring(0, maxLength)
                  : sectionsJson,
              },
            },
          ],
        },
      },
    });

    // If truncated, we should warn but still save
    if (truncated) {
      console.warn(
        `Brief sections for ${contentId} truncated to ${maxLength} chars`
      );
    }

    return NextResponse.json({
      success: true,
      truncated,
    });
  } catch (error: any) {
    console.error("Error updating brief:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
