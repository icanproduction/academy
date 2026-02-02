import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY?.trim(),
});

// Helper to safely get and trim env var (also removes literal \n characters)
const getDbId = (envVar: string | undefined): string =>
  (envVar || "").replace(/\\n/g, "").trim();

const DB = {
  clients: getDbId(process.env.NOTION_CLIENTS_DB_ID),
  progress: getDbId(process.env.NOTION_PROGRESS_DB_ID),
  tasks: getDbId(process.env.NOTION_TASKS_DB_ID),
  modules: getDbId(process.env.NOTION_MODULES_DB_ID),
  lessons: getDbId(process.env.NOTION_LESSONS_DB_ID),
  lessonProgress: getDbId(process.env.NOTION_LESSON_PROGRESS_DB_ID),
  playbooks: getDbId(process.env.NOTION_PLAYBOOKS_DB_ID),
  contentPillars: getDbId(process.env.NOTION_CONTENT_PILLARS_DB_ID),
  contents: getDbId(process.env.NOTION_CONTENTS_DB_ID), // New main content table
  contentComments: getDbId(process.env.NOTION_CONTENT_COMMENTS_DB_ID), // New comments table
  contentReviews: getDbId(process.env.NOTION_CONTENT_REVIEWS_DB_ID), // New reviews table
  // Deprecated - keeping for backwards compatibility
  contentItems: getDbId(process.env.NOTION_CONTENT_ITEMS_DB_ID),
  submissions: getDbId(process.env.NOTION_SUBMISSIONS_DB_ID),
  reviews: getDbId(process.env.NOTION_REVIEWS_DB_ID),
  assets: getDbId(process.env.NOTION_ASSETS_DB_ID),
  calls: getDbId(process.env.NOTION_CALLS_DB_ID),
  // New databases for Client Portal & AI Brief Generator
  knowledgeBank: getDbId(process.env.NOTION_KNOWLEDGE_BANK_DB_ID),
  clientAssets: getDbId(process.env.NOTION_CLIENT_ASSETS_DB_ID),
  clientICP: getDbId(process.env.NOTION_CLIENT_ICP_DB_ID),
  clientProducts: getDbId(process.env.NOTION_CLIENT_PRODUCTS_DB_ID),
  reelsBriefs: getDbId(process.env.NOTION_REELS_BRIEFS_DB_ID),
  briefConversations: getDbId(process.env.NOTION_BRIEF_CONVERSATIONS_DB_ID),
  targetAudience: getDbId(process.env.NOTION_TARGET_AUDIENCE_DB_ID),
  // Content Chat History
  contentChatHistory: getDbId(process.env.NOTION_CONTENT_CHAT_HISTORY_DB_ID),
  // Notifications
  notifications: getDbId(process.env.NOTION_NOTIFICATIONS_DB_ID),
};

// Helper to extract text from Notion property
function getText(prop: any): any {
  if (!prop) return "";
  if (prop.type === "title") return prop.title?.[0]?.plain_text || "";
  if (prop.type === "rich_text") return prop.rich_text?.[0]?.plain_text || "";
  if (prop.type === "number") return String(prop.number ?? "");
  if (prop.type === "select") return prop.select?.name || "";
  if (prop.type === "multi_select") return prop.multi_select?.map((s: any) => s.name) || [];
  if (prop.type === "date") return prop.date?.start || "";
  if (prop.type === "email") return prop.email || "";
  if (prop.type === "phone_number") return prop.phone_number || "";
  if (prop.type === "url") return prop.url || "";
  if (prop.type === "checkbox") return prop.checkbox;
  if (prop.type === "relation") return prop.relation?.map((r: any) => r.id) || [];
  if (prop.type === "files") return prop.files?.map((f: any) => f.file?.url || f.external?.url || "") || [];
  return "";
}

function getNumber(prop: any): number {
  if (!prop) return 0;
  if (prop.type === "number") return prop.number ?? 0;
  return 0;
}

// Get full rich_text content (joins all blocks)
function getFullRichText(prop: any): string {
  if (!prop || prop.type !== "rich_text") return "";
  return prop.rich_text?.map((rt: any) => rt.plain_text || "").join("") || "";
}

// ========= CLIENTS =========

export async function getClientByEmail(email: string) {
  const res = await notion.databases.query({
    database_id: DB.clients,
    filter: { property: "Email", email: { equals: email } },
  });
  if (res.results.length === 0) return null;
  const page = res.results[0] as any;
  return {
    id: page.id,
    businessName: getText(page.properties["Name"]),
    industry: getText(page.properties["Industry"]),
    contactPerson: getText(page.properties["Contact Person"]),
    email: getText(page.properties["Email"]),
    phone: getText(page.properties["Phone"]),
    startDate: getText(page.properties["Start Date"]),
    endDate: getText(page.properties["End Date"]),
    status: getText(page.properties["Status"]),
    role: getText(page.properties["Role"]),
    notes: getText(page.properties["Notes"]),
  };
}

export async function getAllClients() {
  const res = await notion.databases.query({ database_id: DB.clients });
  return res.results.map((page: any) => ({
    id: page.id,
    businessName: getText(page.properties["Name"]),
    industry: getText(page.properties["Industry"]),
    contactPerson: getText(page.properties["Contact Person"]),
    email: getText(page.properties["Email"]),
    status: getText(page.properties["Status"]),
    role: getText(page.properties["Role"]),
    startDate: getText(page.properties["Start Date"]),
  }));
}

// ========= PROGRESS =========

export async function getClientProgress(clientId: string) {
  const res = await notion.databases.query({
    database_id: DB.progress,
    filter: { property: "Client", relation: { contains: clientId } },
  });
  if (res.results.length === 0) return null;
  const page = res.results[0] as any;
  return {
    id: page.id,
    currentPhase: getText(page.properties["Current Phase"]),
    currentDay: getNumber(page.properties["Current Day"]),
    completionPercentage: getNumber(page.properties["Completion Percentage"]),
    lastUpdated: getText(page.properties["Last Updated"]),
  };
}

// ========= TASKS =========

export async function getClientTasks(clientId: string) {
  const res = await notion.databases.query({
    database_id: DB.tasks,
    filter: { property: "Client", relation: { contains: clientId } },
    sorts: [{ property: "Week", direction: "ascending" }],
  });
  return res.results.map((page: any) => ({
    id: page.id,
    title: getText(page.properties["Name"]),
    description: getText(page.properties["Description"]),
    dueDate: getText(page.properties["Due Date"]),
    status: getText(page.properties["Status"]),
    phase: getText(page.properties["Phase"]),
    week: getNumber(page.properties["Week"]),
  }));
}

export async function updateTaskStatus(taskId: string, status: string) {
  await notion.pages.update({
    page_id: taskId,
    properties: {
      Status: { select: { name: status } },
    },
  });
}

// ========= MODULES & LESSONS =========

export async function getModules() {
  const res = await notion.databases.query({
    database_id: DB.modules,
    sorts: [{ property: "Order", direction: "ascending" }],
  });
  return res.results.map((page: any) => ({
    id: page.id,
    title: getText(page.properties["Name"]),
    description: getText(page.properties["Description"]),
    order: getNumber(page.properties["Order"]),
    thumbnailUrl: getText(page.properties["Thumbnail URL"]),
    durationHours: getNumber(page.properties["Duration Hours"]),
  }));
}

export async function getLessons(moduleId?: string) {
  const filter = moduleId
    ? { property: "Module", relation: { contains: moduleId } }
    : undefined;
  const res = await notion.databases.query({
    database_id: DB.lessons,
    filter,
    sorts: [{ property: "Order", direction: "ascending" }],
  });
  return res.results.map((page: any) => ({
    id: page.id,
    moduleId: getText(page.properties["Module"])?.[0] || "",
    title: getText(page.properties["Name"]),
    description: getText(page.properties["Description"]),
    youtubeVideoId: getText(page.properties["YouTube Video ID"]),
    durationMinutes: getNumber(page.properties["Duration Minutes"]),
    order: getNumber(page.properties["Order"]),
    resources: getText(page.properties["Resources"]),
  }));
}

export async function getLesson(lessonId: string) {
  const page = (await notion.pages.retrieve({ page_id: lessonId })) as any;
  return {
    id: page.id,
    moduleId: getText(page.properties["Module"])?.[0] || "",
    title: getText(page.properties["Name"]),
    description: getText(page.properties["Description"]),
    youtubeVideoId: getText(page.properties["YouTube Video ID"]),
    durationMinutes: getNumber(page.properties["Duration Minutes"]),
    order: getNumber(page.properties["Order"]),
    resources: getText(page.properties["Resources"]),
  };
}

// ========= LESSON PROGRESS =========

export async function getLessonProgress(clientId: string) {
  const res = await notion.databases.query({
    database_id: DB.lessonProgress,
    filter: { property: "Client", relation: { contains: clientId } },
  });
  return res.results.map((page: any) => ({
    id: page.id,
    lessonId: (getText(page.properties["Lesson"]) as any)?.[0] || "",
    status: getText(page.properties["Status"]),
    progressSeconds: getNumber(page.properties["Progress Seconds"]),
    completedAt: getText(page.properties["Completed At"]),
  }));
}

export async function upsertLessonProgress(
  clientId: string,
  lessonId: string,
  status: string,
  progressSeconds?: number
) {
  // Check if exists
  const res = await notion.databases.query({
    database_id: DB.lessonProgress,
    filter: {
      and: [
        { property: "Client", relation: { contains: clientId } },
        { property: "Lesson", relation: { contains: lessonId } },
      ],
    },
  });

  const props: any = {
    Status: { select: { name: status } },
  };
  if (progressSeconds !== undefined) {
    props["Progress Seconds"] = { number: progressSeconds };
  }
  if (status === "completed") {
    props["Completed At"] = { date: { start: new Date().toISOString().split("T")[0] } };
  }

  if (res.results.length > 0) {
    await notion.pages.update({ page_id: res.results[0].id, properties: props });
    return res.results[0].id;
  } else {
    const page = await notion.pages.create({
      parent: { database_id: DB.lessonProgress },
      properties: {
        Name: { title: [{ text: { content: `Progress` } }] },
        Client: { relation: [{ id: clientId }] },
        Lesson: { relation: [{ id: lessonId }] },
        ...props,
      },
    });
    return page.id;
  }
}

// ========= PLAYBOOKS =========

export async function getPlaybook(clientId: string) {
  const res = await notion.databases.query({
    database_id: DB.playbooks,
    filter: { property: "Client", relation: { contains: clientId } },
  });
  if (res.results.length === 0) return null;
  const page = res.results[0] as any;
  return {
    id: page.id,
    status: getText(page.properties["Status"]),
    version: getNumber(page.properties["Version"]),
    brandStory: getText(page.properties["Brand Story"]),
    brandPersonality: getText(page.properties["Brand Personality"]),
    targetAudience: getText(page.properties["Target Audience"]),
    colorPrimary: getText(page.properties["Color Primary"]),
    colorSecondary: getText(page.properties["Color Secondary"]),
    colorAccent: getText(page.properties["Color Accent"]),
    typographyHeading: getText(page.properties["Typography Heading"]),
    typographyBody: getText(page.properties["Typography Body"]),
    voiceTone: getText(page.properties["Voice Tone"]),
    vocabularyUse: getText(page.properties["Vocabulary Use"]),
    vocabularyAvoid: getText(page.properties["Vocabulary Avoid"]),
    contentPillars: getText(page.properties["Content Pillars"]),
    postingSchedule: getText(page.properties["Posting Schedule"]),
    lastUpdated: getText(page.properties["Last Updated"]),
  };
}

