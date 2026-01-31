import { Client } from "@notionhq/client";
import * as dotenv from "dotenv";
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

async function addBriefSectionsProperty() {
  const contentsDbId = process.env.NOTION_CONTENTS_DB_ID?.trim();

  if (!contentsDbId) {
    console.error("NOTION_CONTENTS_DB_ID not found");
    process.exit(1);
  }

  console.log("Adding Brief Sections property to Contents database...");
  console.log(`Database ID: ${contentsDbId}`);

  try {
    await notion.databases.update({
      database_id: contentsDbId,
      properties: {
        "Brief Sections": {
          rich_text: {},
        },
      },
    });

    console.log("✅ Added Brief Sections property successfully!");
  } catch (error: any) {
    if (error.code === "validation_error" && error.message?.includes("already exists")) {
      console.log("ℹ️ Brief Sections property already exists");
    } else {
      console.error("Error:", error);
    }
  }
}

addBriefSectionsProperty().catch(console.error);
