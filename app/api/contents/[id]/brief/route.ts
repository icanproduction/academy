import { NextRequest, NextResponse } from "next/server";
import { notion } from "@/lib/notion";

// Helper to split text into chunks of max length
function splitIntoChunks(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.substring(i, i + maxLength));
  }
  return chunks;
}

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

    // Combine all rich_text blocks into one string
    const richTextBlocks = page.properties["Brief Sections"]?.rich_text || [];
    const briefSectionsRaw = richTextBlocks
      .map((block: any) => block.plain_text || "")
      .join("");

    let sections = [];
    try {
      sections = briefSectionsRaw ? JSON.parse(briefSectionsRaw) : [];
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

    // Convert to JSON string
    const sectionsJson = JSON.stringify(sections);

    // Split into 2000 char chunks (Notion rich_text limit)
    const CHUNK_SIZE = 2000;
    const chunks = splitIntoChunks(sectionsJson, CHUNK_SIZE);

    // Convert chunks to Notion rich_text format
    const richTextBlocks = chunks.map((chunk) => ({
      type: "text" as const,
      text: { content: chunk },
    }));

    await notion.pages.update({
      page_id: contentId,
      properties: {
        "Brief Sections": {
          rich_text: richTextBlocks,
        },
      },
    });

    return NextResponse.json({
      success: true,
      charCount: sectionsJson.length,
      chunks: chunks.length,
    });
  } catch (error: any) {
    console.error("Error updating brief:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
