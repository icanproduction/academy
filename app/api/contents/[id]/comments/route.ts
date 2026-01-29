import { NextRequest, NextResponse } from "next/server";
import { getContentComments, createContentComment } from "@/lib/notion";

// GET /api/contents/[id]/comments - List comments for a content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentId } = await params;
    const comments = await getContentComments(contentId);

    return NextResponse.json(comments);
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/contents/[id]/comments - Add comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentId } = await params;
    const body = await request.json();
    const { authorId, authorName, authorRole, message } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: "message is required" },
        { status: 400 }
      );
    }

    // Use authorId if provided, otherwise use a placeholder
    const finalAuthorId = authorId || "anonymous";
    const finalAuthorName = authorName || "Anonymous";

    const commentId = await createContentComment(contentId, finalAuthorId, finalAuthorName, message);

    return NextResponse.json({ success: true, id: commentId });
  } catch (error: any) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
