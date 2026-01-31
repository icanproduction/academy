// Brief Section Types

export type FieldType =
  | "scene_description"
  | "script"
  | "editor_notes"
  | "duration"
  | "transition"
  | "text_overlay"
  | "audio_notes"
  | "product_mention"
  | "cta";

export interface BriefField {
  id: string;
  type: FieldType;
  label: string;
  value: string;
}

export interface BriefSection {
  id: string;
  order: number;
  title: string;
  duration: number;
  fields: BriefField[];
}

export interface Brief {
  sections: BriefSection[];
}

export interface AISuggestion {
  label: string;
  preview: string;
  sections: Omit<BriefSection, "id" | "order">[];
}

export interface AIAction {
  type: "update_section" | "create_section" | "delete_section";
  section_id: string | null;
  section_title: string;
  after_section_id?: string;
  duration?: number;
  fields?: Omit<BriefField, "id">[];
}

export interface AIResponse {
  message: string;
  suggestions?: AISuggestion[];
  actions?: AIAction[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  suggestions?: AISuggestion[];
  actions?: AIAction[];
}

// Field configuration
export const FIELD_CONFIG: Record<FieldType, { icon: string; label: string; placeholder: string }> = {
  scene_description: {
    icon: "🎬",
    label: "Scene",
    placeholder: "Describe what happens visually...",
  },
  script: {
    icon: "💬",
    label: "Script",
    placeholder: "Dialogue or voiceover text...",
  },
  editor_notes: {
    icon: "🎞️",
    label: "Editor Notes",
    placeholder: "Instructions for editor (effects, cuts, etc)...",
  },
  duration: {
    icon: "⏱️",
    label: "Duration",
    placeholder: "Duration in seconds",
  },
  transition: {
    icon: "🔄",
    label: "Transition",
    placeholder: "Cut, fade, swipe, zoom, etc...",
  },
  text_overlay: {
    icon: "📝",
    label: "Text Overlay",
    placeholder: "On-screen text to display...",
  },
  audio_notes: {
    icon: "🎵",
    label: "Audio Notes",
    placeholder: "Music, SFX, voiceover instructions...",
  },
  product_mention: {
    icon: "📦",
    label: "Product Mention",
    placeholder: "Which product is featured here...",
  },
  cta: {
    icon: "📢",
    label: "CTA",
    placeholder: "Call to action instruction...",
  },
};

// Section templates with suggested fields
export const SECTION_TEMPLATES: Record<string, { title: string; icon: string; fields: FieldType[] }> = {
  hook: {
    title: "Hook",
    icon: "🎣",
    fields: ["scene_description", "script", "editor_notes"],
  },
  problem: {
    title: "Problem",
    icon: "❓",
    fields: ["scene_description", "script", "editor_notes"],
  },
  solution: {
    title: "Solution",
    icon: "💡",
    fields: ["scene_description", "script", "editor_notes", "product_mention"],
  },
  product_showcase: {
    title: "Product Showcase",
    icon: "📦",
    fields: ["scene_description", "script", "product_mention", "editor_notes"],
  },
  cta_section: {
    title: "CTA",
    icon: "📢",
    fields: ["script", "editor_notes", "text_overlay", "cta"],
  },
  custom: {
    title: "Custom Section",
    icon: "🎬",
    fields: [],
  },
};

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create new section from template
export function createSectionFromTemplate(
  templateKey: string,
  order: number
): BriefSection {
  const template = SECTION_TEMPLATES[templateKey];
  return {
    id: generateId(),
    order,
    title: template.title,
    duration: 5,
    fields: template.fields.map((type) => ({
      id: generateId(),
      type,
      label: FIELD_CONFIG[type].label,
      value: "",
    })),
  };
}

// Create new field
export function createField(type: FieldType): BriefField {
  return {
    id: generateId(),
    type,
    label: FIELD_CONFIG[type].label,
    value: "",
  };
}
