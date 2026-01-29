import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentPageId = searchParams.get("parentPageId");

    if (!parentPageId) {
      return NextResponse.json({ success: false, error: "parentPageId required" }, { status: 400 });
    }

    const results: { name: string; id: string; envKey: string }[] = [];

    // 1. Create Reels Briefs
    const reelsBriefs = await notion.databases.create({
      parent: { type: "page_id", page_id: parentPageId },
      title: [{ type: "text", text: { content: "Reels Briefs" } }],
      icon: { type: "emoji", emoji: "📝" },
      properties: {
        "Request ID": { title: {} },
        Client: {
          relation: {
            database_id: process.env.NOTION_CLIENTS_DB_ID!,
            single_property: {}
          }
        },
        "Content Pillar": {
          relation: {
            database_id: process.env.NOTION_CONTENT_PILLARS_DB_ID!,
            single_property: {}
          }
        },
        Products: {
          relation: {
            database_id: process.env.NOTION_CLIENT_PRODUCTS_DB_ID!,
            single_property: {}
          }
        },
        Topic: { rich_text: {} },
        "Key Message": { rich_text: {} },
        Duration: {
          select: {
            options: [
              { name: "15-30s", color: "green" },
              { name: "30-60s", color: "blue" },
              { name: "60-90s", color: "purple" },
            ],
          },
        },
        "Reference Links": { rich_text: {} },
        Notes: { rich_text: {} },
        Status: {
          select: {
            options: [
              { name: "Draft", color: "gray" },
              { name: "Submitted", color: "yellow" },
              { name: "Generated", color: "blue" },
              { name: "Review", color: "purple" },
              { name: "Approved", color: "green" },
            ],
          },
        },
        "Generated Brief": { rich_text: {} },
        "Final Brief": { rich_text: {} },
        "Created Date": { created_time: {} },
      },
    });

    results.push({
      name: "Reels Briefs",
      id: reelsBriefs.id,
      envKey: "NOTION_REELS_BRIEFS_DB_ID",
    });

    // Small delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 2. Create Brief Conversations
    const briefConversations = await notion.databases.create({
      parent: { type: "page_id", page_id: parentPageId },
      title: [{ type: "text", text: { content: "Brief Conversations" } }],
      icon: { type: "emoji", emoji: "🗨️" },
      properties: {
        Name: { title: {} },
        "Brief Request": {
          relation: {
            database_id: reelsBriefs.id,
            single_property: {}
          }
        },
        Role: {
          select: {
            options: [
              { name: "user", color: "blue" },
              { name: "assistant", color: "green" },
            ],
          },
        },
        Message: { rich_text: {} },
        "Created Date": { created_time: {} },
      },
    });

    results.push({
      name: "Brief Conversations",
      id: briefConversations.id,
      envKey: "NOTION_BRIEF_CONVERSATIONS_DB_ID",
    });

    const envContent = results.map((r) => `${r.envKey}=${r.id}`).join("\n");

    return NextResponse.json({
      success: true,
      message: `Created ${results.length} databases`,
      created: results,
      envContent: `\n# Remaining databases:\n${envContent}`,
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
