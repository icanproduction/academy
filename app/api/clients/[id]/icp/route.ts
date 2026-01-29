import { NextRequest, NextResponse } from "next/server";
import { getClientICP, createClientICP, updateClientICP } from "@/lib/notion";

// GET /api/clients/[id]/icp - Get client ICP
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const icp = await getClientICP(clientId);
    return NextResponse.json({ success: true, data: icp });
  } catch (error: any) {
    console.error("Error fetching ICP:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/clients/[id]/icp - Create ICP (if not exists)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const body = await request.json();

    // Check if ICP already exists
    const existing = await getClientICP(clientId);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "ICP already exists for this client" },
        { status: 400 }
      );
    }

    const id = await createClientICP(clientId, body);
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("Error creating ICP:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id]/icp - Update ICP
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const body = await request.json();

    // Get existing ICP
    const existing = await getClientICP(clientId);
    if (!existing) {
      // Create if not exists
      const id = await createClientICP(clientId, body);
      return NextResponse.json({ success: true, id, created: true });
    }

    await updateClientICP(existing.id, body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating ICP:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