export async function upsertPlaybook(clientId: string, data: Record<string, any>) {
  const existing = await getPlaybook(clientId);

  const props: any = {};
  if (data.brandStory !== undefined) props["Brand Story"] = { rich_text: [{ text: { content: data.brandStory } }] };
  if (data.brandPersonality !== undefined) props["Brand Personality"] = { rich_text: [{ text: { content: data.brandPersonality } }] };
  if (data.targetAudience !== undefined) props["Target Audience"] = { rich_text: [{ text: { content: data.targetAudience } }] };
  if (data.colorPrimary !== undefined) props["Color Primary"] = { rich_text: [{ text: { content: data.colorPrimary } }] };
  if (data.colorSecondary !== undefined) props["Color Secondary"] = { rich_text: [{ text: { content: data.colorSecondary } }] };
  if (data.colorAccent !== undefined) props["Color Accent"] = { rich_text: [{ text: { content: data.colorAccent } }] };
  if (data.typographyHeading !== undefined) props["Typography Heading"] = { rich_text: [{ text: { content: data.typographyHeading } }] };
  if (data.typographyBody !== undefined) props["Typography Body"] = { rich_text: [{ text: { content: data.typographyBody } }] };
  if (data.voiceTone !== undefined) props["Voice Tone"] = { rich_text: [{ text: { content: data.voiceTone } }] };
  if (data.vocabularyUse !== undefined) props["Vocabulary Use"] = { rich_text: [{ text: { content: data.vocabularyUse } }] };
  if (data.vocabularyAvoid !== undefined) props["Vocabulary Avoid"] = { rich_text: [{ text: { content: data.vocabularyAvoid } }] };
  if (data.contentPillars !== undefined) props["Content Pillars"] = { rich_text: [{ text: { content: data.contentPillars } }] };
  if (data.postingSchedule !== undefined) props["Posting Schedule"] = { rich_text: [{ text: { content: data.postingSchedule } }] };
  if (data.status !== undefined) props["Status"] = { select: { name: data.status } };
  props["Last Updated"] = { date: { start: new Date().toISOString().split("T")[0] } };

  if (existing) {
    await notion.pages.update({ page_id: existing.id, properties: props });
    return existing.id;
  } else {
    const page = await notion.pages.create({
      parent: { database_id: DB.playbooks },
      properties: {
        Name: { title: [{ text: { content: "Brand Playbook" } }] },
        Client: { relation: [{ id: clientId }] },
        Version: { number: 1 },
        ...props,
      },
    });
    return page.id;
  }
}

// ========= CONTENT PILLARS =========

export async function getContentPillars(clientId: string) {
  const res = await notion.databases.query({
    database_id: DB.contentPillars,
    filter: { property: "Client", relation: { contains: clientId } },
  });
  return res.results.map((page: any) => ({
    id: page.id,
    name: getText(page.properties["Name"]),
    color: getText(page.properties["Color"]),
    ratioPercentage: getNumber(page.properties["Ratio Percentage"]),
    description: getText(page.properties["Description"]),
  }));
}

export async function createContentPillar(clientId: string, data: { name: string; color: string; ratioPercentage: number; description: string }) {
  const page = await notion.pages.create({
    parent: { database_id: DB.contentPillars },
    properties: {
      Name: { title: [{ text: { content: data.name } }] },
      Client: { relation: [{ id: clientId }] },
      Color: { select: { name: data.color } },
      "Ratio Percentage": { number: data.ratioPercentage },
      Description: { rich_text: [{ text: { content: data.description } }] },
    },
  });
  return page.id;
}

// ========= CONTENT ITEMS =========

export async function getContentItems(clientId: string, filters?: { month?: string; status?: string }) {
  const filterConditions: any[] = [
    { property: "Client", relation: { contains: clientId } },
  ];
  if (filters?.status) {
    filterConditions.push({ property: "Status", select: { equals: filters.status } });
  }

  const res = await notion.databases.query({
    database_id: DB.contentItems,
    filter: filterConditions.length > 1 ? { and: filterConditions } : filterConditions[0],
    sorts: [{ property: "Scheduled Date", direction: "ascending" }],
  });
  return res.results.map((page: any) => ({
    id: page.id,
    title: getText(page.properties["Name"]),
    contentType: getText(page.properties["Content Type"]),
    platform: getText(page.properties["Platform"]),
    pillarId: (getText(page.properties["Pillar"]) as any)?.[0] || "",
    scheduledDate: getText(page.properties["Scheduled Date"]),
    status: getText(page.properties["Status"]),
    files: getText(page.properties["Files"]),
    caption: getText(page.properties["Caption"]),
    hashtags: getText(page.properties["Hashtags"]),
    notes: getText(page.properties["Notes"]),
  }));
}

export async function createContentItem(clientId: string, data: Record<string, any>) {
  const props: any = {
    Name: { title: [{ text: { content: data.title || "Untitled" } }] },
    Client: { relation: [{ id: clientId }] },
  };
  if (data.contentType) props["Content Type"] = { select: { name: data.contentType } };
  if (data.platform) props["Platform"] = { multi_select: data.platform.map((p: string) => ({ name: p })) };
  if (data.scheduledDate) props["Scheduled Date"] = { date: { start: data.scheduledDate } };
  if (data.status) props["Status"] = { select: { name: data.status } };
  if (data.caption) props["Caption"] = { rich_text: [{ text: { content: data.caption } }] };
  if (data.hashtags) props["Hashtags"] = { rich_text: [{ text: { content: data.hashtags } }] };
  if (data.notes) props["Notes"] = { rich_text: [{ text: { content: data.notes } }] };

  const page = await notion.pages.create({
    parent: { database_id: DB.contentItems },
    properties: props,
  });
  return page.id;
}

export async function updateContentItem(itemId: string, data: Record<string, any>) {
  const props: any = {};
  if (data.title) props["Name"] = { title: [{ text: { content: data.title } }] };
  if (data.contentType) props["Content Type"] = { select: { name: data.contentType } };
  if (data.scheduledDate) props["Scheduled Date"] = { date: { start: data.scheduledDate } };
  if (data.status) props["Status"] = { select: { name: data.status } };
  if (data.caption) props["Caption"] = { rich_text: [{ text: { content: data.caption } }] };
  if (data.hashtags) props["Hashtags"] = { rich_text: [{ text: { content: data.hashtags } }] };
  if (data.notes) props["Notes"] = { rich_text: [{ text: { content: data.notes } }] };

  await notion.pages.update({ page_id: itemId, properties: props });
}

// ========= SUBMISSIONS =========

export async function getSubmissions(clientId?: string) {
  const filter = clientId
    ? { property: "Client", relation: { contains: clientId } }
    : undefined;
  const res = await notion.databases.query({
    database_id: DB.submissions,
    filter,
    sorts: [{ property: "Submitted At", direction: "descending" }],
  });
  return res.results.map((page: any) => ({
    id: page.id,
    clientId: (getText(page.properties["Client"]) as any)?.[0] || "",
    title: getText(page.properties["Name"]),
    contentItemIds: getText(page.properties["Content Items"]),
    files: getText(page.properties["Files"]),
    submittedAt: getText(page.properties["Submitted At"]),
    status: getText(page.properties["Status"]),
    notes: getText(page.properties["Notes"]),
  }));
}

export async function createSubmission(clientId: string, data: Record<string, any>) {
  const page = await notion.pages.create({
    parent: { database_id: DB.submissions },
    properties: {
      Name: { title: [{ text: { content: data.title || "New Submission" } }] },
      Client: { relation: [{ id: clientId }] },
      "Submitted At": { date: { start: new Date().toISOString().split("T")[0] } },
      Status: { select: { name: "submitted" } },
      Notes: { rich_text: [{ text: { content: data.notes || "" } }] },
    },
  });
  return page.id;
}

export async function updateSubmissionStatus(submissionId: string, status: string) {
  await notion.pages.update({
    page_id: submissionId,
    properties: { Status: { select: { name: status } } },
  });
}

// ========= REVIEWS =========

export async function getReviews(submissionId: string) {
  const res = await notion.databases.query({
    database_id: DB.reviews,
    filter: { property: "Submission", relation: { contains: submissionId } },
  });
  return res.results.map((page: any) => ({
    id: page.id,
    visualScore: getNumber(page.properties["Visual Score"]),
    captionScore: getNumber(page.properties["Caption Score"]),
    strategyScore: getNumber(page.properties["Strategy Score"]),
    feedbackText: getText(page.properties["Feedback Text"]),
    decision: getText(page.properties["Decision"]),
    reviewedAt: getText(page.properties["Reviewed At"]),
  }));
}

export async function createReview(submissionId: string, reviewerId: string, data: Record<string, any>) {
  const page = await notion.pages.create({
    parent: { database_id: DB.reviews },
    properties: {
      Name: { title: [{ text: { content: "Review" } }] },
      Submission: { relation: [{ id: submissionId }] },
      "Visual Score": { number: data.visualScore },
      "Caption Score": { number: data.captionScore },
      "Strategy Score": { number: data.strategyScore },
      "Feedback Text": { rich_text: [{ text: { content: data.feedbackText || "" } }] },
      Decision: { select: { name: data.decision } },
      "Reviewed At": { date: { start: new Date().toISOString().split("T")[0] } },
    },
  });
  return page.id;
}

// ========= ASSETS =========

export async function getAssets(category?: string) {
  const filter = category
    ? { property: "Category", select: { equals: category } }
    : undefined;
  const res = await notion.databases.query({
    database_id: DB.assets,
    filter,
    sorts: [{ property: "Created At", direction: "descending" }],
  });
  return res.results.map((page: any) => ({
    id: page.id,
    name: getText(page.properties["Name"]),
    category: getText(page.properties["Category"]),
    fileUrl: getText(page.properties["File URL"]),
    fileType: getText(page.properties["File Type"]),
    tags: getText(page.properties["Tags"]),
    createdAt: getText(page.properties["Created At"]),
  }));
}

// ========= CALLS =========

export async function getCalls(clientId: string) {
  const res = await notion.databases.query({
    database_id: DB.calls,
    filter: { property: "Client", relation: { contains: clientId } },
    sorts: [{ property: "Datetime", direction: "ascending" }],
  });
  return res.results.map((page: any) => ({
    id: page.id,
    callType: getText(page.properties["Call Type"]),
    datetime: getText(page.properties["Datetime"]),
    status: getText(page.properties["Status"]),
    meetingLink: getText(page.properties["Meeting Link"]),
    notes: getText(page.properties["Notes"]),
    recordingUrl: getText(page.properties["Recording URL"]),
  }));
}

