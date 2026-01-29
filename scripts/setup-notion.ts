/**
 * Script untuk membuat semua database Notion yang diperlukan
 *
 * Cara pakai:
 * 1. Buat halaman baru di Notion (misalnya "iCAN Platform Database")
 * 2. Share halaman tersebut dengan integration kamu
 * 3. Copy Page ID dari URL halaman (bagian setelah workspace name, sebelum ?)
 *    Contoh: https://notion.so/workspace/iCAN-Platform-abc123... -> abc123...
 * 4. Jalankan: npx ts-node scripts/setup-notion.ts <PAGE_ID>
 */

import { Client } from "@notionhq/client";
import * as fs from "fs";
import * as path from "path";

const NOTION_API_KEY = process.env.NOTION_API_KEY;

if (!NOTION_API_KEY) {
  console.error("❌ NOTION_API_KEY tidak ditemukan di environment variables");
  console.log("   Pastikan sudah ada di file .env.local");
  process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });

const PARENT_PAGE_ID = process.argv[2];

if (!PARENT_PAGE_ID) {
  console.error("❌ Parent Page ID tidak diberikan");
  console.log("   Cara pakai: npx ts-node scripts/setup-notion.ts <PAGE_ID>");
  console.log("   Contoh: npx ts-node scripts/setup-notion.ts abc123def456...");
  process.exit(1);
}

interface DatabaseConfig {
  name: string;
  envKey: string;
  properties: Record<string, any>;
}

