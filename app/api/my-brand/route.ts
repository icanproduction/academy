import { NextRequest, NextResponse } from "next/server";
import {
  getClientById,
  getClientICP,
  getClientProducts,
  getClientPillars,
  getTargetAudiences,
} from "@/lib/notion";

// GET /api/my-brand?clientId=xxx
// Single API call to get all brand data for client view
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

    // Fetch all data in parallel for better performance
    const [client, icp, audiences, products, pillars] = await Promise.all([
      getClientById(clientId),
      getClientICP(clientId).catch(() => null),
      getTargetAudiences(clientId).catch(() => []),
      getClientProducts(clientId).catch(() => []),
      getClientPillars(clientId).catch(() => []),
    ]);

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        client,
        icp: icp || null,
        audiences: audiences || [],
        products: products || [],
        pillars: pillars || [],
      },
    });
  } catch (error: any) {
    console.error("Error fetching brand data:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
