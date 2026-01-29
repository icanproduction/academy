import { NextRequest, NextResponse } from "next/server";
import { getReelsBriefRequests, createReelsBriefRequest } from "@/lib/notion";

// GET /api/clients/[id]/briefs - Get all briefs for a client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;

    const briefs = await getReelsBriefRequests(clientId);

    return NextResponse.json(briefs);
  } catch (error: any) {
    console.error("Error fetching briefs:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/clients/[id]/briefs - Create new brief request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const body = await request.json();

    const briefId = await createReelsBriefRequest(clientId, body);

    return NextResponse.json({ success: true, briefId });
  } catch (error: any) {
    console.error("Error creating brief:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
