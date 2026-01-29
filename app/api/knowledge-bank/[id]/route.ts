import { NextRequest, NextResponse } from "next/server";
import { updateKnowledgeBankItem, deleteKnowledgeBankItem } from "@/lib/notion";

// PUT /api/knowledge-bank/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    await updateKnowledgeBankItem(id, body);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating knowledge bank item:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/knowledge-bank/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await deleteKnowledgeBankItem(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting knowledge bank item:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
