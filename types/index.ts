export interface Client {
  id: string;
  businessName: string;
  industry: string;
  contactPerson: string;
  email: string;
  phone: string;
  startDate: string;
  endDate: string;
  status: "active" | "completed" | "paused";
  role: "client" | "admin" | "reviewer";
  notes: string;
}

export interface Progress {
  id: string;
  clientId: string;
  currentPhase: "Systematize" | "Execute" | "Optimize";
  currentDay: number;
  completionPercentage: number;
  lastUpdated: string;
}

export interface Task {
  id: string;
  clientId: string;
  title: string;
  description: string;
  dueDate: string;
  status: "todo" | "in_progress" | "done";
  phase: string;
  week: number;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  thumbnailUrl: string;
  durationHours: number;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  youtubeVideoId: string;
  durationMinutes: number;
  order: number;
  resources: string[];
}

export interface LessonProgress {
  id: string;
  clientId: string;
  lessonId: string;
  status: "not_started" | "in_progress" | "completed";
  progressSeconds: number;
  completedAt: string;
}

export interface Playbook {
  id: string;
  clientId: string;
  status: "draft" | "in_progress" | "complete";
  version: number;
  brandStory: string;
  brandPersonality: string;
  targetAudience: string;
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  typographyHeading: string;
  typographyBody: string;
  voiceTone: string;
  vocabularyUse: string;
  vocabularyAvoid: string;
  contentPillars: string;
  postingSchedule: string;
  lastUpdated: string;
}

export interface ContentPillar {
  id: string;
  clientId: string;
  name: string;
  color: string;
  ratioPercentage: number;
  description: string;
}

export interface ContentItem {
  id: string;
  clientId: string;
  title: string;
  contentType: "feed" | "carousel" | "reels" | "story";
  platform: string[];
  pillarId: string;
  scheduledDate: string;
  status: "idea" | "draft" | "ready" | "submitted" | "approved" | "revision" | "posted";
  files: string[];
  caption: string;
  hashtags: string;
  notes: string;
}

export interface Submission {
  id: string;
  clientId: string;
  title: string;
  contentItemIds: string[];
  files: string[];
  submittedAt: string;
  status: "submitted" | "in_review" | "approved" | "revision";
  notes: string;
}

export interface Review {
  id: string;
  submissionId: string;
  reviewerId: string;
  visualScore: number;
  captionScore: number;
  strategyScore: number;
  feedbackText: string;
  decision: "approve" | "revision";
  reviewedAt: string;
}

export interface Asset {
  id: string;
  name: string;
  category: "sound_effects" | "music" | "icons" | "graphics" | "presets" | "templates";
  fileUrl: string;
  fileType: string;
  tags: string[];
  createdAt: string;
}

export interface ScheduledCall {
  id: string;
  clientId: string;
  callType: "kickoff" | "strategy_review" | "execution_check" | "performance_review" | "graduation";
  datetime: string;
  status: "scheduled" | "completed" | "cancelled";
  meetingLink: string;
  notes: string;
  recordingUrl: string;
}
