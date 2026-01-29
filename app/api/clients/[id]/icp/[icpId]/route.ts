import { NextRequest, NextResponse } from "next/server";
import { updateClientICP } from "@/lib/notion";

// PUT /api/clients/[id]/icp/[icpId] - Update ICP
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; icpId: string }> }
) {
  try {
    const { icpId } = await params;
    const body = await request.json();

    await updateClientICP(icpId, body);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating ICP:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