// ========= NEW CONTENT SYSTEM =========

// Content Types
export type ContentType = "reels" | "carousel" | "story";
export type ContentPlatform = "instagram" | "tiktok";
export type ContentStatus =
  | "idea_draft"
  | "idea_submitted"
  | "idea_revision"
  | "production_ready"
  | "production_in_progress"
  | "production_submitted"
  | "production_revision"
  | "ready_to_post"
  | "posted";

export interface Content {
  id: string;
  uniqueId: string;
  clientId: string;
  pillarId: string;
  title: string;
  caption: string;
  contentType: ContentType;
  platforms: ContentPlatform[];
  publishDate: string;
  status: ContentStatus;
  referenceLinks: string;
  durationSeconds: number;
  audioReference: string;
  slideCount: number;
  slideNotes: string;
  ctaNotes: string;
  outputFiles: string[];
  outputUrl: string;
  thumbnail: string[];
  notes: string;
  createdAt: string;
  submittedAt: string;
  approvedAt: string;
  postedAt: string;
}

export interface ContentPillar {
  id: string;
  name: string;
  clientId: string;
  emoji: string;
  description: string;
  targetRatio: number;
  color: string;
  examples: string;
  dos: string;
  donts: string;
  order: number;
  active: boolean;
}

export interface ContentComment {
  id: string;
  contentId: string;
  authorId: string;
  authorName: string;
  message: string;
  attachments: string[];
  createdAt: string;
}

export interface ContentReview {
  id: string;
  contentId: string;
  reviewPhase: "ideation" | "production";
  reviewerId: string;
  reviewerName: string;
  decision: "approved" | "revision";
  feedback: string;
  conceptScore: number;
  visualScore: number;
  captionScore: number;
  createdAt: string;
}

// ========= CONTENT PILLARS (UPDATED) =========

export async function getClientPillars(clientId: string): Promise<ContentPillar[]> {
  try {
    // Query without Active filter first, then filter in code
    // This handles databases that may not have the Active property
    const res = await notion.databases.query({
      database_id: DB.contentPillars,
      filter: { property: "Client", relation: { contains: clientId } },
      sorts: [{ property: "Order", direction: "ascending" }],
    });

    return res.results
      .filter((page: any) => {
        // If Active property exists and is false, exclude it
        // Otherwise include the pillar
        const activeValue = page.properties["Active"]?.checkbox;
        return activeValue !== false;
      })
      .map((page: any) => ({
        id: page.id,
        name: getText(page.properties["Name"]),
        clientId: (getText(page.properties["Client"]) as any)?.[0] || "",
        emoji: getText(page.properties["Emoji"]) || "📌",
        description: getText(page.properties["Description"]),
        targetRatio: getNumber(page.properties["Target Ratio"]) || getNumber(page.properties["Ratio Percentage"]),
        color: getText(page.properties["Color"]) || "blue",
        examples: getText(page.properties["Examples"]),
        dos: getText(page.properties["Dos"]),
        donts: getText(page.properties["Donts"]),
        order: getNumber(page.properties["Order"]),
        active: page.properties["Active"]?.checkbox ?? true,
      }));
  } catch (error) {
    console.error("Error fetching pillars:", error);
    return [];
  }
}

export async function createPillar(clientId: string, data: Partial<ContentPillar>): Promise<string> {
  const page = await notion.pages.create({
    parent: { database_id: DB.contentPillars },
    properties: {
      Name: { title: [{ text: { content: data.name || "New Pillar" } }] },
      Client: { relation: [{ id: clientId }] },
      Emoji: { rich_text: [{ text: { content: data.emoji || "📌" } }] },
      Description: { rich_text: [{ text: { content: data.description || "" } }] },
      "Target Ratio": { number: data.targetRatio || 0 },
      Color: { select: { name: data.color || "blue" } },
      Examples: { rich_text: [{ text: { content: data.examples || "" } }] },
      Dos: { rich_text: [{ text: { content: data.dos || "" } }] },
      Donts: { rich_text: [{ text: { content: data.donts || "" } }] },
      Order: { number: data.order || 0 },
      Active: { checkbox: true },
    },
  });
  return page.id;
}

export async function updatePillar(pillarId: string, data: Partial<ContentPillar>): Promise<void> {
  const props: any = {};
  if (data.name !== undefined) props["Name"] = { title: [{ text: { content: data.name } }] };
  if (data.emoji !== undefined) props["Emoji"] = { rich_text: [{ text: { content: data.emoji } }] };
  if (data.description !== undefined) props["Description"] = { rich_text: [{ text: { content: data.description } }] };
  if (data.targetRatio !== undefined) props["Target Ratio"] = { number: data.targetRatio };
  if (data.color !== undefined) props["Color"] = { select: { name: data.color } };
  if (data.examples !== undefined) props["Examples"] = { rich_text: [{ text: { content: data.examples } }] };
  if (data.dos !== undefined) props["Dos"] = { rich_text: [{ text: { content: data.dos } }] };
  if (data.donts !== undefined) props["Donts"] = { rich_text: [{ text: { content: data.donts } }] };
  if (data.order !== undefined) props["Order"] = { number: data.order };
  if (data.active !== undefined) props["Active"] = { checkbox: data.active };

  await notion.pages.update({ page_id: pillarId, properties: props });
}

export async function deletePillar(pillarId: string): Promise<void> {
  // Soft delete - just set active to false
  await notion.pages.update({
    page_id: pillarId,
    properties: { Active: { checkbox: false } },
  });
}

// ========= CONTENTS =========

export async function generateContentUniqueId(clientId: string, contentType: ContentType): Promise<string> {
  // Get client code
  const client = await notion.pages.retrieve({ page_id: clientId }) as any;
  const clientCode = getText(client.properties["Client Code"]) || getText(client.properties["Name"]).substring(0, 8).toUpperCase().replace(/\s+/g, "");

  // Get type code
  const typeCode = { reels: "RL", carousel: "CR", story: "ST" }[contentType];

  // Count existing contents for this client + type
  const res = await notion.databases.query({
    database_id: DB.contents,
    filter: {
      and: [
        { property: "Client", relation: { contains: clientId } },
        { property: "Content Type", select: { equals: contentType } },
      ],
    },
  });

  const sequence = String(res.results.length + 1).padStart(3, "0");
  return `${clientCode}-${typeCode}-${sequence}`;
}

export async function getContents(clientId?: string, filters?: {
  status?: ContentStatus;
  contentType?: ContentType;
  platform?: ContentPlatform;
}): Promise<Content[]> {
  try {
    const filterConditions: any[] = [];

    if (clientId) {
      filterConditions.push({ property: "Client", relation: { contains: clientId } });
    }
    if (filters?.status) {
      filterConditions.push({ property: "Status", select: { equals: filters.status } });
    }
    if (filters?.contentType) {
      filterConditions.push({ property: "Content Type", select: { equals: filters.contentType } });
    }
    if (filters?.platform) {
      filterConditions.push({ property: "Platform", multi_select: { contains: filters.platform } });
    }

    const res = await notion.databases.query({
      database_id: DB.contents,
      filter: filterConditions.length > 1 ? { and: filterConditions } : filterConditions.length === 1 ? filterConditions[0] : undefined,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });

    return res.results.map((page: any) => ({
      id: page.id,
      uniqueId: getText(page.properties["Unique ID"]),
      clientId: (getText(page.properties["Client"]) as any)?.[0] || "",
      pillarId: (getText(page.properties["Pillar"]) as any)?.[0] || "",
      title: getText(page.properties["Title"]),
      caption: getText(page.properties["Caption"]),
      contentType: getText(page.properties["Content Type"]) as ContentType,
      platforms: getText(page.properties["Platform"]) as ContentPlatform[],
      publishDate: getText(page.properties["Publish Date"]),
      status: getText(page.properties["Status"]) as ContentStatus,
      referenceLinks: getText(page.properties["Reference Links"]),
      durationSeconds: getNumber(page.properties["Duration Seconds"]),
      audioReference: getText(page.properties["Audio Reference"]),
      slideCount: getNumber(page.properties["Slide Count"]),
      slideNotes: getText(page.properties["Slide Notes"]),
      ctaNotes: getText(page.properties["CTA Notes"]),
      outputFiles: getText(page.properties["Output Files"]) as string[],
      outputUrl: getText(page.properties["Output URL"]),
      thumbnail: getText(page.properties["Thumbnail"]) as string[],
      notes: getText(page.properties["Notes"]),
      createdAt: page.created_time,
      submittedAt: getText(page.properties["Submitted At"]),
      approvedAt: getText(page.properties["Approved At"]),
      postedAt: getText(page.properties["Posted At"]),
    }));
  } catch (error) {
    console.error("Error fetching contents:", error);
    return [];
  }
}

export async function getContent(contentId: string): Promise<Content | null> {
  try {
    const page = await notion.pages.retrieve({ page_id: contentId }) as any;
    return {
      id: page.id,
      uniqueId: getText(page.properties["Unique ID"]),
      clientId: (getText(page.properties["Client"]) as any)?.[0] || "",
      pillarId: (getText(page.properties["Pillar"]) as any)?.[0] || "",
      title: getText(page.properties["Title"]),
      caption: getText(page.properties["Caption"]),
      contentType: getText(page.properties["Content Type"]) as ContentType,
      platforms: getText(page.properties["Platform"]) as ContentPlatform[],
      publishDate: getText(page.properties["Publish Date"]),
      status: getText(page.properties["Status"]) as ContentStatus,
      referenceLinks: getText(page.properties["Reference Links"]),
      durationSeconds: getNumber(page.properties["Duration Seconds"]),
      audioReference: getText(page.properties["Audio Reference"]),
      slideCount: getNumber(page.properties["Slide Count"]),
      slideNotes: getText(page.properties["Slide Notes"]),
      ctaNotes: getText(page.properties["CTA Notes"]),
      outputFiles: getText(page.properties["Output Files"]) as string[],
      outputUrl: getText(page.properties["Output URL"]),
      thumbnail: getText(page.properties["Thumbnail"]) as string[],
      notes: getText(page.properties["Notes"]),
      createdAt: page.created_time,
      submittedAt: getText(page.properties["Submitted At"]),
      approvedAt: getText(page.properties["Approved At"]),
      postedAt: getText(page.properties["Posted At"]),
    };
  } catch (error) {
    console.error("Error fetching content:", error);
    return null;
  }
}

