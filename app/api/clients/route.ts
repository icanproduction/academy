import { NextRequest, NextResponse } from "next/server";
import { getAllClients, notion, DB } from "@/lib/notion";

// GET /api/clients - Get all clients
export async function GET() {
  try {
    const clients = await getAllClients();
    return NextResponse.json(clients);
  } catch (error: any) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, contactPerson, email, phone, industry, status, role, startDate, password } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Default password if not provided
    const defaultPassword = password || "ucanwithican";

    // Check if email already exists
    const existing = await notion.databases.query({
      database_id: DB.clients,
      filter: { property: "Email", email: { equals: email } },
    });

    if (existing.results.length > 0) {
      return NextResponse.json(
        { success: false, error: "Email already exists" },
        { status: 400 }
      );
    }

    // Create client in Notion
    const page = await notion.pages.create({
      parent: { database_id: DB.clients },
      properties: {
        Name: { title: [{ text: { content: name } }] },
        "Contact Person": { rich_text: [{ text: { content: contactPerson || "" } }] },
        Email: { email: email },
        Phone: { phone_number: phone || null },
        Industry: { rich_text: [{ text: { content: industry || "" } }] },
        Status: { select: { name: status || "active" } },
        Role: { select: { name: role || "client" } },
        "Start Date": { date: { start: startDate || new Date().toISOString().split("T")[0] } },
        Password: { rich_text: [{ text: { content: defaultPassword } }] },
      },
    });

    return NextResponse.json({ success: true, id: page.id });
  } catch (error: any) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
