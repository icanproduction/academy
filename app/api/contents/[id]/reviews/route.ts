import { NextRequest, NextResponse } from "next/server";
import { getContentReviews, createContentReview } from "@/lib/notion";

// GET /api/contents/[id]/reviews - List reviews for a content
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviews = await getContentReviews(params.id);

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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { reviewerId, reviewerName, reviewPhase, decision, feedback, conceptScore, visualScore, captionScore } = body;

    if (!reviewerId || !reviewerName || !reviewPhase || !decision || !feedback) {
      return NextResponse.json(
        { success: false, error: "reviewerId, reviewerName, reviewPhase, decision, and feedback are required" },
        { status: 400 }
      );
    }

    const reviewId = await createContentReview(params.id, reviewerId, reviewerName, {
      reviewPhase,
      decision,
      feedback,
      conceptScore,
      visualScore,
      captionScore,
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
