import { NextRequest, NextResponse } from "next/server";
import { getClientProducts, createClientProduct } from "@/lib/notion";

// GET /api/client-products?clientId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const isActive = searchParams.get("isActive");
    const isFeatured = searchParams.get("isFeatured");

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "clientId is required" },
        { status: 400 }
      );
    }

    const filters: { isActive?: boolean; isFeatured?: boolean } = {};
    if (isActive !== null) filters.isActive = isActive === "true";
    if (isFeatured !== null) filters.isFeatured = isFeatured === "true";

    const products = await getClientProducts(clientId, Object.keys(filters).length > 0 ? filters : undefined);

    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    console.error("Error fetching client products:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/client-products
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

    const productId = await createClientProduct(clientId, data);

    return NextResponse.json({ success: true, id: productId });
  } catch (error: any) {
    console.error("Error creating client product:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
