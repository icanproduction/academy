import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import * as fs from "fs";
import * as path from "path";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

interface DatabaseConfig {
  name: string;
  envKey: string;
  icon: string;
  properties: Record<string, any>;
}

// Database configurations
const databases: DatabaseConfig[] = [
  {
    name: "Knowledge Bank",
    envKey: "NOTION_KNOWLEDGE_BANK_DB_ID",
    icon: "📚",
    properties: {
      Title: { title: {} },
      Client: { relation: { database_id: "CLIENTS_PLACEHOLDER", single_property: {} } },
      Content: { rich_text: {} },
      Category: {
        select: {
          options: [
            { name: "Brand", color: "blue" },
            { name: "Product", color: "green" },
            { name: "Audience", color: "purple" },
            { name: "Competitor", color: "red" },
            { name: "Other", color: "gray" },
          ],
        },
      },
      Priority: { number: { format: "number" } },
      "Include in Brief": { checkbox: {} },
      "Is Active": { checkbox: {} },
    },
  },
  {
    name: "Client Assets",
    envKey: "NOTION_CLIENT_ASSETS_DB_ID",
    icon: "🎨",
    properties: {
      "Asset Name": { title: {} },
      Client: { relation: { database_id: "CLIENTS_PLACEHOLDER", single_property: {} } },
      Type: {
        select: {
          options: [
            { name: "Canva Template", color: "blue" },
            { name: "Font", color: "purple" },
            { name: "Logo", color: "green" },
            { name: "Guidelines", color: "yellow" },
            { name: "Other", color: "gray" },
          ],
        },
      },
      URL: { url: {} },
      Description: { rich_text: {} },
      "Is Active": { checkbox: {} },
    },
  },
  {
    name: "Client ICP",
    envKey: "NOTION_CLIENT_ICP_DB_ID",
    icon: "👥",
    properties: {
      "ICP Name": { title: {} },
      Client: { relation: { database_id: "CLIENTS_PLACEHOLDER", single_property: {} } },
      "Age Range": { rich_text: {} },
      Gender: {
        multi_select: {
          options: [
            { name: "Pria", color: "blue" },
            { name: "Wanita", color: "pink" },
          ],
        },
      },
      Location: { multi_select: { options: [] } },
      Occupation: { rich_text: {} },
      Interests: { multi_select: { options: [] } },
      "Pain Points": { rich_text: {} },
      Goals: { rich_text: {} },
      "Content Preferences": { rich_text: {} },
      "Is Primary": { checkbox: {} },
    },
  },
  {
    name: "Client Products",
    envKey: "NOTION_CLIENT_PRODUCTS_DB_ID",
    icon: "📦",
    properties: {
      "Product Name": { title: {} },
      Client: { relation: { database_id: "CLIENTS_PLACEHOLDER", single_property: {} } },
      Category: {
        select: {
          options: [
            { name: "Product", color: "blue" },
            { name: "Service", color: "green" },
            { name: "Package", color: "purple" },
          ],
        },
      },
      Description: { rich_text: {} },
      "Key Benefits": { rich_text: {} },
      "Price Type": {
        select: {
          options: [
            { name: "Fixed", color: "blue" },
            { name: "Range", color: "green" },
            { name: "Starting From", color: "yellow" },
          ],
        },
      },
      "Price Min": { number: { format: "number" } },
      "Price Max": { number: { format: "number" } },
      USP: { rich_text: {} },
      "Is Featured": { checkbox: {} },
      "Is Active": { checkbox: {} },
    },
  },
  {
    name: "Contents",
    envKey: "NOTION_CONTENTS_DB_ID",
    icon: "🎬",
    properties: {
      Title: { title: {} },
      "Unique ID": { rich_text: {} },
      Client: { relation: { database_id: "CLIENTS_PLACEHOLDER", single_property: {} } },
      Pillar: { relation: { database_id: "PILLARS_PLACEHOLDER", single_property: {} } },
      Caption: { rich_text: {} },
      "Content Type": {
        select: {
          options: [
            { name: "reels", color: "pink" },
            { name: "carousel", color: "blue" },
            { name: "story", color: "purple" },
          ],
        },
      },
      Platform: {
        multi_select: {
          options: [
            { name: "instagram", color: "pink" },
            { name: "tiktok", color: "default" },
          ],
        },
      },
      "Publish Date": { date: {} },
      Status: {
        select: {
          options: [
            { name: "idea_draft", color: "gray" },
            { name: "idea_submitted", color: "yellow" },
            { name: "idea_revision", color: "orange" },
            { name: "production_ready", color: "blue" },
            { name: "production_in_progress", color: "purple" },
            { name: "production_submitted", color: "yellow" },
            { name: "production_revision", color: "orange" },
            { name: "ready_to_post", color: "green" },
            { name: "posted", color: "green" },
          ],
        },
      },
      "Reference Links": { rich_text: {} },
      "Duration Seconds": { number: { format: "number" } },
      "Audio Reference": { rich_text: {} },
      "Slide Count": { number: { format: "number" } },
      "Slide Notes": { rich_text: {} },
      "CTA Notes": { rich_text: {} },
      "Output Files": { files: {} },
      "Output URL": { url: {} },
      Thumbnail: { files: {} },
      Notes: { rich_text: {} },
      "Submitted At": { date: {} },
      "Approved At": { date: {} },
      "Posted At": { date: {} },
    },
  },
  {
    name: "Content Comments",
    envKey: "NOTION_CONTENT_COMMENTS_DB_ID",
    icon: "💬",
    properties: {
      Name: { title: {} },
      Content: { relation: { database_id: "CONTENTS_PLACEHOLDER", single_property: {} } },
      Author: { relation: { database_id: "CLIENTS_PLACEHOLDER", single_property: {} } },
      "Author Name": { rich_text: {} },
      Message: { rich_text: {} },
      Attachments: { files: {} },
    },
  },
  {
    name: "Content Reviews",
    envKey: "NOTION_CONTENT_REVIEWS_DB_ID",
    icon: "✅",
    properties: {
      Name: { title: {} },
      Content: { relation: { database_id: "CONTENTS_PLACEHOLDER", single_property: {} } },
      Reviewer: { relation: { database_id: "CLIENTS_PLACEHOLDER", single_property: {} } },
      "Reviewer Name": { rich_text: {} },
      "Review Phase": {
        select: {
          options: [
            { name: "ideation", color: "blue" },
            { name: "production", color: "purple" },
          ],
        },
      },
      Decision: {
        select: {
          options: [
            { name: "approved", color: "green" },
            { name: "revision", color: "orange" },
          ],
        },
      },
      Feedback: { rich_text: {} },
      "Concept Score": { number: { format: "number" } },
      "Visual Score": { number: { format: "number" } },
      "Caption Score": { number: { format: "number" } },
    },
  },
  {
    name: "Reels Briefs",
    envKey: "NOTION_REELS_BRIEFS_DB_ID",
    icon: "📝",
    properties: {
      "Request ID": { title: {} },
      Client: { relation: { database_id: "CLIENTS_PLACEHOLDER", single_property: {} } },
      "Content Pillar": { relation: { database_id: "PILLARS_PLACEHOLDER", single_property: {} } },
      Products: { relation: { database_id: "PRODUCTS_PLACEHOLDER" } },
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
  },
  {
    name: "Brief Conversations",
    envKey: "NOTION_BRIEF_CONVERSATIONS_DB_ID",
    icon: "🗨️",
    properties: {
      Name: { title: {} },
      "Brief Request": { relation: { database_id: "BRIEFS_PLACEHOLDER", single_property: {} } },
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
  },
];

async function createDatabase(
  parentPageId: string,
  config: DatabaseConfig,
  relationIds: Record<string, string>
): Promise<string> {
  // Replace placeholder IDs with actual database IDs
  const properties = JSON.parse(JSON.stringify(config.properties));

  for (const [key, value] of Object.entries(properties)) {
    if ((value as any).relation) {
      const dbId = (value as any).relation.database_id;
      if (dbId === "CLIENTS_PLACEHOLDER") {
        (value as any).relation.database_id = relationIds.clients || process.env.NOTION_CLIENTS_DB_ID;
      } else if (dbId === "PILLARS_PLACEHOLDER") {
        (value as any).relation.database_id = relationIds.pillars || process.env.NOTION_CONTENT_PILLARS_DB_ID;
      } else if (dbId === "CONTENTS_PLACEHOLDER") {
        (value as any).relation.database_id = relationIds.contents;
      } else if (dbId === "PRODUCTS_PLACEHOLDER") {
        (value as any).relation.database_id = relationIds.products;
      } else if (dbId === "BRIEFS_PLACEHOLDER") {
        (value as any).relation.database_id = relationIds.briefs;
      }
    }
  }

  const response = await notion.databases.create({
    parent: { type: "page_id", page_id: parentPageId },
    title: [{ type: "text", text: { content: config.name } }],
    icon: { type: "emoji", emoji: config.icon as any },
    properties,
  });

  return response.id;
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentPageId = searchParams.get("parentPageId");

    if (!parentPageId) {
      return NextResponse.json(
        {
          success: false,
          error: "parentPageId is required",
          instructions: [
            "1. Create a new page in Notion (e.g., 'iCAN Databases')",
            "2. Share the page with your Notion integration",
            "3. Copy the page URL and extract the ID",
            "4. Call this API with: ?parentPageId=YOUR_PAGE_ID",
            "",
            "Example URL: notion.so/iCAN-Databases-abc123def456",
            "The ID is: abc123def456 (remove dashes if needed)",
          ],
        },
        { status: 400 }
      );
    }

    const relationIds: Record<string, string> = {
      clients: process.env.NOTION_CLIENTS_DB_ID || "",
      pillars: process.env.NOTION_CONTENT_PILLARS_DB_ID || "",
    };

    const results: { name: string; id: string; envKey: string }[] = [];
    const errors: { name: string; error: string }[] = [];

    // Create databases in order (respecting dependencies)
    const orderedDatabases = [
      "Knowledge Bank",
      "Client Assets",
      "Client ICP",
      "Client Products",
      "Contents",
      "Reels Briefs",
      "Content Comments",
      "Content Reviews",
      "Brief Conversations",
    ];

    for (const dbName of orderedDatabases) {
      const config = databases.find((d) => d.name === dbName);
      if (!config) continue;

      try {
        const dbId = await createDatabase(parentPageId, config, relationIds);
        results.push({ name: config.name, id: dbId, envKey: config.envKey });

        // Update relation IDs for dependent databases
        if (dbName === "Client Products") {
          relationIds.products = dbId;
        } else if (dbName === "Contents") {
          relationIds.contents = dbId;
        } else if (dbName === "Reels Briefs") {
          relationIds.briefs = dbId;
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error: any) {
        errors.push({ name: dbName, error: error.message });
      }
    }

    // Generate env content
    const envContent = results.map((r) => `${r.envKey}=${r.id}`).join("\n");

    return NextResponse.json({
      success: true,
      message: `Created ${results.length} databases`,
      created: results,
      errors: errors.length > 0 ? errors : undefined,
      envContent: `\n# Add these to your .env.local:\n${envContent}`,
    });
  } catch (error: any) {
    console.error("Error creating databases:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET method to check status
export async function GET() {
  const requiredDbs = [
    { key: "NOTION_KNOWLEDGE_BANK_DB_ID", name: "Knowledge Bank" },
    { key: "NOTION_CLIENT_ASSETS_DB_ID", name: "Client Assets" },
    { key: "NOTION_CLIENT_ICP_DB_ID", name: "Client ICP" },
    { key: "NOTION_CLIENT_PRODUCTS_DB_ID", name: "Client Products" },
    { key: "NOTION_CONTENTS_DB_ID", name: "Contents" },
    { key: "NOTION_CONTENT_COMMENTS_DB_ID", name: "Content Comments" },
    { key: "NOTION_CONTENT_REVIEWS_DB_ID", name: "Content Reviews" },
    { key: "NOTION_REELS_BRIEFS_DB_ID", name: "Reels Briefs" },
    { key: "NOTION_BRIEF_CONVERSATIONS_DB_ID", name: "Brief Conversations" },
  ];

  const status = requiredDbs.map((db) => ({
    name: db.name,
    envKey: db.key,
    configured: !!process.env[db.key],
  }));

  const missing = status.filter((s) => !s.configured);
  const configured = status.filter((s) => s.configured);

  return NextResponse.json({
    success: true,
    summary: {
      total: requiredDbs.length,
      configured: configured.length,
      missing: missing.length,
    },
    status,
    instructions: missing.length > 0
      ? [
          "To create missing databases:",
          "1. Create a parent page in Notion",
          "2. Share it with your Notion integration",
          "3. POST to /api/admin/setup-databases?parentPageId=YOUR_PAGE_ID",
        ]
      : ["All databases are configured!"],
  });
}
