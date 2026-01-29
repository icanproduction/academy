import { NextRequest, NextResponse } from "next/server";
import { getClientById, notion } from "@/lib/notion";

// GET /api/clients/[id] - Get single client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await getClientById(id);
    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(client);
  } catch (error: any) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id] - Update client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const props: any = {};

    if (body.name !== undefined) props["Name"] = { title: [{ text: { content: body.name } }] };
    if (body.contactPerson !== undefined) props["Contact Person"] = { rich_text: [{ text: { content: body.contactPerson } }] };
    if (body.email !== undefined) props["Email"] = { email: body.email };
    if (body.phone !== undefined) props["Phone"] = { phone_number: body.phone || null };
    if (body.industry !== undefined) props["Industry"] = { rich_text: [{ text: { content: body.industry } }] };
    if (body.status !== undefined) props["Status"] = { select: { name: body.status } };
    if (body.startDate !== undefined) props["Start Date"] = { date: { start: body.startDate } };
    if (body.endDate !== undefined) props["End Date"] = { date: { start: body.endDate } };
    if (body.notes !== undefined) props["Notes"] = { rich_text: [{ text: { content: body.notes } }] };

    await notion.pages.update({ page_id: id, properties: props });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Archive client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await notion.pages.update({
      page_id: id,
      archived: true,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
