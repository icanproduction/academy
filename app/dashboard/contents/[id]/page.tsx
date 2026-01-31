"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Film,
  Images,
  Smartphone,
  Calendar,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  MessageSquare,
  FileText,
} from "lucide-react";
import { BriefEditor } from "@/components/brief/brief-editor";
import { AIChatPanel } from "@/components/ai/ai-chat-panel";
import {
  BriefSection,
  ChatMessage,
  AISuggestion,
  AIAction,
  generateId,
  createField,
} from "@/types/brief";
import { useAutoSave } from "@/hooks/use-auto-save";

type ContentType = "reels" | "carousel" | "story";
type ContentStatus =
  | "idea_draft"
  | "idea_submitted"
  | "idea_revision"
  | "production_ready"
  | "production_in_progress"
  | "production_submitted"
  | "production_revision"
  | "ready_to_post"
  | "posted";

interface Content {
  id: string;
  uniqueId: string;
  title: string;
  caption: string;
  contentType: ContentType;
  platforms: string[];
  status: ContentStatus;
  publishDate: string;
  pillarId: string;
  pillarName: string;
  pillarEmoji: string;
  pillarColor: string;
  referenceLinks: string;
  description?: string;
  outputUrl: string;
  clientId: string;
}

const STATUS_CONFIG: Record<
  ContentStatus,
  { label: string; color: string; bgColor: string; icon: any }
> = {
  idea_draft: {
    label: "Draft Ide",
    color: "text-slate-600",
    bgColor: "bg-slate-100",
    icon: FileText,
  },
  idea_submitted: {
    label: "Menunggu Review",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    icon: Send,
  },
  idea_revision: {
    label: "Perlu Revisi",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    icon: AlertCircle,
  },
  production_ready: {
    label: "Siap Produksi",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    icon: CheckCircle,
  },
  production_in_progress: {
    label: "Dalam Produksi",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    icon: Loader2,
  },
  production_submitted: {
    label: "Review Hasil",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    icon: Send,
  },
  production_revision: {
    label: "Revisi Output",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    icon: AlertCircle,
  },
  ready_to_post: {
    label: "Siap Posting",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    icon: CheckCircle,
  },
  posted: {
    label: "Sudah Tayang",
    color: "text-green-700",
    bgColor: "bg-green-100",
    icon: CheckCircle,
  },
};

const TYPE_CONFIG: Record<
  ContentType,
  { label: string; icon: any; color: string }
