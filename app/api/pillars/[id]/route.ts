import { NextRequest, NextResponse } from "next/server";
import { updatePillar, deletePillar } from "@/lib/notion";

// PUT /api/pillars/[id] - Update pillar
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    await updatePillar(params.id, body);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating pillar:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/pillars/[id] - Soft delete pillar
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deletePillar(params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting pillar:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
