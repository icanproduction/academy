import { NextRequest, NextResponse } from "next/server";
import { getClientProducts, createClientProduct } from "@/lib/notion";

// GET /api/clients/[id]/products - Get all products for a client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const isFeatured = searchParams.get("isFeatured");

    const filters: { isActive?: boolean; isFeatured?: boolean } = {};
    if (isActive !== null) filters.isActive = isActive === "true";
    if (isFeatured !== null) filters.isFeatured = isFeatured === "true";

    const products = await getClientProducts(clientId, Object.keys(filters).length > 0 ? filters : undefined);
    return NextResponse.json(products);
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/clients/[id]/products - Create new product
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const body = await request.json();

    const { productName, category, description, keyBenefits, priceType, priceMin, priceMax, usp, isFeatured } = body;

    if (!productName) {
      return NextResponse.json(
        { success: false, error: "Product name is required" },
        { status: 400 }
      );
    }

    const productId = await createClientProduct(clientId, {
      productName,
      category: category || "Product",
      description: description || "",
      keyBenefits: keyBenefits || "",
      priceType: priceType || "Fixed",
      priceMin: priceMin || 0,
      priceMax: priceMax || 0,
      usp: usp || "",
      isFeatured: isFeatured ?? false,
    });

    return NextResponse.json({ success: true, id: productId });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
