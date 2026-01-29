import { NextRequest, NextResponse } from "next/server";
import { updateClientProduct, deleteClientProduct } from "@/lib/notion";

// PUT /api/client-products/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    await updateClientProduct(id, body);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating client product:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/client-products/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await deleteClientProduct(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting client product:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