export async function createContent(clientId: string, data: Partial<Content>): Promise<string> {
  const uniqueId = await generateContentUniqueId(clientId, data.contentType || "reels");

  const props: any = {
    Title: { title: [{ text: { content: data.title || "Untitled" } }] },
    "Unique ID": { rich_text: [{ text: { content: uniqueId } }] },
    Client: { relation: [{ id: clientId }] },
    Status: { select: { name: data.status || "idea_draft" } },
  };

  if (data.pillarId) props["Pillar"] = { relation: [{ id: data.pillarId }] };
  if (data.caption) props["Caption"] = { rich_text: [{ text: { content: data.caption } }] };
  if (data.contentType) props["Content Type"] = { select: { name: data.contentType } };
  if (data.platforms) props["Platform"] = { multi_select: data.platforms.map((p) => ({ name: p })) };
  if (data.publishDate) props["Publish Date"] = { date: { start: data.publishDate } };
  if (data.referenceLinks) props["Reference Links"] = { rich_text: [{ text: { content: data.referenceLinks } }] };
  if (data.durationSeconds) props["Duration Seconds"] = { number: data.durationSeconds };
  if (data.audioReference) props["Audio Reference"] = { rich_text: [{ text: { content: data.audioReference } }] };
  if (data.slideCount) props["Slide Count"] = { number: data.slideCount };
  if (data.slideNotes) props["Slide Notes"] = { rich_text: [{ text: { content: data.slideNotes } }] };
  if (data.ctaNotes) props["CTA Notes"] = { rich_text: [{ text: { content: data.ctaNotes } }] };
  if (data.outputUrl) props["Output URL"] = { url: data.outputUrl };
  if (data.notes) props["Notes"] = { rich_text: [{ text: { content: data.notes } }] };
  if ((data as any).description) props["Description"] = { rich_text: [{ text: { content: (data as any).description } }] };

  const page = await notion.pages.create({
    parent: { database_id: DB.contents },
    properties: props,
  });

  return page.id;
}

export async function updateContent(contentId: string, data: Partial<Content>): Promise<void> {
  const props: any = {};

  if (data.title !== undefined) props["Title"] = { title: [{ text: { content: data.title } }] };
  if (data.pillarId !== undefined) props["Pillar"] = { relation: [{ id: data.pillarId }] };
  if (data.caption !== undefined) props["Caption"] = { rich_text: [{ text: { content: data.caption } }] };
  if (data.contentType !== undefined) props["Content Type"] = { select: { name: data.contentType } };
  if (data.platforms !== undefined) props["Platform"] = { multi_select: data.platforms.map((p) => ({ name: p })) };
  if (data.publishDate !== undefined) props["Publish Date"] = { date: { start: data.publishDate } };
  if (data.status !== undefined) props["Status"] = { select: { name: data.status } };
  if (data.referenceLinks !== undefined) props["Reference Links"] = { rich_text: [{ text: { content: data.referenceLinks } }] };
  if (data.durationSeconds !== undefined) props["Duration Seconds"] = { number: data.durationSeconds };
  if (data.audioReference !== undefined) props["Audio Reference"] = { rich_text: [{ text: { content: data.audioReference } }] };
  if (data.slideCount !== undefined) props["Slide Count"] = { number: data.slideCount };
  if (data.slideNotes !== undefined) props["Slide Notes"] = { rich_text: [{ text: { content: data.slideNotes } }] };
  if (data.ctaNotes !== undefined) props["CTA Notes"] = { rich_text: [{ text: { content: data.ctaNotes } }] };
  if (data.outputUrl !== undefined) props["Output URL"] = { url: data.outputUrl || null };
  if (data.notes !== undefined) props["Notes"] = { rich_text: [{ text: { content: data.notes } }] };

  // Status-related timestamps
  if (data.status === "idea_submitted" || data.status === "production_submitted") {
    props["Submitted At"] = { date: { start: new Date().toISOString().split("T")[0] } };
  }
  if (data.status === "production_ready" || data.status === "ready_to_post") {
    props["Approved At"] = { date: { start: new Date().toISOString().split("T")[0] } };
  }
  if (data.status === "posted") {
    props["Posted At"] = { date: { start: new Date().toISOString().split("T")[0] } };
  }

  await notion.pages.update({ page_id: contentId, properties: props });
}

export async function deleteContent(contentId: string): Promise<void> {
  await notion.pages.update({
    page_id: contentId,
    archived: true,
  });
}

// ========= CONTENT COMMENTS =========

