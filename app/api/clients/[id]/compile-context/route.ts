import { NextRequest, NextResponse } from "next/server";
import { getOrCompileContext } from "@/lib/context-compiler";

// POST /api/clients/[id]/compile-context - Compile or recompile client context
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const { searchParams } = new URL(request.url);
    const forceRecompile = searchParams.get("force") === "true";

    const result = await getOrCompileContext(clientId, forceRecompile);

    return NextResponse.json({
      success: true,
      hash: result.hash,
      compiledAt: result.compiledAt,
      contextLength: result.context.length,
    });
  } catch (error: any) {
    console.error("Error compiling context:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/clients/[id]/compile-context - Get current context status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;

    // Just get existing context without recompiling
    const result = await getOrCompileContext(clientId, false);

    return NextResponse.json({
      success: true,
      cached: true,
      hash: result.hash,
      contextLength: result.context.length,
    });
  } catch (error: any) {
    console.error("Error getting context status:", error);
    return NextResponse.json(
      { success: false, cached: false, error: error.message },
      { status: 500 }
    );
  }
}
