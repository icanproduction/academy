import { NextRequest, NextResponse } from "next/server";
import { getTargetAudiences, createTargetAudience } from "@/lib/notion";

// GET /api/clients/[id]/audience - Get all target audiences for a client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const audiences = await getTargetAudiences(clientId);
    return NextResponse.json({ success: true, data: audiences });
  } catch (error: any) {
    console.error("Error fetching target audiences:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/clients/[id]/audience - Create new target audience segment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const body = await request.json();

    if (!body.segmentName) {
      return NextResponse.json(
        { success: false, error: "Segment name is required" },
        { status: 400 }
      );
    }

    const id = await createTargetAudience(clientId, body);
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("Error creating target audience:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
