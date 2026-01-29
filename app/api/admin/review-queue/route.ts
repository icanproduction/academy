import { NextRequest, NextResponse } from "next/server";
import { getReviewQueue, getAllContentsWithDetails } from "@/lib/notion";

// GET /api/admin/review-queue - Get contents for review
// Query params:
// - all=true: Get all contents (not just pending review)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    const contents = all
      ? await getAllContentsWithDetails()
      : await getReviewQueue();

    return NextResponse.json(contents);
  } catch (error: any) {
    console.error("Error fetching review queue:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
