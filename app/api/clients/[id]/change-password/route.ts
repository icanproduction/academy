import { NextRequest, NextResponse } from "next/server";
import { notion, DB } from "@/lib/notion";

// POST /api/clients/[id]/change-password - Change client password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Password saat ini dan password baru wajib diisi" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Get current client data
    const page = await notion.pages.retrieve({ page_id: id }) as any;

    // Get current password from Notion
    const storedPassword = page.properties.Password?.rich_text?.[0]?.plain_text || "";

    // Verify current password
    if (storedPassword !== currentPassword) {
      return NextResponse.json(
        { success: false, error: "Password saat ini salah" },
        { status: 400 }
      );
    }

    // Update password in Notion
    await notion.pages.update({
      page_id: id,
      properties: {
        Password: { rich_text: [{ text: { content: newPassword } }] },
      },
    });

    return NextResponse.json({ success: true, message: "Password berhasil diubah" });
  } catch (error: any) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
