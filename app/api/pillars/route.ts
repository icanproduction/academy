import { NextRequest, NextResponse } from "next/server";
import { getClientPillars, createPillar } from "@/lib/notion";

// GET /api/pillars - Get pillars for a client
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "clientId is required" },
        { status: 400 }
      );
    }

    const pillars = await getClientPillars(clientId);

    return NextResponse.json({ success: true, data: pillars });
  } catch (error: any) {
    console.error("Error fetching pillars:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/pillars - Create pillar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, ...data } = body;

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "clientId is required" },
        { status: 400 }
      );
    }

    const pillarId = await createPillar(clientId, data);

    return NextResponse.json({ success: true, id: pillarId });
  } catch (error: any) {
    console.error("Error creating pillar:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