> = {
  reels: { label: "Reels/Video", icon: Film, color: "from-pink-500 to-rose-500" },
  carousel: {
    label: "Carousel",
    icon: Images,
    color: "from-blue-500 to-indigo-500",
  },
  story: {
    label: "Story",
    icon: Smartphone,
    color: "from-purple-500 to-violet-500",
  },
};

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contentId = params.id as string;

  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Brief state
  const [briefSections, setBriefSections] = useState<BriefSection[]>([]);
  const [highlightedSectionId, setHighlightedSectionId] = useState<string | null>(null);

  // AI Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Caption state
  const [caption, setCaption] = useState("");
  const [editingCaption, setEditingCaption] = useState(false);

  // Revision feedback
  const [revisionFeedback, setRevisionFeedback] = useState<string | null>(null);

  // Mobile tab (for responsive)
  const [mobileTab, setMobileTab] = useState<"brief" | "ai">("brief");

  // Determine if brief is editable based on status
  const isEditable =
    content?.status === "idea_draft" ||
    content?.status === "idea_revision" ||
    content?.status === "production_revision";

  // Fetch content and brief
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch content
        const contentRes = await fetch(`/api/contents/${contentId}`);
        if (contentRes.ok) {
          const data = await contentRes.json();
          const contentData = data.data || data;
          setContent(contentData);
          setCaption(contentData.caption || "");
        }

        // Fetch brief sections
        const briefRes = await fetch(`/api/contents/${contentId}/brief`);
        if (briefRes.ok) {
          const data = await briefRes.json();
          if (data.success && Array.isArray(data.sections)) {
            setBriefSections(data.sections);
          }
        }

        // Fetch chat history from API
        const chatRes = await fetch(`/api/contents/${contentId}/chat?full=true`);
        let apiMessages: ChatMessage[] = [];
        if (chatRes.ok) {
          const data = await chatRes.json();
          if (data.success && data.data?.chatHistory) {
            // Convert to ChatMessage format
            apiMessages = data.data.chatHistory.map(
              (msg: any, idx: number) => ({
                id: `msg-${idx}`,
                role: msg.role,
                content: msg.content,
                timestamp: new Date().toISOString(),
              })
            );
          }
        }

        // Also check localStorage for chat history (as fallback/merge)
        const localStorageKey = `ican_chat_${contentId}`;
        let localMessages: ChatMessage[] = [];
        try {
          const savedChat = localStorage.getItem(localStorageKey);
          if (savedChat) {
            localMessages = JSON.parse(savedChat);
          }
        } catch (err) {
          console.error("Error loading chat from localStorage:", err);
        }

        // Use whichever has more messages (API or localStorage)
        // This ensures we don't lose chat history
        if (apiMessages.length >= localMessages.length) {
          setChatMessages(apiMessages);
        } else {
          setChatMessages(localMessages);
        }

        // Fetch revision feedback if in revision status
        const reviewRes = await fetch(`/api/contents/${contentId}/reviews`);
        if (reviewRes.ok) {
          const data = await reviewRes.json();
          const reviews = Array.isArray(data) ? data : data.data || [];
          const latestRevision = reviews.find(
            (r: any) => r.decision === "revision"
          );
          if (latestRevision) {
            setRevisionFeedback(latestRevision.feedback);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [contentId]);

  // Save brief sections
  const saveBrief = useCallback(async () => {
    if (!content) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/contents/${contentId}/brief`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: briefSections }),
      });
      if (!res.ok) throw new Error("Failed to save brief");
    } catch (error) {
      console.error("Error saving brief:", error);
    } finally {
      setSaving(false);
    }
  }, [content, contentId, briefSections]);

  // Auto-save hook (saves every 2 minutes if there are changes)
  const { lastSaved, isSaving: isAutoSaving, hasUnsavedChanges } = useAutoSave(
    briefSections,
    {
      interval: 120000, // 2 minutes
      onSave: saveBrief,
      enabled: isEditable && briefSections.length > 0,
    }
  );

  // Format last saved time
  const formatLastSaved = (date: Date | null) => {
    if (!date) return null;
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  // Handle AI suggestion apply
  const handleApplySuggestion = useCallback(
    (suggestion: AISuggestion) => {
      if (!isEditable) return;

      // Convert suggestion sections to BriefSection format
      const newSections: BriefSection[] = suggestion.sections.map((s, idx) => ({
        id: generateId(),
        order: briefSections.length + idx + 1,
        title: s.title,
        duration: s.duration || 5,
        fields: s.fields?.map((f) => ({
          id: generateId(),
          type: f.type,
          label: f.label,
          value: f.value,
        })) || [],
      }));

      // For now, add new sections (later we can support update existing)
      const updatedSections = [...briefSections, ...newSections];
      setBriefSections(updatedSections);

      // Highlight new sections
      if (newSections.length > 0) {
        setHighlightedSectionId(newSections[0].id);
        setTimeout(() => setHighlightedSectionId(null), 3000);
      }
    },
    [briefSections, isEditable]
  );

  // Apply AI actions (from chat response)
  const applyAIActions = useCallback(
    (actions: AIAction[]) => {
      if (!isEditable || !actions) return;

      let updatedSections = [...briefSections];

      actions.forEach((action) => {
        if (action.type === "create_section") {
          // Create new section
          const newSection: BriefSection = {
            id: generateId(),
            order: updatedSections.length + 1,
            title: action.section_title,
            duration: action.duration || 5,
            fields:
              action.fields?.map((f) => ({
                id: generateId(),
                type: f.type,
                label: f.label,
                value: f.value,
              })) || [],
          };
          updatedSections.push(newSection);
          setHighlightedSectionId(newSection.id);
        } else if (action.type === "update_section" && action.section_id) {
          // Update existing section
          updatedSections = updatedSections.map((s) => {
            if (s.id === action.section_id) {
              return {
                ...s,
                title: action.section_title || s.title,
                duration: action.duration || s.duration,
                fields:
                  action.fields?.map((f) => ({
                    id: generateId(),
                    type: f.type,
                    label: f.label,
                    value: f.value,
                  })) || s.fields,
              };
            }
            return s;
          });
          setHighlightedSectionId(action.section_id);
        } else if (action.type === "delete_section" && action.section_id) {
          // Delete section
          updatedSections = updatedSections.filter(
            (s) => s.id !== action.section_id
          );
        }
      });

      setBriefSections(updatedSections);
      setTimeout(() => setHighlightedSectionId(null), 3000);
    },
    [briefSections, isEditable]
  );

  // Handle chat message changes (check for actions)
  const handleMessagesChange = useCallback(
    (messages: ChatMessage[]) => {
      setChatMessages(messages);

      // Check if latest message has actions
      const latestMessage = messages[messages.length - 1];
      if (latestMessage?.role === "assistant" && latestMessage.actions) {
        applyAIActions(latestMessage.actions);
      }
    },
    [applyAIActions]
  );

  // Submit for review
  const handleSubmitReview = async () => {
    if (!content) return;

    // Save brief first
    await saveBrief();

    // Update status
    try {
      const res = await fetch(`/api/contents/${contentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "idea_submitted" }),
      });
      if (res.ok) {
        setContent({ ...content, status: "idea_submitted" });
      }
    } catch (error) {
      console.error("Error submitting:", error);
    }
  };

  // Save caption
  const handleSaveCaption = async () => {
    if (!content) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/contents/${contentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption }),
      });
      if (res.ok) {
        setContent({ ...content, caption });
        setEditingCaption(false);
      }
    } catch (error) {
      console.error("Error saving caption:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-slate-500">Content not found</p>
        <Link href="/dashboard/contents" className="text-blue-600 mt-2">
          Back to Contents
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[content.status];
  const typeConfig = TYPE_CONFIG[content.contentType];
  const StatusIcon = statusConfig.icon;
  const TypeIcon = typeConfig.icon;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="px-4 py-3">
          {/* Back button and ID */}
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/dashboard/contents"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <span className="text-sm font-mono text-slate-500">
              {content.uniqueId}
            </span>
          </div>

          {/* Title and metadata */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                {content.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-500">
                {content.pillarEmoji && (
                  <span>
                    {content.pillarEmoji} {content.pillarName}
                  </span>
                )}
                <span>•</span>
                <span className="flex items-center gap-1">
                  <TypeIcon className="w-4 h-4" />
                  {typeConfig.label}
                </span>
                <span>•</span>
                <span>{content.platforms?.join(", ")}</span>
                {content.publishDate && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(content.publishDate).toLocaleDateString("id-ID")}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Auto-save indicator */}
              {isEditable && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  {isAutoSaving || saving ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : lastSaved ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Saved {formatLastSaved(lastSaved)}</span>
                    </>
                  ) : hasUnsavedChanges ? (
                    <>
                      <AlertCircle className="w-3 h-3 text-amber-500" />
                      <span>Unsaved changes</span>
                    </>
                  ) : null}
                </div>
              )}

              {/* Status badge */}
              <div
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                  statusConfig.bgColor,
                  statusConfig.color
                )}
              >
                <StatusIcon className="w-4 h-4" />
                {statusConfig.label}
              </div>

              {/* Submit button */}
              {isEditable && (
                <button
                  onClick={handleSubmitReview}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Submit ke Review
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="flex md:hidden border-t border-slate-200">
          <button
            onClick={() => setMobileTab("brief")}
            className={cn(
              "flex-1 py-3 text-sm font-medium text-center transition-colors",
              mobileTab === "brief"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500"
            )}
          >
            <FileText className="w-4 h-4 inline mr-1.5" />
            Brief
          </button>
          <button
            onClick={() => setMobileTab("ai")}
            className={cn(
              "flex-1 py-3 text-sm font-medium text-center transition-colors",
              mobileTab === "ai"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500"
            )}
          >
            <MessageSquare className="w-4 h-4 inline mr-1.5" />
            AI Chat
          </button>
        </div>
      </header>

      {/* Main content - Brief Editor (left) + AI Chat (right) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Brief Editor Panel */}
        <div
          className={cn(
            "flex-1 md:w-[55%] md:max-w-[55%] border-r border-slate-200 bg-white overflow-hidden",
            mobileTab !== "brief" && "hidden md:block"
          )}
        >
          <BriefEditor
            sections={briefSections}
            isEditable={isEditable}
            onSectionsChange={setBriefSections}
            onSave={saveBrief}
            isSaving={saving}
            highlightedSectionId={highlightedSectionId}
          />
        </div>

        {/* AI Chat Panel */}
        <div
          className={cn(
            "flex-1 md:w-[45%] md:max-w-[45%] overflow-hidden",
            mobileTab !== "ai" && "hidden md:block"
          )}
        >
          <AIChatPanel
            contentId={contentId}
            messages={chatMessages}
            onMessagesChange={handleMessagesChange}
            isEditable={isEditable}
            onApplySuggestion={handleApplySuggestion}
            revisionFeedback={revisionFeedback}
            briefSections={briefSections}
          />
        </div>
      </div>

      {/* Caption Section (bottom) */}
      <div className="border-t border-slate-200 bg-white px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-slate-700">Caption</h3>
            {isEditable && !editingCaption && (
              <button
                onClick={() => setEditingCaption(true)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Edit
              </button>
            )}
          </div>

          {editingCaption ? (
            <div className="space-y-2">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write your caption here..."
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setCaption(content.caption || "");
                    setEditingCaption(false);
                  }}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCaption}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {caption || "(No caption yet)"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
