import { NextRequest, NextResponse } from "next/server";
import { updateKnowledgeBankItem, deleteKnowledgeBankItem } from "@/lib/notion";

// PUT /api/clients/[id]/knowledge-bank/[itemId] - Update knowledge bank item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();

    await updateKnowledgeBankItem(itemId, body);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating knowledge bank item:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id]/knowledge-bank/[itemId] - Soft delete knowledge bank item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;

    await deleteKnowledgeBankItem(itemId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting knowledge bank item:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
