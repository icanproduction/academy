import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DB = {
  clients: process.env.NOTION_CLIENTS_DB_ID!,
  contentPillars: process.env.NOTION_CONTENT_PILLARS_DB_ID!,
  clientICP: process.env.NOTION_CLIENT_ICP_DB_ID || "",
  clientProducts: process.env.NOTION_CLIENT_PRODUCTS_DB_ID || "",
  knowledgeBank: process.env.NOTION_KNOWLEDGE_BANK_DB_ID || "",
};

export async function POST(request: NextRequest) {
  try {
    // 1. Find PGN LNG client or create if not exists
    const existingClients = await notion.databases.query({
      database_id: DB.clients,
      filter: {
        property: "Name",
        title: { contains: "PGN LNG" },
      },
    });

    let clientId: string;

    if (existingClients.results.length > 0) {
      clientId = existingClients.results[0].id;
      console.log("Found existing PGN LNG client:", clientId);
    } else {
      // Create new client - using same structure as clients/route.ts
      const newClient = await notion.pages.create({
        parent: { database_id: DB.clients },
        properties: {
          Name: { title: [{ text: { content: "PGN LNG Indonesia" } }] },
          Industry: { rich_text: [{ text: { content: "Energy & Gas" } }] },
          "Contact Person": { rich_text: [{ text: { content: "Ahmad Fauzi" } }] },
          Email: { email: "marketing@pgnlng.co.id" },
          Phone: { phone_number: "+62811234567" },
          Status: { select: { name: "active" } },
          Role: { select: { name: "client" } },
          "Start Date": { date: { start: "2025-01-15" } },
        },
      });
      clientId = newClient.id;
      console.log("Created new PGN LNG client:", clientId);
    }

    // 2. Create Content Pillars
    const pillarsData = [
      {
        name: "Educate",
        emoji: "📚",
        description: "Konten edukasi tentang LNG, energi bersih, dan proses produksi gas alam. Membantu audiens memahami industri energi secara mendalam.",
        targetRatio: 40,
        color: "blue",
        examples: "Apa itu LNG?, Proses Pencairan Gas Alam, Keunggulan LNG vs BBM, Fakta Menarik Industri Energi",
        dos: "Gunakan infografis dan data, Bahasa sederhana mudah dipahami, Sertakan sumber terpercaya",
        donts: "Jangan terlalu teknis, Hindari jargon berlebihan, Jangan menyerang kompetitor",
        objective: "Meningkatkan awareness dan pemahaman tentang LNG sebagai energi bersih masa depan",
        targetEmotion: "Educate",
        hookStyles: ["Pertanyaan", "Fakta Mengejutkan", "Mitos vs Fakta"],
        ctaType: "Save",
      },
      {
        name: "Inspire",
        emoji: "💡",
        description: "Konten inspiratif tentang kontribusi PGN LNG terhadap lingkungan, sustainability, dan masa depan energi Indonesia.",
        targetRatio: 30,
        color: "green",
        examples: "Komitmen Net Zero, Dampak Positif LNG untuk Lingkungan, Kisah Sukses Transisi Energi, Inovasi Teknologi LNG",
        dos: "Tunjukkan dampak positif, Cerita human interest, Visual yang memukau",
        donts: "Jangan terkesan greenwashing, Hindari klaim tanpa bukti, Jangan over-promise",
        objective: "Membangun citra positif dan kepercayaan terhadap komitmen sustainability PGN LNG",
        targetEmotion: "Inspire",
        hookStyles: ["Story Opening", "Emotional Statement", "Vision of Future"],
        ctaType: "Follow",
      },
      {
        name: "Engage",
        emoji: "🎯",
        description: "Konten interaktif dan behind-the-scene yang mengajak audiens berpartisipasi dan mengenal PGN LNG lebih dekat.",
        targetRatio: 30,
        color: "orange",
        examples: "Day in the Life Engineer LNG, Tour Virtual Kilang, Quiz Seputar Energi, Q&A dengan Expert",
        dos: "Ajak interaksi (polling, quiz), Tunjukkan sisi human, Respon komentar aktif",
        donts: "Jangan monoton, Hindari konten terlalu formal, Jangan abaikan pertanyaan audiens",
        objective: "Meningkatkan engagement rate dan membangun komunitas yang loyal",
        targetEmotion: "Entertain",
        hookStyles: ["Behind The Scene", "Challenge", "Interactive Question"],
        ctaType: "Comment",
      },
    ];

    // Delete existing pillars for this client
    const existingPillars = await notion.databases.query({
      database_id: DB.contentPillars,
      filter: { property: "Client", relation: { contains: clientId } },
    });

    for (const pillar of existingPillars.results) {
      await notion.pages.update({
        page_id: pillar.id,
        archived: true,
      });
    }

    // Create new pillars
    for (let i = 0; i < pillarsData.length; i++) {
      const p = pillarsData[i];
      await notion.pages.create({
        parent: { database_id: DB.contentPillars },
        properties: {
          Name: { title: [{ text: { content: p.name } }] },
          Client: { relation: [{ id: clientId }] },
          Emoji: { rich_text: [{ text: { content: p.emoji } }] },
          Description: { rich_text: [{ text: { content: p.description } }] },
          "Target Ratio": { number: p.targetRatio },
          Color: { select: { name: p.color } },
          Examples: { rich_text: [{ text: { content: p.examples } }] },
          Dos: { rich_text: [{ text: { content: p.dos } }] },
          Donts: { rich_text: [{ text: { content: p.donts } }] },
          Order: { number: i + 1 },
          Active: { checkbox: true },
        },
      });
    }
    console.log("Created 3 content pillars");

    // 3. Create ICPs
    const icpData = [
      {
        icpName: "Profesional Muda Urban",
        ageRange: "25-35 tahun",
        gender: ["Pria", "Wanita"],
        location: ["Jakarta", "Surabaya", "Bandung"],
        occupation: "Karyawan kantoran, startup, professional di bidang teknik/bisnis",
        interests: ["Sustainability", "Teknologi", "Investasi", "Karir"],
        painPoints: "Khawatir dengan polusi dan perubahan iklim, ingin berkontribusi tapi tidak tahu caranya",
        goals: "Memahami energi bersih dan cara berkontribusi untuk lingkungan yang lebih baik",
        contentPreferences: "Video pendek, infografis, konten edukasi ringan",
        isPrimary: true,
      },
      {
        icpName: "Pelaku Industri B2B",
        ageRange: "35-50 tahun",
        gender: ["Pria"],
        location: ["Seluruh Indonesia"],
        occupation: "Pemilik pabrik, manager operasional, procurement",
        interests: ["Efisiensi Operasional", "Cost Reduction", "Regulasi Energi"],
        painPoints: "Biaya energi tinggi, tekanan regulasi untuk transisi energi bersih",
        goals: "Menemukan solusi energi yang efisien dan ramah lingkungan untuk bisnis",
        contentPreferences: "Studi kasus, data dan statistik, webinar",
        isPrimary: false,
      },
    ];

    let icpCreated = 0;
    // Delete existing ICPs - only if database ID exists
    if (DB.clientICP && DB.clientICP.length > 0) {
      const existingICPs = await notion.databases.query({
        database_id: DB.clientICP,
        filter: { property: "Client", relation: { contains: clientId } },
      });

      for (const icp of existingICPs.results) {
        await notion.pages.update({
          page_id: icp.id,
          archived: true,
        });
      }

      // Create new ICPs
      for (const icp of icpData) {
        await notion.pages.create({
          parent: { database_id: DB.clientICP },
          properties: {
            "ICP Name": { title: [{ text: { content: icp.icpName } }] },
            Client: { relation: [{ id: clientId }] },
            "Age Range": { rich_text: [{ text: { content: icp.ageRange } }] },
            Gender: { multi_select: icp.gender.map((g) => ({ name: g })) },
            Location: { multi_select: icp.location.map((l) => ({ name: l })) },
            Occupation: { rich_text: [{ text: { content: icp.occupation } }] },
            Interests: { multi_select: icp.interests.map((i) => ({ name: i })) },
            "Pain Points": { rich_text: [{ text: { content: icp.painPoints } }] },
            Goals: { rich_text: [{ text: { content: icp.goals } }] },
            "Content Preferences": { rich_text: [{ text: { content: icp.contentPreferences } }] },
            "Is Primary": { checkbox: icp.isPrimary },
          },
        });
      }
      icpCreated = icpData.length;
      console.log("Created 2 ICPs");
    } else {
      console.log("Skipping ICPs - database ID not configured");
    }

    // 4. Create Products/Services
    const productsData = [
      {
        productName: "LNG Supply & Distribution",
        category: "Service",
        description: "Pasokan LNG untuk industri dengan infrastruktur distribusi terintegrasi dari hulu ke hilir.",
        keyBenefits: "Pasokan stabil dan terjamin, Harga kompetitif, Infrastruktur lengkap dari terminal hingga end-user",
        priceType: "Range",
        priceMin: 500000000,
        priceMax: 5000000000,
        usp: "Satu-satunya penyedia LNG terintegrasi dengan jaringan pipa gas terluas di Indonesia",
        isFeatured: true,
      },
      {
        productName: "LNG untuk Transportasi",
        category: "Product",
        description: "Solusi LNG sebagai bahan bakar alternatif untuk armada truk dan kapal, lebih bersih dari diesel.",
        keyBenefits: "Emisi 20% lebih rendah dari diesel, Biaya operasional lebih hemat, Dukungan infrastruktur SPBG",
        priceType: "Fixed",
        priceMin: 8500,
        priceMax: 0,
        usp: "Jaringan SPBG LNG terluas untuk mendukung logistik bersih Indonesia",
        isFeatured: true,
      },
      {
        productName: "Virtual Pipeline LNG",
        category: "Service",
        description: "Layanan distribusi LNG menggunakan ISO Tank untuk area yang belum terjangkau jaringan pipa.",
        keyBenefits: "Akses LNG tanpa perlu infrastruktur pipa, Fleksibel untuk berbagai skala kebutuhan",
        priceType: "Starting From",
        priceMin: 100000000,
        priceMax: 0,
        usp: "Solusi praktis untuk industri di remote area dengan jaminan pasokan konsisten",
        isFeatured: false,
      },
    ];

    let productsCreated = 0;
    if (DB.clientProducts && DB.clientProducts.length > 0) {
      // Delete existing products
      const existingProducts = await notion.databases.query({
        database_id: DB.clientProducts,
        filter: { property: "Client", relation: { contains: clientId } },
      });

      for (const prod of existingProducts.results) {
        await notion.pages.update({
          page_id: prod.id,
          archived: true,
        });
      }

      // Create new products
      for (const prod of productsData) {
        await notion.pages.create({
          parent: { database_id: DB.clientProducts },
          properties: {
            "Product Name": { title: [{ text: { content: prod.productName } }] },
            Client: { relation: [{ id: clientId }] },
            Category: { select: { name: prod.category } },
            Description: { rich_text: [{ text: { content: prod.description } }] },
            "Key Benefits": { rich_text: [{ text: { content: prod.keyBenefits } }] },
            "Price Type": { select: { name: prod.priceType } },
            "Price Min": { number: prod.priceMin },
            "Price Max": { number: prod.priceMax },
            USP: { rich_text: [{ text: { content: prod.usp } }] },
            "Is Featured": { checkbox: prod.isFeatured },
            "Is Active": { checkbox: true },
          },
        });
      }
      productsCreated = productsData.length;
      console.log("Created 3 products");
    } else {
      console.log("Skipping Products - database ID not configured");
    }

    // 5. Create Knowledge Bank items
    const knowledgeData = [
      {
        title: "Brand Story",
        category: "Brand",
        content: "PGN LNG Indonesia adalah anak perusahaan PT Perusahaan Gas Negara yang fokus pada bisnis LNG (Liquefied Natural Gas). Sebagai pionir dalam distribusi gas bumi di Indonesia, PGN LNG berkomitmen untuk menyediakan solusi energi bersih yang mendukung transisi energi nasional menuju net zero emission. Dengan pengalaman puluhan tahun dan jaringan infrastruktur terluas, PGN LNG menjadi mitra terpercaya untuk kebutuhan energi industri Indonesia.",
        priority: 1,
        includeInBrief: true,
      },
      {
        title: "Brand Voice & Tone",
        category: "Brand",
        content: "Profesional namun approachable. Gunakan bahasa yang mudah dipahami masyarakat umum, hindari jargon teknis berlebihan. Tone: Terpercaya, Inovatif, Peduli Lingkungan, Nasionalis. Selalu tekankan komitmen terhadap Indonesia dan sustainability.",
        priority: 2,
        includeInBrief: true,
      },
      {
        title: "Key Messages",
        category: "Brand",
        content: "1) LNG adalah energi bersih masa depan Indonesia. 2) PGN LNG mendukung transisi energi untuk Indonesia yang lebih hijau. 3) Infrastruktur terintegrasi dari hulu ke hilir. 4) Partner terpercaya untuk kebutuhan energi industri.",
        priority: 3,
        includeInBrief: true,
      },
      {
        title: "Competitor Analysis",
        category: "Competitor",
        content: "Kompetitor utama: Pertamina (BBM & LPG), PLN (Listrik), Independent Power Producer. Keunggulan PGN LNG: Fokus khusus di gas bumi, jaringan pipa terluas, harga kompetitif untuk industri, komitmen sustainability yang kuat.",
        priority: 5,
        includeInBrief: false,
      },
      {
        title: "Content Guidelines",
        category: "Brand",
        content: "Warna utama: Biru PGN (#0066B3), Hijau sustainability. Hindari: Klaim berlebihan tanpa data, menyerang kompetitor langsung, konten kontroversial politik. Selalu sertakan: Hashtag #EnergiUntukIndonesia #LNGBersih, Logo PGN LNG di akhir video, Disclaimer jika ada data statistik.",
        priority: 4,
        includeInBrief: true,
      },
    ];

    let kbCreated = 0;
    if (DB.knowledgeBank && DB.knowledgeBank.length > 0) {
      // Delete existing knowledge items
      const existingKB = await notion.databases.query({
        database_id: DB.knowledgeBank,
        filter: { property: "Client", relation: { contains: clientId } },
      });

      for (const kb of existingKB.results) {
        await notion.pages.update({
          page_id: kb.id,
          archived: true,
        });
      }

      // Create new knowledge items
      for (const kb of knowledgeData) {
        await notion.pages.create({
          parent: { database_id: DB.knowledgeBank },
          properties: {
            Title: { title: [{ text: { content: kb.title } }] },
            Client: { relation: [{ id: clientId }] },
            Category: { select: { name: kb.category } },
            Content: { rich_text: [{ text: { content: kb.content } }] },
            Priority: { number: kb.priority },
            "Include in Brief": { checkbox: kb.includeInBrief },
            "Is Active": { checkbox: true },
          },
        });
      }
      kbCreated = knowledgeData.length;
      console.log("Created 5 knowledge bank items");
    } else {
      console.log("Skipping Knowledge Bank - database ID not configured");
    }

    return NextResponse.json({
      success: true,
      message: "Dummy data for PGN LNG Indonesia created successfully!",
      clientId,
      summary: {
        pillars: pillarsData.length,
        icps: icpCreated,
        products: productsCreated,
        knowledgeBank: kbCreated,
      },
      notes: {
        icpSkipped: !DB.clientICP || DB.clientICP.length === 0,
        productsSkipped: !DB.clientProducts || DB.clientProducts.length === 0,
        kbSkipped: !DB.knowledgeBank || DB.knowledgeBank.length === 0,
      },
    });
  } catch (error: any) {
    console.error("Error seeding PGN LNG data:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
