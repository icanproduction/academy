import { NextRequest, NextResponse } from "next/server";
import { getClientAssets, createClientAsset, ClientAsset } from "@/lib/notion";

// GET /api/client/assets - Get all assets for a client
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const assetType = searchParams.get("assetType") || undefined;

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "Client ID is required" },
        { status: 400 }
      );
    }

    const assets = await getClientAssets(clientId, { assetType });
    return NextResponse.json({ success: true, assets });
  } catch (error: any) {
    console.error("Error fetching assets:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/client/assets - Create a new asset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, assetName, assetType, url, description } = body;

    if (!clientId || !assetName || !url) {
      return NextResponse.json(
        { success: false, error: "Client ID, asset name, and URL are required" },
        { status: 400 }
      );
    }

    const assetId = await createClientAsset(clientId, {
      assetName,
      assetType: assetType || "Other",
      url,
      description: description || "",
    });

    return NextResponse.json({ success: true, assetId });
  } catch (error: any) {
    console.error("Error creating asset:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
