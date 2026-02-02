import { NextRequest, NextResponse } from "next/server";
import { getNotifications, createNotification, markAllNotificationsAsRead, getUnreadNotificationCount } from "@/lib/notion";

// GET /api/notifications - Get notifications for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get("recipientId");
    const recipientType = searchParams.get("recipientType") as "admin" | "client";
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const countOnly = searchParams.get("countOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!recipientType) {
      return NextResponse.json(
        { success: false, error: "Recipient type is required" },
        { status: 400 }
      );
    }

    // For client, recipientId is required
    if (recipientType === "client" && !recipientId) {
      return NextResponse.json(
        { success: false, error: "Recipient ID is required for client" },
        { status: 400 }
      );
    }

    // If only count is needed
    if (countOnly) {
      const count = await getUnreadNotificationCount(recipientId || "", recipientType);
      return NextResponse.json({ success: true, count });
    }

    const notifications = await getNotifications(recipientId || "", recipientType, {
      unreadOnly,
      limit,
    });

    return NextResponse.json({ success: true, notifications });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      type,
      message,
      recipientId,
      recipientType,
      senderName,
      senderType,
      contentId,
      contentTitle,
      clientId,
      linkUrl,
    } = body;

    if (!title || !type || !recipientType || !senderName || !senderType) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const notificationId = await createNotification({
      title,
      type,
      message: message || "",
      recipientId: recipientId || "",
      recipientType,
      senderName,
      senderType,
      contentId: contentId || "",
      contentTitle: contentTitle || "",
      clientId: clientId || "",
      linkUrl: linkUrl || "",
    });

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: "Failed to create notification" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, notificationId });
  } catch (error: any) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/notifications - Mark all as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientId, recipientType } = body;

    if (!recipientType) {
      return NextResponse.json(
        { success: false, error: "Recipient type is required" },
        { status: 400 }
      );
    }

    await markAllNotificationsAsRead(recipientId || "", recipientType);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
