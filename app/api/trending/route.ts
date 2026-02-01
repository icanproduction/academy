import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY?.trim(),
});

const TRENDING_DB_ID = (process.env.NOTION_TRENDING_CONTENT_DB_ID || "").replace(/\\n/g, "").trim();

// Helper to extract text from Notion property
function getText(prop: any): any {
  if (!prop) return "";
  if (prop.type === "title") return prop.title?.[0]?.plain_text || "";
  if (prop.type === "rich_text") return prop.rich_text?.[0]?.plain_text || "";
  if (prop.type === "number") return prop.number ?? 0;
  if (prop.type === "select") return prop.select?.name || "";
  if (prop.type === "multi_select") return prop.multi_select?.map((s: any) => s.name) || [];
  if (prop.type === "date") return prop.date?.start || "";
  if (prop.type === "url") return prop.url || "";
  if (prop.type === "files") return prop.files?.map((f: any) => f.file?.url || f.external?.url || "") || [];
  return "";
}

function getNumber(prop: any): number {
  if (!prop) return 0;
  if (prop.type === "number") return prop.number ?? 0;
  return 0;
}

// GET - Fetch all trending videos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!TRENDING_DB_ID) {
      return NextResponse.json(
        { error: "Trending database not configured" },
        { status: 500 }
      );
    }

    // Build filter
    const filter: any = category && category !== "all"
      ? { property: "Category", select: { equals: category } }
      : undefined;

    const res = await notion.databases.query({
      database_id: TRENDING_DB_ID,
      filter,
      sorts: [
        { property: "Fetched At", direction: "descending" },
        { property: "Views", direction: "descending" },
      ],
      page_size: Math.min(limit, 100),
    });

    const videos = res.results.map((page: any) => ({
      id: page.id,
      videoId: getText(page.properties["Video ID"]),
      videoUrl: getText(page.properties["Video URL"]),
      thumbnailUrl: getText(page.properties["Thumbnail"]),
      authorUsername: getText(page.properties["Author Username"]),
      authorNickname: getText(page.properties["Author Nickname"]),
      authorAvatar: getText(page.properties["Author Avatar"]),
      description: getText(page.properties["Description"]),
      views: getNumber(page.properties["Views"]),
      likes: getNumber(page.properties["Likes"]),
      comments: getNumber(page.properties["Comments"]),
      shares: getNumber(page.properties["Shares"]),
      duration: getNumber(page.properties["Duration"]),
      soundTitle: getText(page.properties["Sound Title"]),
      soundUrl: getText(page.properties["Sound URL"]),
      hashtags: getText(page.properties["Hashtags"]),
      category: getText(page.properties["Category"]),
      fetchedAt: getText(page.properties["Fetched At"]),
      embedHtml: getText(page.properties["Embed HTML"]),
    }));

    // Get unique categories for filter
    const categories = Array.from(new Set(videos.map((v: any) => v.category).filter(Boolean)));

    return NextResponse.json({
      videos,
      categories,
      total: videos.length
    });
  } catch (error: any) {
    console.error("Error fetching trending videos:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch trending videos" },
      { status: 500 }
    );
  }
}