export async function getContentComments(contentId: string): Promise<ContentComment[]> {
  try {
    const res = await notion.databases.query({
      database_id: DB.contentComments,
      filter: { property: "Content", relation: { contains: contentId } },
      sorts: [{ timestamp: "created_time", direction: "ascending" }],
    });

    return res.results.map((page: any) => ({
      id: page.id,
      contentId: (getText(page.properties["Content"]) as any)?.[0] || "",
      authorId: (getText(page.properties["Author"]) as any)?.[0] || "",
      authorName: getText(page.properties["Author Name"]),
      message: getText(page.properties["Message"]),
      attachments: getText(page.properties["Attachments"]) as string[],
      createdAt: page.created_time,
    }));
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
}

export async function createContentComment(contentId: string, authorId: string | null, authorName: string, message: string): Promise<string> {
  const properties: any = {
    Name: { title: [{ text: { content: message.substring(0, 50) + (message.length > 50 ? "..." : "") } }] },
    Content: { relation: [{ id: contentId }] },
    "Author Name": { rich_text: [{ text: { content: authorName } }] },
    Message: { rich_text: [{ text: { content: message } }] },
  };

  // Only add Author relation if it's a valid Notion page ID (not "anonymous" or empty)
  if (authorId && authorId !== "anonymous" && authorId.length > 10) {
    properties.Author = { relation: [{ id: authorId }] };
  }

  const page = await notion.pages.create({
    parent: { database_id: DB.contentComments },
    properties,
  });
  return page.id;
}

// ========= CONTENT REVIEWS =========

export async function getContentReviews(contentId: string): Promise<ContentReview[]> {
  try {
    const res = await notion.databases.query({
      database_id: DB.contentReviews,
      filter: { property: "Content", relation: { contains: contentId } },
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });

    return res.results.map((page: any) => ({
      id: page.id,
      contentId: (getText(page.properties["Content"]) as any)?.[0] || "",
      reviewPhase: getText(page.properties["Review Phase"]) as "ideation" | "production",
      reviewerId: (getText(page.properties["Reviewer"]) as any)?.[0] || "",
      reviewerName: getText(page.properties["Reviewer Name"]),
      decision: getText(page.properties["Decision"]) as "approved" | "revision",
      feedback: getText(page.properties["Feedback"]),
      conceptScore: getNumber(page.properties["Concept Score"]),
      visualScore: getNumber(page.properties["Visual Score"]),
      captionScore: getNumber(page.properties["Caption Score"]),
      createdAt: page.created_time,
    }));
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}

export async function createContentReview(
  contentId: string,
  reviewerId: string,
  reviewerName: string,
  data: {
    reviewPhase: "ideation" | "production";
    decision: "approved" | "revision";
    feedback: string;
    conceptScore?: number;
    visualScore?: number;
    captionScore?: number;
  }
): Promise<string> {
  const props: any = {
    Name: { title: [{ text: { content: `${data.reviewPhase} Review - ${data.decision}` } }] },
    Content: { relation: [{ id: contentId }] },
    Reviewer: { relation: [{ id: reviewerId }] },
    "Reviewer Name": { rich_text: [{ text: { content: reviewerName } }] },
    "Review Phase": { select: { name: data.reviewPhase } },
    Decision: { select: { name: data.decision } },
    Feedback: { rich_text: [{ text: { content: data.feedback } }] },
  };

  if (data.conceptScore !== undefined) props["Concept Score"] = { number: data.conceptScore };
  if (data.visualScore !== undefined) props["Visual Score"] = { number: data.visualScore };
  if (data.captionScore !== undefined) props["Caption Score"] = { number: data.captionScore };

  const page = await notion.pages.create({
    parent: { database_id: DB.contentReviews },
    properties: props,
  });

  // Also update the content status based on review decision
  const newStatus = data.decision === "approved"
    ? (data.reviewPhase === "ideation" ? "production_ready" : "ready_to_post")
    : (data.reviewPhase === "ideation" ? "idea_revision" : "production_revision");

  await updateContent(contentId, { status: newStatus as ContentStatus });

  return page.id;
}

// ========= REVIEW QUEUE (ADMIN) =========

interface ReviewQueueItem extends Content {
  clientName?: string;
  pillarName?: string;
  pillarEmoji?: string;
}

export async function getReviewQueue(): Promise<ReviewQueueItem[]> {
  try {
    const res = await notion.databases.query({
      database_id: DB.contents,
      filter: {
        or: [
          { property: "Status", select: { equals: "idea_submitted" } },
          { property: "Status", select: { equals: "production_submitted" } },
        ],
      },
      sorts: [{ property: "Submitted At", direction: "ascending" }],
    });

    // Map basic content data
    const contents = res.results.map((page: any) => ({
      id: page.id,
      uniqueId: getText(page.properties["Unique ID"]),
      clientId: (getText(page.properties["Client"]) as any)?.[0] || "",
      pillarId: (getText(page.properties["Pillar"]) as any)?.[0] || "",
      title: getText(page.properties["Title"]),
      caption: getText(page.properties["Caption"]),
      contentType: getText(page.properties["Content Type"]) as ContentType,
      platforms: getText(page.properties["Platform"]) as ContentPlatform[],
      publishDate: getText(page.properties["Publish Date"]),
      status: getText(page.properties["Status"]) as ContentStatus,
      referenceLinks: getText(page.properties["Reference Links"]),
      durationSeconds: getNumber(page.properties["Duration Seconds"]),
      audioReference: getText(page.properties["Audio Reference"]),
      slideCount: getNumber(page.properties["Slide Count"]),
      slideNotes: getText(page.properties["Slide Notes"]),
      ctaNotes: getText(page.properties["CTA Notes"]),
      outputFiles: getText(page.properties["Output Files"]) as string[],
      outputUrl: getText(page.properties["Output URL"]),
      thumbnail: getText(page.properties["Thumbnail"]) as string[],
      notes: getText(page.properties["Notes"]),
      createdAt: page.created_time,
      submittedAt: getText(page.properties["Submitted At"]),
      approvedAt: getText(page.properties["Approved At"]),
      postedAt: getText(page.properties["Posted At"]),
    }));

    // Get unique client and pillar IDs
    const clientIds = Array.from(new Set(contents.map(c => c.clientId).filter(Boolean)));
    const pillarIds = Array.from(new Set(contents.map(c => c.pillarId).filter(Boolean)));

    // Fetch client names
    const clientMap: Record<string, string> = {};
    for (const clientId of clientIds) {
      try {
        const clientPage = await notion.pages.retrieve({ page_id: clientId }) as any;
        clientMap[clientId] = getText(clientPage.properties["Name"]) || "Unknown";
      } catch {
        clientMap[clientId] = "Unknown";
      }
    }

    // Fetch pillar info
    const pillarMap: Record<string, { name: string; emoji: string }> = {};
    for (const pillarId of pillarIds) {
      try {
        const pillarPage = await notion.pages.retrieve({ page_id: pillarId }) as any;
        pillarMap[pillarId] = {
          name: getText(pillarPage.properties["Name"]) || "",
          emoji: getText(pillarPage.properties["Emoji"]) || "",
        };
      } catch {
        pillarMap[pillarId] = { name: "", emoji: "" };
      }
    }

    // Enrich contents with client and pillar info
    return contents.map(content => ({
      ...content,
      clientName: clientMap[content.clientId] || "Unknown",
      pillarName: pillarMap[content.pillarId]?.name || "",
      pillarEmoji: pillarMap[content.pillarId]?.emoji || "",
    }));
  } catch (error) {
    console.error("Error fetching review queue:", error);
    return [];
  }
}

// Get all contents with client and pillar info (for admin)
export async function getAllContentsWithDetails(): Promise<ReviewQueueItem[]> {
  try {
    const res = await notion.databases.query({
      database_id: DB.contents,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });

    // Map basic content data including AI generated fields
    const contents = res.results.map((page: any) => ({
      id: page.id,
      uniqueId: getText(page.properties["Unique ID"]),
      clientId: (getText(page.properties["Client"]) as any)?.[0] || "",
      pillarId: (getText(page.properties["Pillar"]) as any)?.[0] || "",
      title: getText(page.properties["Title"]),
      caption: getText(page.properties["Caption"]),
      contentType: getText(page.properties["Content Type"]) as ContentType,
      platforms: getText(page.properties["Platform"]) as ContentPlatform[],
      publishDate: getText(page.properties["Publish Date"]),
      status: getText(page.properties["Status"]) as ContentStatus,
      referenceLinks: getText(page.properties["Reference Links"]),
      durationSeconds: getNumber(page.properties["Duration Seconds"]),
      audioReference: getText(page.properties["Audio Reference"]),
      slideCount: getNumber(page.properties["Slide Count"]),
      slideNotes: getText(page.properties["Slide Notes"]),
      ctaNotes: getText(page.properties["CTA Notes"]),
      outputFiles: getText(page.properties["Output Files"]) as string[],
      outputUrl: getText(page.properties["Output URL"]),
      thumbnail: getText(page.properties["Thumbnail"]) as string[],
      notes: getText(page.properties["Notes"]),
      createdAt: page.created_time,
      submittedAt: getText(page.properties["Submitted At"]),
      approvedAt: getText(page.properties["Approved At"]),
      postedAt: getText(page.properties["Posted At"]),
      // AI Generated fields for Brief
      description: getText(page.properties["Description"]),
      generatedHook: getText(page.properties["AI Generated Hook"]),
      generatedStructure: getText(page.properties["AI Generated Structure"]),
      generatedCaption: getText(page.properties["AI Generated Caption"]),
      // Brief Sections (JSON stored in rich_text)
      briefSections: (() => {
        try {
          const raw = getText(page.properties["Brief Sections"]);
          return raw ? JSON.parse(raw) : [];
        } catch {
          return [];
        }
      })(),
    }));

    // Get unique client and pillar IDs
    const clientIds = Array.from(new Set(contents.map(c => c.clientId).filter(Boolean)));
    const pillarIds = Array.from(new Set(contents.map(c => c.pillarId).filter(Boolean)));

    // Fetch client names
    const clientMap: Record<string, string> = {};
    for (const clientId of clientIds) {
      try {
        const clientPage = await notion.pages.retrieve({ page_id: clientId }) as any;
        clientMap[clientId] = getText(clientPage.properties["Name"]) || "Unknown";
      } catch {
        clientMap[clientId] = "Unknown";
      }
    }

    // Fetch pillar info
    const pillarMap: Record<string, { name: string; emoji: string }> = {};
    for (const pillarId of pillarIds) {
      try {
        const pillarPage = await notion.pages.retrieve({ page_id: pillarId }) as any;
        pillarMap[pillarId] = {
          name: getText(pillarPage.properties["Name"]) || "",
          emoji: getText(pillarPage.properties["Emoji"]) || "",
        };
      } catch {
        pillarMap[pillarId] = { name: "", emoji: "" };
      }
    }

    // Enrich contents with client and pillar info
    return contents.map(content => ({
      ...content,
      clientName: clientMap[content.clientId] || "Unknown",
      pillarName: pillarMap[content.pillarId]?.name || "",
      pillarEmoji: pillarMap[content.pillarId]?.emoji || "",
    }));
  } catch (error) {
    console.error("Error fetching all contents:", error);
    return [];
  }
}

// ========= CLIENT HELPERS =========

export async function getClientById(clientId: string) {
  try {
    const page = await notion.pages.retrieve({ page_id: clientId }) as any;
    return {
      id: page.id,
      businessName: getText(page.properties["Name"]),
      clientCode: getText(page.properties["Client Code"]),
      industry: getText(page.properties["Industry"]),
      contactPerson: getText(page.properties["Contact Person"]),
      email: getText(page.properties["Email"]),
      phone: getText(page.properties["Phone"]),
      startDate: getText(page.properties["Start Date"]),
      endDate: getText(page.properties["End Date"]),
      status: getText(page.properties["Status"]),
      role: getText(page.properties["Role"]),
    };
  } catch (error) {
    console.error("Error fetching client:", error);
    return null;
  }
}

// ========= KNOWLEDGE BANK =========

export interface KnowledgeBankItem {
  id: string;
  clientId: string;
  title: string;
  content: string;
  category: "Brand" | "Product" | "Audience" | "Competitor" | "Other";
  priority: number;
  includeInBrief: boolean;
  isActive: boolean;
  lastUpdated: string;
}

export async function getKnowledgeBank(clientId: string, filters?: { includeInBrief?: boolean; isActive?: boolean }): Promise<KnowledgeBankItem[]> {
  try {
    const filterConditions: any[] = [
      { property: "Client", relation: { contains: clientId } },
    ];
    if (filters?.isActive !== undefined) {
      filterConditions.push({ property: "Is Active", checkbox: { equals: filters.isActive } });
    }
    if (filters?.includeInBrief !== undefined) {
      filterConditions.push({ property: "Include in Brief", checkbox: { equals: filters.includeInBrief } });
    }

    const res = await notion.databases.query({
      database_id: DB.knowledgeBank,
      filter: filterConditions.length > 1 ? { and: filterConditions } : filterConditions[0],
      sorts: [{ property: "Priority", direction: "ascending" }],
    });

    return res.results.map((page: any) => ({
      id: page.id,
      clientId: (getText(page.properties["Client"]) as any)?.[0] || "",
      title: getText(page.properties["Title"]),
      content: getText(page.properties["Content"]),
      category: getText(page.properties["Category"]) as KnowledgeBankItem["category"],
      priority: getNumber(page.properties["Priority"]),
      includeInBrief: page.properties["Include in Brief"]?.checkbox ?? true,
      isActive: page.properties["Is Active"]?.checkbox ?? true,
      lastUpdated: page.last_edited_time,
    }));
  } catch (error) {
    console.error("Error fetching knowledge bank:", error);
    return [];
  }
}

export async function createKnowledgeBankItem(clientId: string, data: Partial<KnowledgeBankItem>): Promise<string> {
  const page = await notion.pages.create({
    parent: { database_id: DB.knowledgeBank },
    properties: {
      Title: { title: [{ text: { content: data.title || "New Knowledge" } }] },
      Client: { relation: [{ id: clientId }] },
      Content: { rich_text: [{ text: { content: data.content || "" } }] },
      Category: { select: { name: data.category || "Other" } },
      Priority: { number: data.priority || 99 },
      "Include in Brief": { checkbox: data.includeInBrief ?? true },
      "Is Active": { checkbox: data.isActive ?? true },
    },
  });
  return page.id;
}

export async function updateKnowledgeBankItem(itemId: string, data: Partial<KnowledgeBankItem>): Promise<void> {
  const props: any = {};
  if (data.title !== undefined) props["Title"] = { title: [{ text: { content: data.title } }] };
  if (data.content !== undefined) props["Content"] = { rich_text: [{ text: { content: data.content } }] };
  if (data.category !== undefined) props["Category"] = { select: { name: data.category } };
  if (data.priority !== undefined) props["Priority"] = { number: data.priority };
  if (data.includeInBrief !== undefined) props["Include in Brief"] = { checkbox: data.includeInBrief };
  if (data.isActive !== undefined) props["Is Active"] = { checkbox: data.isActive };

  await notion.pages.update({ page_id: itemId, properties: props });
}

export async function deleteKnowledgeBankItem(itemId: string): Promise<void> {
  await notion.pages.update({
    page_id: itemId,
    properties: { "Is Active": { checkbox: false } },
  });
}

// ========= CLIENT ASSETS =========

export interface ClientAsset {
  id: string;
  clientId: string;
  assetName: string;
  assetType: "Canva Template" | "Font" | "Logo" | "Guidelines" | "Other";
  url: string;
  description: string;
  isActive: boolean;
}

export async function getClientAssets(clientId: string, filters?: { assetType?: string }): Promise<ClientAsset[]> {
  try {
    const filterConditions: any[] = [
      { property: "Client", relation: { contains: clientId } },
      { property: "Is Active", checkbox: { equals: true } },
    ];
    if (filters?.assetType) {
      filterConditions.push({ property: "Type", select: { equals: filters.assetType } });
    }

    const res = await notion.databases.query({
      database_id: DB.clientAssets,
      filter: { and: filterConditions },
      sorts: [{ property: "Type", direction: "ascending" }],
    });

    return res.results.map((page: any) => ({
      id: page.id,
      clientId: (getText(page.properties["Client"]) as any)?.[0] || "",
      assetName: getText(page.properties["Asset Name"]),
      assetType: getText(page.properties["Type"]) as ClientAsset["assetType"],
      url: page.properties["URL"]?.url || "",
      description: getText(page.properties["Description"]),
      isActive: page.properties["Is Active"]?.checkbox ?? true,
    }));
  } catch (error) {
    console.error("Error fetching client assets:", error);
    return [];
  }
}

export async function createClientAsset(clientId: string, data: Partial<ClientAsset>): Promise<string> {
  const page = await notion.pages.create({
    parent: { database_id: DB.clientAssets },
    properties: {
      "Asset Name": { title: [{ text: { content: data.assetName || "New Asset" } }] },
      Client: { relation: [{ id: clientId }] },
      Type: { select: { name: data.assetType || "Other" } },
      URL: { url: data.url || null },
      Description: { rich_text: [{ text: { content: data.description || "" } }] },
      "Is Active": { checkbox: true },
    },
  });
  return page.id;
}

export async function updateClientAsset(assetId: string, data: Partial<ClientAsset>): Promise<void> {
  const props: any = {};
  if (data.assetName !== undefined) props["Asset Name"] = { title: [{ text: { content: data.assetName } }] };
  if (data.assetType !== undefined) props["Type"] = { select: { name: data.assetType } };
  if (data.url !== undefined) props["URL"] = { url: data.url || null };
  if (data.description !== undefined) props["Description"] = { rich_text: [{ text: { content: data.description } }] };
  if (data.isActive !== undefined) props["Is Active"] = { checkbox: data.isActive };

  await notion.pages.update({ page_id: assetId, properties: props });
}

export async function deleteClientAsset(assetId: string): Promise<void> {
  await notion.pages.update({
    page_id: assetId,
    properties: { "Is Active": { checkbox: false } },
  });
}

// ========= CLIENT PRODUCTS =========

export interface ClientProduct {
  id: string;
  clientId: string;
  productName: string;
  category: "Product" | "Service" | "Package";
  description: string;
  keyBenefits: string;
  priceType: "Fixed" | "Range" | "Starting From";
  priceMin: number;
  priceMax: number;
  usp: string;
  isFeatured: boolean;
  isActive: boolean;
}

export async function getClientProducts(clientId: string, filters?: { isActive?: boolean; isFeatured?: boolean }): Promise<ClientProduct[]> {
  try {
    const filterConditions: any[] = [
      { property: "Client", relation: { contains: clientId } },
    ];
    if (filters?.isActive !== undefined) {
      filterConditions.push({ property: "Is Active", checkbox: { equals: filters.isActive } });
    }
    if (filters?.isFeatured !== undefined) {
      filterConditions.push({ property: "Is Featured", checkbox: { equals: filters.isFeatured } });
    }

    const res = await notion.databases.query({
      database_id: DB.clientProducts,
      filter: filterConditions.length > 1 ? { and: filterConditions } : filterConditions[0],
      sorts: [
        { property: "Is Featured", direction: "descending" },
        { property: "Product Name", direction: "ascending" },
      ],
    });

    return res.results.map((page: any) => ({
      id: page.id,
      clientId: (getText(page.properties["Client"]) as any)?.[0] || "",
      productName: getText(page.properties["Product Name"]),
      category: getText(page.properties["Category"]) as ClientProduct["category"],
      description: getText(page.properties["Description"]),
      keyBenefits: getText(page.properties["Key Benefits"]),
      priceType: getText(page.properties["Price Type"]) as ClientProduct["priceType"],
      priceMin: getNumber(page.properties["Price Min"]),
      priceMax: getNumber(page.properties["Price Max"]),
      usp: getText(page.properties["USP"]),
      isFeatured: page.properties["Is Featured"]?.checkbox ?? false,
      isActive: page.properties["Is Active"]?.checkbox ?? true,
    }));
  } catch (error) {
    console.error("Error fetching client products:", error);
    return [];
  }
}

export async function createClientProduct(clientId: string, data: Partial<ClientProduct>): Promise<string> {
  const page = await notion.pages.create({
    parent: { database_id: DB.clientProducts },
    properties: {
      "Product Name": { title: [{ text: { content: data.productName || "New Product" } }] },
      Client: { relation: [{ id: clientId }] },
      Category: { select: { name: data.category || "Product" } },
      Description: { rich_text: [{ text: { content: data.description || "" } }] },
      "Key Benefits": { rich_text: [{ text: { content: data.keyBenefits || "" } }] },
      "Price Type": { select: { name: data.priceType || "Fixed" } },
      "Price Min": { number: data.priceMin || 0 },
      "Price Max": { number: data.priceMax || 0 },
      USP: { rich_text: [{ text: { content: data.usp || "" } }] },
      "Is Featured": { checkbox: data.isFeatured ?? false },
      "Is Active": { checkbox: true },
    },
  });
  return page.id;
}

export async function updateClientProduct(productId: string, data: Partial<ClientProduct>): Promise<void> {
  const props: any = {};
  if (data.productName !== undefined) props["Product Name"] = { title: [{ text: { content: data.productName } }] };
  if (data.category !== undefined) props["Category"] = { select: { name: data.category } };
  if (data.description !== undefined) props["Description"] = { rich_text: [{ text: { content: data.description } }] };
  if (data.keyBenefits !== undefined) props["Key Benefits"] = { rich_text: [{ text: { content: data.keyBenefits } }] };
  if (data.priceType !== undefined) props["Price Type"] = { select: { name: data.priceType } };
  if (data.priceMin !== undefined) props["Price Min"] = { number: data.priceMin };
  if (data.priceMax !== undefined) props["Price Max"] = { number: data.priceMax };
  if (data.usp !== undefined) props["USP"] = { rich_text: [{ text: { content: data.usp } }] };
  if (data.isFeatured !== undefined) props["Is Featured"] = { checkbox: data.isFeatured };
  if (data.isActive !== undefined) props["Is Active"] = { checkbox: data.isActive };

  await notion.pages.update({ page_id: productId, properties: props });
}

export async function deleteClientProduct(productId: string): Promise<void> {
  await notion.pages.update({
    page_id: productId,
    properties: { "Is Active": { checkbox: false } },
  });
}

// ========= CONTENT PILLARS (EXTENDED FOR BRIEF GENERATOR) =========

export interface ContentPillarExtended extends ContentPillar {
  objective: string;
  targetEmotion: "Educate" | "Entertain" | "Inspire" | "Convert";
  hookStyles: string[];
  ctaType: "Follow" | "Comment" | "Save" | "Link" | "DM";
}

export async function getClientPillarsExtended(clientId: string): Promise<ContentPillarExtended[]> {
  try {
    const res = await notion.databases.query({
      database_id: DB.contentPillars,
      filter: {
        and: [
          { property: "Client", relation: { contains: clientId } },
          { property: "Active", checkbox: { equals: true } },
        ],
      },
      sorts: [{ property: "Order", direction: "ascending" }],
    });
    return res.results.map((page: any) => ({
      id: page.id,
      name: getText(page.properties["Name"]),
      clientId: (getText(page.properties["Client"]) as any)?.[0] || "",
      emoji: getText(page.properties["Emoji"]) || "📌",
      description: getText(page.properties["Description"]),
      targetRatio: getNumber(page.properties["Target Ratio"]),
      color: getText(page.properties["Color"]) || "blue",
      examples: getText(page.properties["Examples"]),
      dos: getText(page.properties["Dos"]),
      donts: getText(page.properties["Donts"]),
      order: getNumber(page.properties["Order"]),
      active: page.properties["Active"]?.checkbox ?? true,
      objective: getText(page.properties["Objective"]),
      targetEmotion: (getText(page.properties["Target Emotion"]) || "Educate") as ContentPillarExtended["targetEmotion"],
      hookStyles: getText(page.properties["Hook Styles"]) as string[],
      ctaType: (getText(page.properties["CTA Type"]) || "Follow") as ContentPillarExtended["ctaType"],
    }));
  } catch (error) {
    console.error("Error fetching pillars extended:", error);
    return [];
  }
}

// ========= REELS BRIEF REQUESTS =========

export interface ReelsBriefRequest {
  id: string;
  clientId: string;
  requestId: string;
  pillarId: string;
  productIds: string[];
  topic: string;
  keyMessage: string;
  duration: "15-30s" | "30-60s" | "60-90s";
  referenceLinks: string;
  notes: string;
  status: "Draft" | "Submitted" | "Generated" | "Review" | "Approved";
  generatedBrief: string;
  finalBrief: string;
  createdAt: string;
}

export async function getReelsBriefRequests(clientId: string): Promise<ReelsBriefRequest[]> {
  try {
    const res = await notion.databases.query({
      database_id: DB.reelsBriefs,
      filter: { property: "Client", relation: { contains: clientId } },
      sorts: [{ property: "Created Date", direction: "descending" }],
    });

    return res.results.map((page: any) => ({
      id: page.id,
      clientId: (getText(page.properties["Client"]) as any)?.[0] || "",
      requestId: getText(page.properties["Request ID"]),
      pillarId: (getText(page.properties["Content Pillar"]) as any)?.[0] || "",
      productIds: getText(page.properties["Products"]) as string[],
      topic: getText(page.properties["Topic"]),
      keyMessage: getText(page.properties["Key Message"]),
      duration: getText(page.properties["Duration"]) as ReelsBriefRequest["duration"],
      referenceLinks: getText(page.properties["Reference Links"]),
      notes: getText(page.properties["Notes"]),
      status: getText(page.properties["Status"]) as ReelsBriefRequest["status"],
      generatedBrief: getText(page.properties["Generated Brief"]),
      finalBrief: getText(page.properties["Final Brief"]),
      createdAt: page.created_time,
    }));
  } catch (error) {
    console.error("Error fetching brief requests:", error);
    return [];
  }
}

export async function createReelsBriefRequest(clientId: string, data: Partial<ReelsBriefRequest>): Promise<string> {
  // Generate request ID
  const existingBriefs = await getReelsBriefRequests(clientId);
  const requestId = `RB-${String(existingBriefs.length + 1).padStart(3, "0")}`;

  const props: any = {
    "Request ID": { title: [{ text: { content: requestId } }] },
    Client: { relation: [{ id: clientId }] },
    Status: { select: { name: data.status || "Draft" } },
  };

  if (data.pillarId) props["Content Pillar"] = { relation: [{ id: data.pillarId }] };
  if (data.productIds?.length) props["Products"] = { relation: data.productIds.map((id) => ({ id })) };
  if (data.topic) props["Topic"] = { rich_text: [{ text: { content: data.topic } }] };
  if (data.keyMessage) props["Key Message"] = { rich_text: [{ text: { content: data.keyMessage } }] };
  if (data.duration) props["Duration"] = { select: { name: data.duration } };
  if (data.referenceLinks) props["Reference Links"] = { rich_text: [{ text: { content: data.referenceLinks } }] };
  if (data.notes) props["Notes"] = { rich_text: [{ text: { content: data.notes } }] };
  if (data.generatedBrief) props["Generated Brief"] = { rich_text: [{ text: { content: data.generatedBrief } }] };
  if (data.finalBrief) props["Final Brief"] = { rich_text: [{ text: { content: data.finalBrief } }] };

  const page = await notion.pages.create({
    parent: { database_id: DB.reelsBriefs },
    properties: props,
  });
  return page.id;
}

export async function updateReelsBriefRequest(briefId: string, data: Partial<ReelsBriefRequest>): Promise<void> {
  const props: any = {};
  if (data.pillarId !== undefined) props["Content Pillar"] = { relation: [{ id: data.pillarId }] };
  if (data.productIds !== undefined) props["Products"] = { relation: data.productIds.map((id) => ({ id })) };
  if (data.topic !== undefined) props["Topic"] = { rich_text: [{ text: { content: data.topic } }] };
  if (data.keyMessage !== undefined) props["Key Message"] = { rich_text: [{ text: { content: data.keyMessage } }] };
  if (data.duration !== undefined) props["Duration"] = { select: { name: data.duration } };
  if (data.referenceLinks !== undefined) props["Reference Links"] = { rich_text: [{ text: { content: data.referenceLinks } }] };
  if (data.notes !== undefined) props["Notes"] = { rich_text: [{ text: { content: data.notes } }] };
  if (data.status !== undefined) props["Status"] = { select: { name: data.status } };
  if (data.generatedBrief !== undefined) props["Generated Brief"] = { rich_text: [{ text: { content: data.generatedBrief } }] };
  if (data.finalBrief !== undefined) props["Final Brief"] = { rich_text: [{ text: { content: data.finalBrief } }] };

  await notion.pages.update({ page_id: briefId, properties: props });
}

// ========= BRIEF CONVERSATIONS =========

export interface BriefConversation {
  id: string;
  briefId: string;
  role: "user" | "assistant";
  message: string;
  createdAt: string;
}

export async function getBriefConversations(briefId: string): Promise<BriefConversation[]> {
  try {
    const res = await notion.databases.query({
      database_id: DB.briefConversations,
      filter: { property: "Brief Request", relation: { contains: briefId } },
      sorts: [{ property: "Created Date", direction: "ascending" }],
    });

    return res.results.map((page: any) => ({
      id: page.id,
      briefId: (getText(page.properties["Brief Request"]) as any)?.[0] || "",
      role: getText(page.properties["Role"]) as "user" | "assistant",
      message: getText(page.properties["Message"]),
      createdAt: page.created_time,
    }));
  } catch (error) {
    console.error("Error fetching brief conversations:", error);
    return [];
  }
}

export async function createBriefConversation(briefId: string, role: "user" | "assistant", message: string): Promise<string> {
  const page = await notion.pages.create({
    parent: { database_id: DB.briefConversations },
    properties: {
      Name: { title: [{ text: { content: message.substring(0, 50) + "..." } }] },
      "Brief Request": { relation: [{ id: briefId }] },
      Role: { select: { name: role } },
      Message: { rich_text: [{ text: { content: message } }] },
    },
  });
  return page.id;
}

// ========= CLIENT CONTEXT COMPILATION =========

// In-memory cache for compiled context (since Notion DB may not have these properties)
const contextCache = new Map<string, { context: string; hash: string; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function getClientCompiledContext(clientId: string): Promise<{ context: string; hash: string } | null> {
  try {
    // Check in-memory cache first
    const cached = contextCache.get(clientId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { context: cached.context, hash: cached.hash };
    }

    // Try to get from Notion (if properties exist)
    try {
      const page = await notion.pages.retrieve({ page_id: clientId }) as any;
      // Use getFullRichText to join all chunks
      const compiledContext = getFullRichText(page.properties["Compiled Context"]);
      const contextHash = getText(page.properties["Context Hash"]);

      if (compiledContext && contextHash) {
        // Update in-memory cache
        contextCache.set(clientId, { context: compiledContext, hash: contextHash, timestamp: Date.now() });
        return { context: compiledContext, hash: contextHash };
      }
    } catch (notionError: any) {
      // Properties might not exist in Notion DB, that's okay - use cache only
      console.log("Notion properties not available for context cache, using in-memory only");
    }

    return null;
  } catch (error) {
    console.error("Error fetching compiled context:", error);
    return null;
  }
}

export async function updateClientCompiledContext(clientId: string, context: string, hash: string): Promise<void> {
  // Always update in-memory cache
  contextCache.set(clientId, { context, hash, timestamp: Date.now() });

  // Try to update Notion (skip if properties don't exist)
  try {
    // Notion rich_text has 2000 char limit per block, split into chunks
    const CHUNK_SIZE = 2000;
    const chunks: { text: { content: string } }[] = [];

    for (let i = 0; i < context.length; i += CHUNK_SIZE) {
      chunks.push({ text: { content: context.slice(i, i + CHUNK_SIZE) } });
    }

    // Notion allows max 100 rich_text blocks, but we'll limit to ~10 (20000 chars)
    const limitedChunks = chunks.slice(0, 10);

    await notion.pages.update({
      page_id: clientId,
      properties: {
        "Compiled Context": { rich_text: limitedChunks },
        "Context Hash": { rich_text: [{ text: { content: hash } }] },
        "Context Updated": { date: { start: new Date().toISOString().split("T")[0] } },
      },
    });
  } catch (notionError: any) {
    // Properties might not exist in Notion DB - that's okay, we have in-memory cache
    console.log("Could not update Notion context cache (properties may not exist), using in-memory only");
  }
}

// ========= ICP (IDEAL CUSTOMER PROFILE) =========

export interface ClientICP {
  id: string;
  clientId: string;
  title: string;
  demographics: string;
  psychographics: string;
  painPoints: string;
  goals: string;
  objections: string;
  whereTheyHangOut: string;
  buyingBehavior: string;
  notes: string;
  updatedAt: string;
}

export async function getClientICP(clientId: string): Promise<ClientICP | null> {
  try {
    const res = await notion.databases.query({
      database_id: DB.clientICP,
      filter: { property: "Client", relation: { contains: clientId } },
    });

    if (res.results.length === 0) return null;

    const page = res.results[0] as any;
    return {
      id: page.id,
      clientId: (getText(page.properties["Client"]) as any)?.[0] || "",
      title: getText(page.properties["Title"]),
      demographics: getText(page.properties["Demographics"]),
      psychographics: getText(page.properties["Psychographics"]),
      painPoints: getText(page.properties["Pain Points"]),
      goals: getText(page.properties["Goals"]),
      objections: getText(page.properties["Objections"]),
      whereTheyHangOut: getText(page.properties["Where They Hang Out"]),
      buyingBehavior: getText(page.properties["Buying Behavior"]),
      notes: getText(page.properties["Notes"]),
      updatedAt: page.last_edited_time,
    };
  } catch (error) {
    console.error("Error fetching client ICP:", error);
    return null;
  }
}

export async function createClientICP(clientId: string, data: Partial<ClientICP>): Promise<string> {
  const page = await notion.pages.create({
    parent: { database_id: DB.clientICP },
    properties: {
      Title: { title: [{ text: { content: data.title || "ICP" } }] },
      Client: { relation: [{ id: clientId }] },
      Demographics: { rich_text: [{ text: { content: data.demographics || "" } }] },
      Psychographics: { rich_text: [{ text: { content: data.psychographics || "" } }] },
      "Pain Points": { rich_text: [{ text: { content: data.painPoints || "" } }] },
      Goals: { rich_text: [{ text: { content: data.goals || "" } }] },
      Objections: { rich_text: [{ text: { content: data.objections || "" } }] },
      "Where They Hang Out": { rich_text: [{ text: { content: data.whereTheyHangOut || "" } }] },
      "Buying Behavior": { rich_text: [{ text: { content: data.buyingBehavior || "" } }] },
      Notes: { rich_text: [{ text: { content: data.notes || "" } }] },
    },
  });
  return page.id;
}

export async function updateClientICP(icpId: string, data: Partial<ClientICP>): Promise<void> {
  const props: any = {};
  if (data.title !== undefined) props["Title"] = { title: [{ text: { content: data.title } }] };
  if (data.demographics !== undefined) props["Demographics"] = { rich_text: [{ text: { content: data.demographics } }] };
  if (data.psychographics !== undefined) props["Psychographics"] = { rich_text: [{ text: { content: data.psychographics } }] };
  if (data.painPoints !== undefined) props["Pain Points"] = { rich_text: [{ text: { content: data.painPoints } }] };
  if (data.goals !== undefined) props["Goals"] = { rich_text: [{ text: { content: data.goals } }] };
  if (data.objections !== undefined) props["Objections"] = { rich_text: [{ text: { content: data.objections } }] };
  if (data.whereTheyHangOut !== undefined) props["Where They Hang Out"] = { rich_text: [{ text: { content: data.whereTheyHangOut } }] };
  if (data.buyingBehavior !== undefined) props["Buying Behavior"] = { rich_text: [{ text: { content: data.buyingBehavior } }] };
  if (data.notes !== undefined) props["Notes"] = { rich_text: [{ text: { content: data.notes } }] };
  props["Updated At"] = { date: { start: new Date().toISOString().split("T")[0] } };

  await notion.pages.update({ page_id: icpId, properties: props });
}

// ========= TARGET AUDIENCE =========

export interface TargetAudience {
  id: string;
  clientId: string;
  segmentName: string;
  description: string;
  ageRange: string;
  gender: "female" | "male" | "all";
  location: string;
  interests: string;
  painPoints: string;
  contentPreferences: string;
  activeHours: string;
  order: number;
  active: boolean;
}

export async function getTargetAudiences(clientId: string): Promise<TargetAudience[]> {
  try {
    const res = await notion.databases.query({
      database_id: DB.targetAudience,
      filter: {
        and: [
          { property: "Client", relation: { contains: clientId } },
          { property: "Active", checkbox: { equals: true } },
        ],
      },
      sorts: [{ property: "Order", direction: "ascending" }],
    });

    return res.results.map((page: any) => ({
      id: page.id,
      clientId: (getText(page.properties["Client"]) as any)?.[0] || "",
      segmentName: getText(page.properties["Segment Name"]),
      description: getText(page.properties["Description"]),
      ageRange: getText(page.properties["Age Range"]),
      gender: (getText(page.properties["Gender"]) || "all") as TargetAudience["gender"],
      location: getText(page.properties["Location"]),
      interests: getText(page.properties["Interests"]),
      painPoints: getText(page.properties["Pain Points"]),
      contentPreferences: getText(page.properties["Content Preferences"]),
      activeHours: getText(page.properties["Active Hours"]),
      order: getNumber(page.properties["Order"]),
      active: page.properties["Active"]?.checkbox ?? true,
    }));
  } catch (error) {
    console.error("Error fetching target audiences:", error);
    return [];
  }
}

export async function createTargetAudience(clientId: string, data: Partial<TargetAudience>): Promise<string> {
  const page = await notion.pages.create({
    parent: { database_id: DB.targetAudience },
    properties: {
      "Segment Name": { title: [{ text: { content: data.segmentName || "New Segment" } }] },
      Client: { relation: [{ id: clientId }] },
      Description: { rich_text: [{ text: { content: data.description || "" } }] },
      "Age Range": { rich_text: [{ text: { content: data.ageRange || "" } }] },
      Gender: { select: { name: data.gender || "all" } },
      Location: { rich_text: [{ text: { content: data.location || "" } }] },
      Interests: { rich_text: [{ text: { content: data.interests || "" } }] },
      "Pain Points": { rich_text: [{ text: { content: data.painPoints || "" } }] },
      "Content Preferences": { rich_text: [{ text: { content: data.contentPreferences || "" } }] },
      "Active Hours": { rich_text: [{ text: { content: data.activeHours || "" } }] },
      Order: { number: data.order || 0 },
      Active: { checkbox: true },
    },
  });
  return page.id;
}

export async function updateTargetAudience(audienceId: string, data: Partial<TargetAudience>): Promise<void> {
  const props: any = {};
  if (data.segmentName !== undefined) props["Segment Name"] = { title: [{ text: { content: data.segmentName } }] };
  if (data.description !== undefined) props["Description"] = { rich_text: [{ text: { content: data.description } }] };
  if (data.ageRange !== undefined) props["Age Range"] = { rich_text: [{ text: { content: data.ageRange } }] };
  if (data.gender !== undefined) props["Gender"] = { select: { name: data.gender } };
  if (data.location !== undefined) props["Location"] = { rich_text: [{ text: { content: data.location } }] };
  if (data.interests !== undefined) props["Interests"] = { rich_text: [{ text: { content: data.interests } }] };
  if (data.painPoints !== undefined) props["Pain Points"] = { rich_text: [{ text: { content: data.painPoints } }] };
  if (data.contentPreferences !== undefined) props["Content Preferences"] = { rich_text: [{ text: { content: data.contentPreferences } }] };
  if (data.activeHours !== undefined) props["Active Hours"] = { rich_text: [{ text: { content: data.activeHours } }] };
  if (data.order !== undefined) props["Order"] = { number: data.order };
  if (data.active !== undefined) props["Active"] = { checkbox: data.active };

  await notion.pages.update({ page_id: audienceId, properties: props });
}

export async function deleteTargetAudience(audienceId: string): Promise<void> {
  await notion.pages.update({
    page_id: audienceId,
    properties: { Active: { checkbox: false } },
  });
}

// ========= CONTENT AI CHAT =========

export async function updateContentAIChat(contentId: string, data: {
  chatHistory?: string;
  generatedHook?: string;
  generatedStructure?: string;
  generatedCaption?: string;
  description?: string;
}): Promise<void> {
  const props: any = {};
  if (data.chatHistory !== undefined) props["AI Chat History"] = { rich_text: [{ text: { content: data.chatHistory.substring(0, 2000) } }] };
  if (data.generatedHook !== undefined) props["AI Generated Hook"] = { rich_text: [{ text: { content: data.generatedHook } }] };
  if (data.generatedStructure !== undefined) props["AI Generated Structure"] = { rich_text: [{ text: { content: data.generatedStructure.substring(0, 2000) } }] };
  if (data.generatedCaption !== undefined) props["AI Generated Caption"] = { rich_text: [{ text: { content: data.generatedCaption.substring(0, 2000) } }] };
  if (data.description !== undefined) props["Description"] = { rich_text: [{ text: { content: data.description } }] };

  await notion.pages.update({ page_id: contentId, properties: props });
}

export async function getContentWithAI(contentId: string): Promise<(Content & {
  description: string;
  chatHistory: string;
  generatedHook: string;
  generatedStructure: string;
  generatedCaption: string;
}) | null> {
  try {
    const page = await notion.pages.retrieve({ page_id: contentId }) as any;
    return {
      id: page.id,
      uniqueId: getText(page.properties["Unique ID"]),
      clientId: (getText(page.properties["Client"]) as any)?.[0] || "",
      pillarId: (getText(page.properties["Pillar"]) as any)?.[0] || "",
      title: getText(page.properties["Title"]),
      caption: getText(page.properties["Caption"]),
      contentType: getText(page.properties["Content Type"]) as ContentType,
      platforms: getText(page.properties["Platform"]) as ContentPlatform[],
      publishDate: getText(page.properties["Publish Date"]),
      status: getText(page.properties["Status"]) as ContentStatus,
      referenceLinks: getText(page.properties["Reference Links"]),
      durationSeconds: getNumber(page.properties["Duration Seconds"]),
      audioReference: getText(page.properties["Audio Reference"]),
      slideCount: getNumber(page.properties["Slide Count"]),
      slideNotes: getText(page.properties["Slide Notes"]),
      ctaNotes: getText(page.properties["CTA Notes"]),
      outputFiles: getText(page.properties["Output Files"]) as string[],
      outputUrl: getText(page.properties["Output URL"]),
      thumbnail: getText(page.properties["Thumbnail"]) as string[],
      notes: getText(page.properties["Notes"]),
      createdAt: page.created_time,
      submittedAt: getText(page.properties["Submitted At"]),
      approvedAt: getText(page.properties["Approved At"]),
      postedAt: getText(page.properties["Posted At"]),
      // AI fields
      description: getText(page.properties["Description"]),
      chatHistory: getText(page.properties["AI Chat History"]),
      generatedHook: getText(page.properties["AI Generated Hook"]),
      generatedStructure: getText(page.properties["AI Generated Structure"]),
      generatedCaption: getText(page.properties["AI Generated Caption"]),
    };
  } catch (error) {
    console.error("Error fetching content with AI:", error);
    return null;
  }
}

// ========= CONTENT CHAT HISTORY (Separate DB) =========

export interface ContentChatMessage {
  id: string;
  contentId: string;
  clientId: string;
  role: "user" | "assistant" | "system";
  message: string;
  sequenceNumber: number;
  createdAt: string;
}

/**
 * Save a chat message to the Content Chat History database
 */
export async function saveContentChatMessage(
  contentId: string,
  clientId: string,
  role: "user" | "assistant" | "system",
  message: string,
  sequenceNumber: number
): Promise<string | null> {
  // Check if database is configured
  if (!DB.contentChatHistory) {
    console.log("Content Chat History DB not configured, skipping save");
    return null;
  }

  try {
    // Split message into chunks if > 2000 chars
    const CHUNK_SIZE = 2000;
    const part1 = message.substring(0, CHUNK_SIZE);
    const part2 = message.substring(CHUNK_SIZE, CHUNK_SIZE * 2);
    const part3 = message.substring(CHUNK_SIZE * 2, CHUNK_SIZE * 3);

    const props: any = {
      Name: { title: [{ text: { content: `${role}: ${message.substring(0, 50)}...` } }] },
      Content: { relation: [{ id: contentId }] },
      Client: { relation: [{ id: clientId }] },
      Role: { select: { name: role } },
      Message: { rich_text: [{ text: { content: part1 } }] },
      "Sequence Number": { number: sequenceNumber },
    };

    // Add additional parts if message is long
    if (part2) {
      props["Message Part 2"] = { rich_text: [{ text: { content: part2 } }] };
    }
    if (part3) {
      props["Message Part 3"] = { rich_text: [{ text: { content: part3 } }] };
    }

    const page = await notion.pages.create({
      parent: { database_id: DB.contentChatHistory },
      properties: props,
    });

    return page.id;
  } catch (error) {
    console.error("Error saving chat message:", error);
    return null;
  }
}

/**
 * Get chat history for a content from the database
 */
export async function getContentChatHistory(contentId: string): Promise<ContentChatMessage[]> {
  // Check if database is configured
  if (!DB.contentChatHistory) {
    console.log("Content Chat History DB not configured, returning empty");
    return [];
  }

  try {
    const res = await notion.databases.query({
      database_id: DB.contentChatHistory,
      filter: { property: "Content", relation: { contains: contentId } },
      sorts: [{ property: "Sequence Number", direction: "ascending" }],
    });

    return res.results.map((page: any) => {
      // Combine message parts
      const part1 = getText(page.properties["Message"]) || "";
      const part2 = getText(page.properties["Message Part 2"]) || "";
      const part3 = getText(page.properties["Message Part 3"]) || "";
      const fullMessage = part1 + part2 + part3;

      return {
        id: page.id,
        contentId: (getText(page.properties["Content"]) as any)?.[0] || "",
        clientId: (getText(page.properties["Client"]) as any)?.[0] || "",
        role: getText(page.properties["Role"]) as "user" | "assistant" | "system",
        message: fullMessage,
        sequenceNumber: getNumber(page.properties["Sequence Number"]),
        createdAt: page.created_time,
      };
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return [];
  }
}

/**
 * Delete all chat history for a content
 */
export async function clearContentChatHistory(contentId: string): Promise<void> {
  if (!DB.contentChatHistory) return;

  try {
    const messages = await getContentChatHistory(contentId);
    for (const msg of messages) {
      await notion.pages.update({
        page_id: msg.id,
        archived: true,
      });
    }
  } catch (error) {
    console.error("Error clearing chat history:", error);
  }
}

// ========= NOTIFICATIONS =========

export interface Notification {
  id: string;
  title: string;
  type: "comment" | "reply" | "revision" | "approval" | "mention";
  message: string;
  recipientId: string;
  recipientType: "admin" | "client";
  senderName: string;
  senderType: "admin" | "client";
  contentId: string;
  contentTitle: string;
  clientId: string;
  isRead: boolean;
  linkUrl: string;
  createdAt: string;
}

export async function getNotifications(
  recipientId: string,
  recipientType: "admin" | "client",
  options?: { unreadOnly?: boolean; limit?: number }
): Promise<Notification[]> {
  if (!DB.notifications) return [];

  try {
    const filterConditions: any[] = [
      { property: "Recipient Type", select: { equals: recipientType } },
    ];

    // For admin, get all notifications. For client, filter by recipientId
    if (recipientType === "client") {
      filterConditions.push({ property: "Recipient ID", rich_text: { equals: recipientId } });
    }

    if (options?.unreadOnly) {
      filterConditions.push({ property: "Is Read", checkbox: { equals: false } });
    }

    const res = await notion.databases.query({
      database_id: DB.notifications,
      filter: { and: filterConditions },
      sorts: [{ timestamp: "created_time", direction: "descending" }],
      page_size: options?.limit || 50,
    });

    return res.results.map((page: any) => ({
      id: page.id,
      title: getText(page.properties["Title"]),
      type: getText(page.properties["Type"]) as Notification["type"],
      message: getText(page.properties["Message"]),
      recipientId: getText(page.properties["Recipient ID"]),
      recipientType: getText(page.properties["Recipient Type"]) as "admin" | "client",
      senderName: getText(page.properties["Sender Name"]),
      senderType: getText(page.properties["Sender Type"]) as "admin" | "client",
      contentId: getText(page.properties["Content ID"]),
      contentTitle: getText(page.properties["Content Title"]),
      clientId: getText(page.properties["Client ID"]),
      isRead: page.properties["Is Read"]?.checkbox ?? false,
      linkUrl: page.properties["Link URL"]?.url || "",
      createdAt: page.created_time,
    }));
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

export async function createNotification(data: {
  title: string;
  type: Notification["type"];
  message: string;
  recipientId: string;
  recipientType: "admin" | "client";
  senderName: string;
  senderType: "admin" | "client";
  contentId: string;
  contentTitle: string;
  clientId: string;
  linkUrl: string;
}): Promise<string | null> {
  if (!DB.notifications) return null;

  try {
    const page = await notion.pages.create({
      parent: { database_id: DB.notifications },
      properties: {
        Title: { title: [{ text: { content: data.title } }] },
        Type: { select: { name: data.type } },
        Message: { rich_text: [{ text: { content: data.message.slice(0, 2000) } }] },
        "Recipient ID": { rich_text: [{ text: { content: data.recipientId } }] },
        "Recipient Type": { select: { name: data.recipientType } },
        "Sender Name": { rich_text: [{ text: { content: data.senderName } }] },
        "Sender Type": { select: { name: data.senderType } },
        "Content ID": { rich_text: [{ text: { content: data.contentId } }] },
        "Content Title": { rich_text: [{ text: { content: data.contentTitle.slice(0, 200) } }] },
        "Client ID": { rich_text: [{ text: { content: data.clientId } }] },
        "Is Read": { checkbox: false },
        "Link URL": { url: data.linkUrl || null },
      },
    });
    return page.id;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  if (!DB.notifications) return;

  try {
    await notion.pages.update({
      page_id: notificationId,
      properties: {
        "Is Read": { checkbox: true },
      },
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

export async function markAllNotificationsAsRead(
  recipientId: string,
  recipientType: "admin" | "client"
): Promise<void> {
  if (!DB.notifications) return;

  try {
    const unreadNotifications = await getNotifications(recipientId, recipientType, { unreadOnly: true });

    await Promise.all(
      unreadNotifications.map((notif) =>
        notion.pages.update({
          page_id: notif.id,
          properties: { "Is Read": { checkbox: true } },
        })
      )
    );
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
  }
}

export async function getUnreadNotificationCount(
  recipientId: string,
  recipientType: "admin" | "client"
): Promise<number> {
  if (!DB.notifications) return 0;

  try {
    const notifications = await getNotifications(recipientId, recipientType, { unreadOnly: true });
    return notifications.length;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    return 0;
  }
}

export { notion, DB };
