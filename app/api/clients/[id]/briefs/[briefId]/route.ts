import { NextRequest, NextResponse } from "next/server";
import { notion, DB, updateReelsBriefRequest } from "@/lib/notion";

// Helper to extract text from Notion property
function getText(prop: any): any {
  if (!prop) return "";
  if (prop.type === "title") return prop.title?.[0]?.plain_text || "";
  if (prop.type === "rich_text") return prop.rich_text?.[0]?.plain_text || "";
  if (prop.type === "number") return String(prop.number ?? "");
  if (prop.type === "select") return prop.select?.name || "";
  if (prop.type === "multi_select") return prop.multi_select?.map((s: any) => s.name) || [];
  if (prop.type === "date") return prop.date?.start || "";
  if (prop.type === "relation") return prop.relation?.map((r: any) => r.id) || [];
  return "";
}

// GET /api/clients/[id]/briefs/[briefId] - Get single brief
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; briefId: string }> }
) {
  try {
    const { briefId } = await params;

    const page = (await notion.pages.retrieve({ page_id: briefId })) as any;

    const brief = {
      id: page.id,
      clientId: (getText(page.properties["Client"]) as any)?.[0] || "",
      requestId: getText(page.properties["Request ID"]),
      pillarId: (getText(page.properties["Content Pillar"]) as any)?.[0] || "",
      productIds: getText(page.properties["Products"]) || [],
      topic: getText(page.properties["Topic"]),
      keyMessage: getText(page.properties["Key Message"]),
      duration: getText(page.properties["Duration"]),
      referenceLinks: getText(page.properties["Reference Links"]),
      notes: getText(page.properties["Notes"]),
      status: getText(page.properties["Status"]),
      generatedBrief: getText(page.properties["Generated Brief"]),
      finalBrief: getText(page.properties["Final Brief"]),
      createdAt: page.created_time,
    };

    return NextResponse.json(brief);
  } catch (error: any) {
    console.error("Error fetching brief:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id]/briefs/[briefId] - Update brief status or content
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; briefId: string }> }
) {
  try {
    const { briefId } = await params;
    const body = await request.json();

    await updateReelsBriefRequest(briefId, body);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating brief:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id]/briefs/[briefId] - Archive brief
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; briefId: string }> }
) {
  try {
    const { briefId } = await params;

    await notion.pages.update({
      page_id: briefId,
      archived: true,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting brief:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
