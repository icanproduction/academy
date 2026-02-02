import { NextRequest, NextResponse } from "next/server";
import { getContentReviews, createContentReview, createNotification, getContent } from "@/lib/notion";

// GET /api/contents/[id]/reviews - List reviews for a content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentId } = await params;
    const reviews = await getContentReviews(contentId);

    return NextResponse.json({ success: true, data: reviews });
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/contents/[id]/reviews - Create review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentId } = await params;
    const body = await request.json();
    const {
      reviewerId,
      reviewerName,
      reviewPhase,
      decision,
      feedback,
      conceptScore,
      visualScore,
      captionScore,
      clientId,
      reviewerRole
    } = body;

    if (!reviewerId || !reviewerName || !reviewPhase || !decision || !feedback) {
      return NextResponse.json(
        { success: false, error: "reviewerId, reviewerName, reviewPhase, decision, and feedback are required" },
        { status: 400 }
      );
    }

    const reviewId = await createContentReview(contentId, reviewerId, reviewerName, {
      reviewPhase,
      decision,
      feedback,
      conceptScore,
      visualScore,
      captionScore,
    });

    // Get content details for notification
    const content = await getContent(contentId);
    const contentTitle = content?.title || "Content";

    // Create notification based on decision type
    const senderType = reviewerRole === "admin" ? "admin" : "client";
    const recipientType = senderType === "admin" ? "client" : "admin";

    // Determine notification type and title based on decision
    let notifType: "revision" | "approval" | "comment" = "comment";
    let notifTitle = "";

    if (decision === "Approved") {
      notifType = "approval";
      notifTitle = `${reviewerName} menyetujui konten`;
    } else if (decision === "Revision") {
      notifType = "revision";
      notifTitle = `${reviewerName} meminta revisi`;
    } else {
      notifTitle = `${reviewerName} memberikan review`;
    }

    // Determine link URL based on recipient type
    const linkUrl = recipientType === "admin"
      ? `/admin/contents/${contentId}`
      : `/dashboard/contents/${contentId}`;

    await createNotification({
      title: notifTitle,
      type: notifType,
      message: feedback.slice(0, 200),
      recipientId: clientId || "",
      recipientType,
      senderName: reviewerName,
      senderType,
      contentId,
      contentTitle,
      clientId: clientId || "",
      linkUrl,
    });

    return NextResponse.json({ success: true, id: reviewId });
  } catch (error: any) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
