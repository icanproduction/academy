import { NextRequest, NextResponse } from "next/server";
import { getClientICP, createClientICP } from "@/lib/notion";

// GET /api/client-icp?clientId=xxx
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

    const icp = await getClientICP(clientId);

    return NextResponse.json({ success: true, data: icp });
  } catch (error: any) {
    console.error("Error fetching client ICP:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/client-icp
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

    const icpId = await createClientICP(clientId, data);

    return NextResponse.json({ success: true, id: icpId });
  } catch (error: any) {
    console.error("Error creating client ICP:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
