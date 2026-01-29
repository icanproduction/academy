import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY?.trim(),
});

// POST /api/admin/setup-chat-history - Create Content Chat History database
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentPageId = searchParams.get("parentPageId");

    if (!parentPageId) {
      return NextResponse.json(
        { success: false, error: "parentPageId required" },
        { status: 400 }
      );
    }

    const results: { name: string; id: string; envKey: string }[] = [];

    // Create Content Chat History database
    const contentChatHistory = await notion.databases.create({
      parent: { type: "page_id", page_id: parentPageId },
      title: [{ type: "text", text: { content: "Content Chat History" } }],
      icon: { type: "emoji", emoji: "💬" },
      properties: {
        Name: { title: {} },
        Content: {
          relation: {
            database_id: process.env.NOTION_CONTENTS_DB_ID!.trim(),
            single_property: {},
          },
        },
        Client: {
          relation: {
            database_id: process.env.NOTION_CLIENTS_DB_ID!.trim(),
            single_property: {},
          },
        },
        Role: {
          select: {
            options: [
              { name: "user", color: "blue" },
              { name: "assistant", color: "green" },
              { name: "system", color: "gray" },
            ],
          },
        },
        Message: { rich_text: {} },
        "Message Part 2": { rich_text: {} },
        "Message Part 3": { rich_text: {} },
        "Sequence Number": { number: {} },
        "Created Date": { created_time: {} },
      },
    });

    results.push({
      name: "Content Chat History",
      id: contentChatHistory.id,
      envKey: "NOTION_CONTENT_CHAT_HISTORY_DB_ID",
    });

    const envContent = results.map((r) => `${r.envKey}="${r.id}"`).join("\n");

    return NextResponse.json({
      success: true,
      message: `Created ${results.length} databases`,
      created: results,
      envContent: `\n# Content Chat History database:\n${envContent}`,
      nextSteps: [
        "1. Add the env variable to your .env.local file",
        "2. Redeploy or restart your dev server",
      ],
    });
  } catch (error: any) {
    console.error("Error creating chat history database:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
