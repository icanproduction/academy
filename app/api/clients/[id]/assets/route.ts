import { NextRequest, NextResponse } from "next/server";
import { getClientAssets, createClientAsset } from "@/lib/notion";

// GET /api/clients/[id]/assets - Get all assets for a client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const { searchParams } = new URL(request.url);
    const assetType = searchParams.get("type") || undefined;

    const assets = await getClientAssets(clientId, assetType ? { assetType } : undefined);
    return NextResponse.json(assets);
  } catch (error: any) {
    console.error("Error fetching assets:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/clients/[id]/assets - Create new asset
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const body = await request.json();

    const { assetName, assetType, url, description } = body;

    if (!assetName) {
      return NextResponse.json(
        { success: false, error: "Asset name is required" },
        { status: 400 }
      );
    }

    const assetId = await createClientAsset(clientId, {
      assetName,
      assetType: assetType || "Other",
      url: url || "",
      description: description || "",
    });

    return NextResponse.json({ success: true, id: assetId });
  } catch (error: any) {
    console.error("Error creating asset:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
