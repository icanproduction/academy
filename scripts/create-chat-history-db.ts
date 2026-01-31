import { Client } from "@notionhq/client";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const notion = new Client({
  auth: process.env.NOTION_API_KEY?.trim(),
});

async function getParentPageFromDatabase(databaseId: string): Promise<string | null> {
  try {
    const db = await notion.databases.retrieve({ database_id: databaseId });
    if (db.parent.type === "page_id") {
      return db.parent.page_id;
    }
    return null;
  } catch (error) {
    console.error("Error getting parent page:", error);
    return null;
  }
}

async function createContentChatHistoryDb(parentPageId: string) {
  console.log("Creating Content Chat History database...");

  const contentsDbId = process.env.NOTION_CONTENTS_DB_ID?.trim();
  const clientsDbId = process.env.NOTION_CLIENTS_DB_ID?.trim();

  if (!contentsDbId || !clientsDbId) {
    throw new Error("NOTION_CONTENTS_DB_ID and NOTION_CLIENTS_DB_ID required");
  }

  const contentChatHistory = await notion.databases.create({
    parent: { type: "page_id", page_id: parentPageId },
    title: [{ type: "text", text: { content: "Content Chat History" } }],
    icon: { type: "emoji", emoji: "💬" },
    properties: {
      Name: { title: {} },
      Content: {
        relation: {
          database_id: contentsDbId,
          single_property: {},
        },
      },
      Client: {
        relation: {
          database_id: clientsDbId,
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

  console.log("✅ Created Content Chat History database!");
  console.log(`   ID: ${contentChatHistory.id}`);
  console.log("");
  console.log("Add this to your .env.local:");
  console.log(`NOTION_CONTENT_CHAT_HISTORY_DB_ID="${contentChatHistory.id}"`);

  return contentChatHistory.id;
}

async function main() {
  console.log("🚀 Creating Content Chat History Database\n");

  // Get parent page from existing database
  const contentsDbId = process.env.NOTION_CONTENTS_DB_ID?.trim();
  if (!contentsDbId) {
    console.error("❌ NOTION_CONTENTS_DB_ID not found in .env.local");
    process.exit(1);
  }

  console.log("Finding parent page from Contents database...");
  const parentPageId = await getParentPageFromDatabase(contentsDbId);

  if (!parentPageId) {
    console.error("❌ Could not find parent page ID");
    process.exit(1);
  }

  console.log(`Found parent page: ${parentPageId}\n`);

  // Create the database
  const dbId = await createContentChatHistoryDb(parentPageId);

  console.log("\n✨ Done!");
}

main().catch(console.error);
