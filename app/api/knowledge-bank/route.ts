import { NextRequest, NextResponse } from "next/server";
import { getKnowledgeBank, createKnowledgeBankItem } from "@/lib/notion";

// GET /api/knowledge-bank?clientId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const includeInBrief = searchParams.get("includeInBrief");
    const isActive = searchParams.get("isActive");

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "clientId is required" },
        { status: 400 }
      );
    }

    const filters: { includeInBrief?: boolean; isActive?: boolean } = {};
    if (includeInBrief !== null) filters.includeInBrief = includeInBrief === "true";
    if (isActive !== null) filters.isActive = isActive === "true";

    const items = await getKnowledgeBank(clientId, Object.keys(filters).length > 0 ? filters : undefined);

    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    console.error("Error fetching knowledge bank:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/knowledge-bank
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

    const itemId = await createKnowledgeBankItem(clientId, data);

    return NextResponse.json({ success: true, id: itemId });
  } catch (error: any) {
    console.error("Error creating knowledge bank item:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
