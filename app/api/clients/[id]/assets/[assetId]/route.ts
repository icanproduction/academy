import { NextRequest, NextResponse } from "next/server";
import { updateClientAsset, deleteClientAsset } from "@/lib/notion";

// PUT /api/clients/[id]/assets/[assetId] - Update asset
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    const { assetId } = await params;
    const body = await request.json();

    await updateClientAsset(assetId, body);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating asset:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id]/assets/[assetId] - Soft delete asset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    const { assetId } = await params;

    await deleteClientAsset(assetId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting asset:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
