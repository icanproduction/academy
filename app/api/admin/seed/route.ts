import { NextResponse } from "next/server";
import { notion, DB } from "@/lib/notion";

// This endpoint seeds test data to Notion databases
// Access via: GET /api/admin/seed
export async function GET() {
  try {
    const results: string[] = [];

    // 1. Create test clients
    const clientsToCreate = [
      {
        name: "Kedai Kopi Nusantara",
        industry: "F&B / Coffee Shop",
        contactPerson: "Budi Santoso",
        email: "budi@kedaikopi.id",
        phone: "+62 812 3456 7890",
        status: "active",
        role: "client",
        startDate: "2024-12-20",
      },
      {
        name: "Skin Glow Beauty",
        industry: "Beauty / Skincare",
        contactPerson: "Anisa Putri",
        email: "anisa@skinglow.co",
        phone: "+62 878 9012 3456",
        status: "active",
        role: "client",
        startDate: "2025-01-25",
      },
      {
        name: "FitZone Gym",
        industry: "Health & Fitness",
        contactPerson: "Reza Mahendra",
        email: "reza@fitzone.id",
        phone: "+62 856 7890 1234",
        status: "active",
        role: "client",
        startDate: "2024-11-10",
      },
    ];

    const createdClientIds: string[] = [];

    for (const client of clientsToCreate) {
      // Check if client already exists
      const existing = await notion.databases.query({
        database_id: DB.clients,
        filter: { property: "Email", email: { equals: client.email } },
      });

      if (existing.results.length > 0) {
        createdClientIds.push(existing.results[0].id);
        results.push(`Client ${client.name} already exists`);
        continue;
      }

      const page = await notion.pages.create({
        parent: { database_id: DB.clients },
        properties: {
          Name: { title: [{ text: { content: client.name } }] },
          Industry: { rich_text: [{ text: { content: client.industry } }] },
          "Contact Person": { rich_text: [{ text: { content: client.contactPerson } }] },
          Email: { email: client.email },
          Phone: { phone_number: client.phone },
          Status: { select: { name: client.status } },
          Role: { select: { name: client.role } },
          "Start Date": { date: { start: client.startDate } },
        },
      });
      createdClientIds.push(page.id);
      results.push(`Created client: ${client.name}`);
    }

    // 2. Create admin user
    const adminEmail = "admin@ican.id";
    const existingAdmin = await notion.databases.query({
      database_id: DB.clients,
      filter: { property: "Email", email: { equals: adminEmail } },
    });

    if (existingAdmin.results.length === 0) {
      await notion.pages.create({
        parent: { database_id: DB.clients },
        properties: {
          Name: { title: [{ text: { content: "iCAN Admin" } }] },
          "Contact Person": { rich_text: [{ text: { content: "Eric" } }] },
          Email: { email: adminEmail },
          Status: { select: { name: "active" } },
          Role: { select: { name: "admin" } },
        },
      });
      results.push("Created admin user");
    } else {
      results.push("Admin user already exists");
    }

    // 3. Create modules (without relation since Lessons doesn't have Module relation yet)
    const modulesToCreate = [
      { title: "Content Strategy", description: "Bangun fondasi sistem konten kamu — pilar, platform, dan audiens.", order: 1, durationHours: 1.5 },
      { title: "Visual System", description: "Buat identitas visual yang konsisten dan mudah direplikasi tim kamu.", order: 2, durationHours: 1.5 },
      { title: "Voice & Messaging", description: "Tentukan cara brand kamu berbicara — tone, kosakata, dan formula caption.", order: 3, durationHours: 1.5 },
      { title: "Workflow Mastery", description: "Setup workflow produksi, tools, dan proses approval.", order: 4, durationHours: 1.5 },
      { title: "Performance & Optimization", description: "Ukur, analisis, dan tingkatkan output konten secara berkelanjutan.", order: 5, durationHours: 1 },
    ];

    const createdModuleIds: string[] = [];

    for (const mod of modulesToCreate) {
      const existing = await notion.databases.query({
        database_id: DB.modules,
        filter: { property: "Name", title: { equals: mod.title } },
      });

      if (existing.results.length > 0) {
        createdModuleIds.push(existing.results[0].id);
        results.push(`Module ${mod.title} already exists`);
        continue;
      }

      const page = await notion.pages.create({
        parent: { database_id: DB.modules },
        properties: {
          Name: { title: [{ text: { content: mod.title } }] },
          Description: { rich_text: [{ text: { content: mod.description } }] },
          Order: { number: mod.order },
          "Duration Hours": { number: mod.durationHours },
        },
      });
      createdModuleIds.push(page.id);
      results.push(`Created module: ${mod.title}`);
    }

    // 4. Create lessons (without Module relation for now)
    const allLessons = [
      { title: "Pengenalan Content Strategy", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 8, order: 1, moduleIndex: 0 },
      { title: "Menentukan Content Pillars", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 12, order: 2, moduleIndex: 0 },
      { title: "Strategi Platform", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 15, order: 3, moduleIndex: 0 },
      { title: "Membangun Content Calendar", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 10, order: 4, moduleIndex: 0 },
      { title: "Dasar Visual Identity Brand", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 10, order: 1, moduleIndex: 1 },
      { title: "Membangun Color Palette", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 12, order: 2, moduleIndex: 1 },
      { title: "Aturan Tipografi & Layout", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 14, order: 3, moduleIndex: 1 },
      { title: "Panduan Gaya Foto & Video", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 11, order: 4, moduleIndex: 1 },
      { title: "Menemukan Brand Voice", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 10, order: 1, moduleIndex: 2 },
      { title: "Tone Matrix & Guidelines", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 12, order: 2, moduleIndex: 2 },
      { title: "Formula Menulis Caption", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 15, order: 3, moduleIndex: 2 },
      { title: "Strategi Hashtag & CTA", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 8, order: 4, moduleIndex: 2 },
      { title: "Setup Production Pipeline", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 14, order: 1, moduleIndex: 3 },
      { title: "Konfigurasi Tool Stack", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 10, order: 2, moduleIndex: 3 },
      { title: "Proses Approval & QC", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 12, order: 3, moduleIndex: 3 },
      { title: "Metode Batch Production", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 10, order: 4, moduleIndex: 3 },
      { title: "KPI yang Benar-Benar Penting", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 12, order: 1, moduleIndex: 4 },
      { title: "Review Mingguan & Bulanan", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 10, order: 2, moduleIndex: 4 },
      { title: "Playbook Optimisasi", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 8, order: 3, moduleIndex: 4 },
    ];

    for (const lesson of allLessons) {
      const existing = await notion.databases.query({
        database_id: DB.lessons,
        filter: { property: "Name", title: { equals: lesson.title } },
      });

      if (existing.results.length > 0) {
        results.push(`Lesson ${lesson.title} already exists`);
        continue;
      }

      await notion.pages.create({
        parent: { database_id: DB.lessons },
        properties: {
          Name: { title: [{ text: { content: lesson.title } }] },
          "YouTube Video ID": { rich_text: [{ text: { content: lesson.youtubeVideoId } }] },
          "Duration Minutes": { number: lesson.durationMinutes },
          Order: { number: lesson.order },
        },
      });
      results.push(`Created lesson: ${lesson.title}`);
    }

    // 5. Create assets
    const assetsToCreate = [
      { name: "Logo Collection", category: "Logo", fileType: "SVG/PNG" },
      { name: "Brand Fonts Package", category: "Fonts", fileType: "TTF/OTF" },
      { name: "Instagram Templates", category: "Templates", fileType: "PSD/AI" },
      { name: "Product Photos", category: "Photos", fileType: "JPG/PNG" },
      { name: "Icon Set", category: "Icons", fileType: "SVG" },
    ];

    for (const asset of assetsToCreate) {
      const existing = await notion.databases.query({
        database_id: DB.assets,
        filter: { property: "Name", title: { equals: asset.name } },
      });

      if (existing.results.length > 0) {
        results.push(`Asset ${asset.name} already exists`);
        continue;
      }

      await notion.pages.create({
        parent: { database_id: DB.assets },
        properties: {
          Name: { title: [{ text: { content: asset.name } }] },
          Category: { select: { name: asset.category } },
          "File Type": { rich_text: [{ text: { content: asset.fileType } }] },
          "Created At": { date: { start: new Date().toISOString().split("T")[0] } },
        },
      });
      results.push(`Created asset: ${asset.name}`);
    }

    return NextResponse.json({
      success: true,
      message: "Seed completed",
      clientsCreated: createdClientIds.length,
      modulesCreated: createdModuleIds.length,
      results,
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
