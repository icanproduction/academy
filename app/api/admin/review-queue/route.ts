import { NextResponse } from "next/server";
import { getReviewQueue } from "@/lib/notion";

// GET /api/admin/review-queue - Get all contents awaiting review
export async function GET() {
  try {
    const contents = await getReviewQueue();

    return NextResponse.json(contents);
  } catch (error: any) {
    console.error("Error fetching review queue:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
