import { NextRequest, NextResponse } from "next/server";
import { getKnowledgeBank, createKnowledgeBankItem, KnowledgeBankItem } from "@/lib/notion";

// GET /api/clients/[id]/knowledge-bank - Get all knowledge bank items for a client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const { searchParams } = new URL(request.url);
    const includeInBrief = searchParams.get("includeInBrief");
    const isActive = searchParams.get("isActive");

    const filters: { includeInBrief?: boolean; isActive?: boolean } = {};
    if (includeInBrief !== null) filters.includeInBrief = includeInBrief === "true";
    if (isActive !== null) filters.isActive = isActive === "true";

    const items = await getKnowledgeBank(clientId, Object.keys(filters).length > 0 ? filters : undefined);
    return NextResponse.json(items);
  } catch (error: any) {
    console.error("Error fetching knowledge bank:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/clients/[id]/knowledge-bank - Create new knowledge bank item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const body = await request.json();

    const { title, content, category, priority, includeInBrief, isActive } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: "Title and content are required" },
        { status: 400 }
      );
    }

    const itemId = await createKnowledgeBankItem(clientId, {
      title,
      content,
      category: category || "Other",
      priority: priority || 99,
      includeInBrief: includeInBrief ?? true,
      isActive: isActive ?? true,
    });

    return NextResponse.json({ success: true, id: itemId });
  } catch (error: any) {
    console.error("Error creating knowledge bank item:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
