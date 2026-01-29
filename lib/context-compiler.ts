import crypto from "crypto";
import {
  getClientById,
  getKnowledgeBank,
  getClientICP,
  getTargetAudiences,
  getClientProducts,
  getClientPillarsExtended,
  getClientCompiledContext,
  updateClientCompiledContext,
  KnowledgeBankItem,
  ClientICP,
  TargetAudience,
} from "./notion";

interface CompiledContext {
  context: string;
  hash: string;
  compiledAt: string;
}

/**
 * Compress text by removing extra whitespace and limiting length
 */
function compressText(text: string, maxLength: number = 200): string {
  return text
    .replace(/\n+/g, " ")           // Remove newlines
    .replace(/\s+/g, " ")           // Collapse spaces
    .replace(/["""]/g, '"')         // Normalize quotes
    .trim()
    .slice(0, maxLength);
}

/**
 * Generate MD5 hash for cache validation
 */
function generateHash(content: string): string {
  return crypto.createHash("md5").update(content).digest("hex").slice(0, 16);
}

/**
 * Group array by a key
 */
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const group = String(item[key]);
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Format price for display
 */
function formatPrice(priceMin: number, priceMax: number, priceType: string): string {
  const format = (n: number) => {
    if (n >= 1000000) return `Rp${(n / 1000000).toFixed(1)}jt`;
    if (n >= 1000) return `Rp${(n / 1000)}K`;
    return `Rp${n}`;
  };

  if (priceType === "Range" && priceMax > priceMin) {
    return `${format(priceMin)}-${format(priceMax)}`;
  }
  if (priceType === "Starting From") {
    return `Mulai ${format(priceMin)}`;
  }
  return format(priceMin);
}

/**
 * Compile all client data into a compressed context string for AI
 */
export async function compileClientContext(clientId: string): Promise<CompiledContext> {
  // Fetch all data in parallel
  const [client, knowledgeBank, icp, audiences, products, pillars] = await Promise.all([
    getClientById(clientId),
    getKnowledgeBank(clientId, { includeInBrief: true, isActive: true }),
    getClientICP(clientId),
    getTargetAudiences(clientId),
    getClientProducts(clientId, { isActive: true }),
    getClientPillarsExtended(clientId),
  ]);

  if (!client) {
    throw new Error("Client not found");
  }

  // Build compressed context
  let context = `[CLIENT]\n${client.businessName} | ${client.industry || "General"} | @${client.clientCode || client.businessName.toLowerCase().replace(/\s+/g, "")}\n\n`;

  // Knowledge Bank (grouped by category)
  if (knowledgeBank.length > 0) {
    context += `[KNOWLEDGE]\n`;
    const grouped = groupBy(knowledgeBank, "category");

    const categoryTags: Record<string, string> = {
      "Brand": "brand",
      "Product": "product",
      "Audience": "audience",
      "Competitor": "competitor",
      "Other": "other",
    };

    for (const [category, items] of Object.entries(grouped)) {
      const tag = categoryTags[category] || "other";
      const sortedItems = items.sort((a: KnowledgeBankItem, b: KnowledgeBankItem) => a.priority - b.priority);

      context += `<${tag}>\n`;
      for (const item of sortedItems) {
        context += compressText(item.content, 300) + "\n";
      }
      context += `</${tag}>\n`;
    }
    context += "\n";
  }

  // ICP (Ideal Customer Profile)
  if (icp) {
    context += `[ICP]\n`;
    if (icp.demographics) context += `Demo: ${compressText(icp.demographics)}\n`;
    if (icp.psychographics) context += `Psycho: ${compressText(icp.psychographics)}\n`;
    if (icp.painPoints) context += `Pain: ${compressText(icp.painPoints)}\n`;
    if (icp.goals) context += `Goals: ${compressText(icp.goals)}\n`;
    if (icp.objections) context += `Objections: ${compressText(icp.objections)}\n`;
    if (icp.whereTheyHangOut) context += `Hangout: ${compressText(icp.whereTheyHangOut)}\n`;
    if (icp.buyingBehavior) context += `Buying: ${compressText(icp.buyingBehavior)}\n`;
    context += "\n";
  }

  // Target Audiences
  if (audiences.length > 0) {
    context += `[AUDIENCES]\n`;
    for (const aud of audiences.slice(0, 3)) {
      context += `• ${aud.segmentName}: ${aud.description || ""} | ${aud.ageRange || ""} ${aud.gender || ""}\n`;
      if (aud.interests) context += `  Interests: ${compressText(aud.interests, 100)}\n`;
      if (aud.painPoints) context += `  Pain: ${compressText(aud.painPoints, 100)}\n`;
    }
    context += "\n";
  }

  // Products (featured first, max 10)
  if (products.length > 0) {
    const sortedProducts = [...products]
      .sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0))
      .slice(0, 10);

    context += `[PRODUCTS]\n`;
    for (const p of sortedProducts) {
      const price = formatPrice(p.priceMin, p.priceMax, p.priceType);
      const featured = p.isFeatured ? "⭐ " : "";
      context += `• ${featured}${p.productName} | ${price} | ${compressText(p.description, 100)}\n`;
    }
    context += "\n";
  }

  // Pillars
  if (pillars.length > 0) {
    context += `[PILLARS]\n`;
    for (const pillar of pillars) {
      const hooks = pillar.hookStyles?.length ? pillar.hookStyles.join(",") : "Various";
      context += `• ${pillar.emoji || "📌"} ${pillar.name} | ${pillar.targetEmotion || "Educate"} | Hook:${hooks} | CTA:${pillar.ctaType || "Follow"}\n`;
    }
    context += "\n";
  }

  // Generate hash
  const hash = generateHash(context);
  const compiledAt = new Date().toISOString();

  return {
    context,
    hash,
    compiledAt,
  };
}

/**
 * Get context from cache or compile fresh
 */
export async function getOrCompileContext(clientId: string, forceRecompile: boolean = false): Promise<CompiledContext> {
  if (!forceRecompile) {
    // Try to get cached context
    const cached = await getClientCompiledContext(clientId);
    if (cached && cached.context && cached.hash) {
      return {
        context: cached.context,
        hash: cached.hash,
        compiledAt: "", // We don't store this in cache
      };
    }
  }

  // Compile fresh context
  const compiled = await compileClientContext(clientId);

  // Save to cache
  await updateClientCompiledContext(clientId, compiled.context, compiled.hash);

  return compiled;
}

/**
 * Check if context needs recompilation by comparing hashes
 */
export async function shouldRecompileContext(clientId: string): Promise<boolean> {
  try {
    // Get cached hash
    const cached = await getClientCompiledContext(clientId);
    if (!cached || !cached.hash) return true;

    // Compile current context to get new hash
    const current = await compileClientContext(clientId);

    // Compare hashes
    return cached.hash !== current.hash;
  } catch {
    return true;
  }
}