const DATABASES: DatabaseConfig[] = [
  {
    name: "Clients",
    envKey: "NOTION_CLIENTS_DB_ID",
    properties: {
      Name: { title: {} },
      Industry: { rich_text: {} },
      "Contact Person": { rich_text: {} },
      Email: { email: {} },
      Phone: { phone_number: {} },
      Status: { select: { options: [
        { name: "active", color: "green" },
        { name: "completed", color: "blue" },
        { name: "paused", color: "yellow" },
      ]}},
      Role: { select: { options: [
        { name: "client", color: "blue" },
        { name: "admin", color: "red" },
      ]}},
      "Start Date": { date: {} },
      "End Date": { date: {} },
      Notes: { rich_text: {} },
    },
  },
  {
    name: "Progress",
    envKey: "NOTION_PROGRESS_DB_ID",
    properties: {
      Name: { title: {} },
      Client: { relation: { single_property: {}, database_id: "CLIENTS_PLACEHOLDER" }},
      "Current Phase": { select: { options: [
        { name: "Systematize", color: "blue" },
        { name: "Execute", color: "orange" },
        { name: "Optimize", color: "green" },
        { name: "Completed", color: "purple" },
      ]}},
      "Current Day": { number: {} },
      "Completion Percentage": { number: {} },
      "Last Updated": { date: {} },
    },
  },
  {
    name: "Tasks",
    envKey: "NOTION_TASKS_DB_ID",
    properties: {
      Name: { title: {} },
      Client: { relation: { single_property: {}, database_id: "CLIENTS_PLACEHOLDER" }},
      Description: { rich_text: {} },
      "Due Date": { date: {} },
      Status: { select: { options: [
        { name: "todo", color: "gray" },
        { name: "in_progress", color: "blue" },
        { name: "done", color: "green" },
      ]}},
      Phase: { select: { options: [
        { name: "Systematize", color: "blue" },
        { name: "Execute", color: "orange" },
        { name: "Optimize", color: "green" },
      ]}},
      Week: { number: {} },
    },
  },
  {
    name: "Modules",
    envKey: "NOTION_MODULES_DB_ID",
    properties: {
      Name: { title: {} },
      Description: { rich_text: {} },
      Order: { number: {} },
      "Thumbnail URL": { url: {} },
      "Duration Hours": { number: {} },
    },
  },
  {
    name: "Lessons",
    envKey: "NOTION_LESSONS_DB_ID",
    properties: {
      Name: { title: {} },
      Module: { relation: { single_property: {}, database_id: "MODULES_PLACEHOLDER" }},
      Description: { rich_text: {} },
      "YouTube Video ID": { rich_text: {} },
      "Duration Minutes": { number: {} },
      Order: { number: {} },
      Resources: { rich_text: {} },
    },
  },
  {
    name: "Lesson Progress",
    envKey: "NOTION_LESSON_PROGRESS_DB_ID",
    properties: {
      Name: { title: {} },
      Client: { relation: { single_property: {}, database_id: "CLIENTS_PLACEHOLDER" }},
      Lesson: { relation: { single_property: {}, database_id: "LESSONS_PLACEHOLDER" }},
      Status: { select: { options: [
        { name: "not_started", color: "gray" },
        { name: "in_progress", color: "blue" },
        { name: "completed", color: "green" },
      ]}},
      "Progress Seconds": { number: {} },
      "Completed At": { date: {} },
    },
  },
  {
    name: "Playbooks",
    envKey: "NOTION_PLAYBOOKS_DB_ID",
    properties: {
      Name: { title: {} },
      Client: { relation: { single_property: {}, database_id: "CLIENTS_PLACEHOLDER" }},
      Status: { select: { options: [
        { name: "draft", color: "gray" },
        { name: "active", color: "green" },
      ]}},
      Version: { number: {} },
      "Brand Story": { rich_text: {} },
      "Brand Personality": { rich_text: {} },
      "Target Audience": { rich_text: {} },
      "Color Primary": { rich_text: {} },
      "Color Secondary": { rich_text: {} },
      "Color Accent": { rich_text: {} },
      "Typography Heading": { rich_text: {} },
      "Typography Body": { rich_text: {} },
      "Voice Tone": { rich_text: {} },
      "Vocabulary Use": { rich_text: {} },
      "Vocabulary Avoid": { rich_text: {} },
      "Content Pillars": { rich_text: {} },
      "Posting Schedule": { rich_text: {} },
      "Last Updated": { date: {} },
    },
  },
  {
    name: "Content Pillars",
    envKey: "NOTION_CONTENT_PILLARS_DB_ID",
    properties: {
      Name: { title: {} },
      Client: { relation: { single_property: {}, database_id: "CLIENTS_PLACEHOLDER" }},
      Color: { select: { options: [
        { name: "blue", color: "blue" },
        { name: "green", color: "green" },
        { name: "orange", color: "orange" },
        { name: "purple", color: "purple" },
        { name: "red", color: "red" },
      ]}},
      "Ratio Percentage": { number: {} },
      Description: { rich_text: {} },
    },
  },
  {
    name: "Content Items",
    envKey: "NOTION_CONTENT_ITEMS_DB_ID",
    properties: {
      Name: { title: {} },
      Client: { relation: { single_property: {}, database_id: "CLIENTS_PLACEHOLDER" }},
      "Content Type": { select: { options: [
        { name: "feed", color: "blue" },
        { name: "carousel", color: "green" },
        { name: "reels", color: "orange" },
        { name: "story", color: "purple" },
      ]}},
      Platform: { multi_select: { options: [
        { name: "instagram", color: "pink" },
        { name: "tiktok", color: "default" },
        { name: "youtube", color: "red" },
        { name: "facebook", color: "blue" },
      ]}},
      Pillar: { relation: { single_property: {}, database_id: "CONTENT_PILLARS_PLACEHOLDER" }},
      "Scheduled Date": { date: {} },
      Status: { select: { options: [
        { name: "idea", color: "gray" },
        { name: "draft", color: "yellow" },
        { name: "ready", color: "blue" },
        { name: "submitted", color: "orange" },
        { name: "approved", color: "green" },
        { name: "posted", color: "purple" },
      ]}},
      Files: { files: {} },
      Caption: { rich_text: {} },
      Hashtags: { rich_text: {} },
      Notes: { rich_text: {} },
    },
  },
  {
    name: "Submissions",
    envKey: "NOTION_SUBMISSIONS_DB_ID",
    properties: {
      Name: { title: {} },
      Client: { relation: { single_property: {}, database_id: "CLIENTS_PLACEHOLDER" }},
      "Content Items": { relation: { single_property: {}, database_id: "CONTENT_ITEMS_PLACEHOLDER" }},
      Files: { files: {} },
      "Submitted At": { date: {} },
      Status: { select: { options: [
        { name: "submitted", color: "yellow" },
        { name: "in_review", color: "blue" },
        { name: "approved", color: "green" },
        { name: "needs_revision", color: "red" },
      ]}},
      Notes: { rich_text: {} },
    },
  },
  {
    name: "Reviews",
    envKey: "NOTION_REVIEWS_DB_ID",
    properties: {
      Name: { title: {} },
      Submission: { relation: { single_property: {}, database_id: "SUBMISSIONS_PLACEHOLDER" }},
      "Visual Score": { number: {} },
      "Caption Score": { number: {} },
      "Strategy Score": { number: {} },
      "Feedback Text": { rich_text: {} },
      Decision: { select: { options: [
        { name: "approved", color: "green" },
        { name: "needs_revision", color: "red" },
      ]}},
      "Reviewed At": { date: {} },
    },
  },
  {
    name: "Assets",
    envKey: "NOTION_ASSETS_DB_ID",
    properties: {
      Name: { title: {} },
      Category: { select: { options: [
        { name: "Logo", color: "blue" },
        { name: "Fonts", color: "green" },
        { name: "Templates", color: "orange" },
        { name: "Photos", color: "purple" },
        { name: "Videos", color: "red" },
        { name: "Icons", color: "yellow" },
        { name: "Mockups", color: "pink" },
      ]}},
      "File URL": { url: {} },
      "File Type": { rich_text: {} },
      Tags: { multi_select: { options: [] }},
      "Created At": { date: {} },
    },
  },
  {
    name: "Calls",
    envKey: "NOTION_CALLS_DB_ID",
    properties: {
      Name: { title: {} },
      Client: { relation: { single_property: {}, database_id: "CLIENTS_PLACEHOLDER" }},
      "Call Type": { select: { options: [
        { name: "kickoff", color: "blue" },
        { name: "strategy_review", color: "purple" },
        { name: "execution_check", color: "orange" },
        { name: "performance_review", color: "green" },
        { name: "graduation", color: "red" },
      ]}},
      Datetime: { date: {} },
      Status: { select: { options: [
        { name: "scheduled", color: "blue" },
        { name: "completed", color: "green" },
        { name: "cancelled", color: "red" },
      ]}},
      "Meeting Link": { url: {} },
      Notes: { rich_text: {} },
      "Recording URL": { url: {} },
    },
  },
];

