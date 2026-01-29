import { NextRequest, NextResponse } from "next/server";
import { getClientByEmail } from "@/lib/notion";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email dan password harus diisi" },
        { status: 400 }
      );
    }

    // Get client from Notion by email
    const client = await getClientByEmail(email.toLowerCase());

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Email tidak ditemukan" },
        { status: 401 }
      );
    }

    // Check password (stored in Notion)
    // We need to get password from notion - let's update getClientByEmail
    const clientWithPassword = await getClientWithPassword(email.toLowerCase());

    if (!clientWithPassword || clientWithPassword.password !== password) {
      return NextResponse.json(
        { success: false, error: "Password salah" },
        { status: 401 }
      );
    }

    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        id: client.id,
        email: client.email,
        name: client.businessName,
        role: client.role || "client",
        contactPerson: client.contactPerson,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat login" },
      { status: 500 }
    );
  }
}

// Helper to get client with password
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

async function getClientWithPassword(email: string) {
  const res = await notion.databases.query({
    database_id: process.env.NOTION_CLIENTS_DB_ID!,
    filter: { property: "Email", email: { equals: email } },
  });

  if (res.results.length === 0) return null;

  const page = res.results[0] as any;
  return {
    id: page.id,
    email: page.properties["Email"]?.email || "",
    password: page.properties["Password"]?.rich_text?.[0]?.plain_text || "",
    businessName: page.properties["Name"]?.title?.[0]?.plain_text || "",
    role: page.properties["Role"]?.select?.name || "client",
    contactPerson: page.properties["Contact Person"]?.rich_text?.[0]?.plain_text || "",
  };
}
