import { NextRequest, NextResponse } from "next/server";
import { updateClientICP } from "@/lib/notion";

// PUT /api/client-icp/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    await updateClientICP(id, body);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating client ICP:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