async function createDatabases() {
  console.log("🚀 Memulai pembuatan database Notion...\n");

  const createdIds: Record<string, string> = {};
  const envUpdates: string[] = [];

  // First pass: Create databases without relations
  for (const db of DATABASES) {
    console.log(`📦 Membuat database: ${db.name}...`);

    // Remove relation properties for first pass
    const propertiesWithoutRelations: Record<string, any> = {};
    for (const [key, value] of Object.entries(db.properties)) {
      if (!("relation" in value)) {
        propertiesWithoutRelations[key] = value;
      }
    }

    try {
      const response = await notion.databases.create({
        parent: { page_id: PARENT_PAGE_ID },
        title: [{ type: "text", text: { content: db.name } }],
        properties: propertiesWithoutRelations,
      });

      createdIds[db.name] = response.id;
      envUpdates.push(`${db.envKey}=${response.id}`);
      console.log(`   ✅ Berhasil! ID: ${response.id}`);
    } catch (error: any) {
      console.error(`   ❌ Gagal: ${error.message}`);
      process.exit(1);
    }
  }

  console.log("\n🔗 Menambahkan relasi antar database...\n");

  // Second pass: Add relation properties
  for (const db of DATABASES) {
    const relationProps: Record<string, any> = {};

    for (const [key, value] of Object.entries(db.properties)) {
      if ("relation" in value) {
        const placeholder = value.relation.database_id as string;
        let targetDbName = "";

        if (placeholder === "CLIENTS_PLACEHOLDER") targetDbName = "Clients";
        else if (placeholder === "MODULES_PLACEHOLDER") targetDbName = "Modules";
        else if (placeholder === "LESSONS_PLACEHOLDER") targetDbName = "Lessons";
        else if (placeholder === "CONTENT_PILLARS_PLACEHOLDER") targetDbName = "Content Pillars";
        else if (placeholder === "CONTENT_ITEMS_PLACEHOLDER") targetDbName = "Content Items";
        else if (placeholder === "SUBMISSIONS_PLACEHOLDER") targetDbName = "Submissions";

        if (targetDbName && createdIds[targetDbName]) {
          relationProps[key] = {
            relation: {
              database_id: createdIds[targetDbName],
              single_property: {},
            },
          };
        }
      }
    }

    if (Object.keys(relationProps).length > 0) {
      console.log(`🔗 Menambahkan relasi ke ${db.name}...`);
      try {
        await notion.databases.update({
          database_id: createdIds[db.name],
          properties: relationProps,
        });
        console.log(`   ✅ Berhasil!`);
      } catch (error: any) {
        console.error(`   ⚠️ Gagal menambah relasi: ${error.message}`);
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ SELESAI! Database berhasil dibuat.\n");
  console.log("Tambahkan baris berikut ke file .env.local:\n");
  console.log(envUpdates.join("\n"));
  console.log("\n" + "=".repeat(60));

  // Also save to a file
  const envContent = envUpdates.join("\n");
  fs.writeFileSync(
    path.join(process.cwd(), "notion-db-ids.txt"),
    envContent
  );
  console.log("\n📄 Database IDs juga disimpan di: notion-db-ids.txt");
}

createDatabases().catch(console.error);
