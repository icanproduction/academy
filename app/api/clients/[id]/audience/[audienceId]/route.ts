import { NextRequest, NextResponse } from "next/server";
import { updateTargetAudience, deleteTargetAudience } from "@/lib/notion";

// PUT /api/clients/[id]/audience/[audienceId] - Update target audience
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; audienceId: string }> }
) {
  try {
    const { audienceId } = await params;
    const body = await request.json();

    await updateTargetAudience(audienceId, body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating target audience:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id]/audience/[audienceId] - Delete (soft) target audience
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; audienceId: string }> }
) {
  try {
    const { audienceId } = await params;

    await deleteTargetAudience(audienceId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting target audience:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
