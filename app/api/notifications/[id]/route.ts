import { NextRequest, NextResponse } from "next/server";
import { markNotificationAsRead } from "@/lib/notion";

// PUT /api/notifications/[id] - Mark single notification as read
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await markNotificationAsRead(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
