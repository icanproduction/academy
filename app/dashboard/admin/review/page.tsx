"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ClipboardCheck,
  Film,
  Images,
  Smartphone,
  Instagram,
  Calendar,
  User,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  Send,
  Star,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  MessageSquare,
  FileVideo,
  Filter,
} from "lucide-react";

type ContentType = "reels" | "carousel" | "story";
type ContentStatus =
  | "draft"
  | "idea_submitted"
  | "revision_idea"
  | "approved"
  | "in_progress"
  | "production_submitted"
  | "revision_production"
  | "ready_to_post"
  | "posted";

interface BriefField {
  id: string;
  type: string;
  label: string;
  value: string;
}

interface BriefSection {
  id: string;
  order: number;
  title: string;
  duration: number;
  fields: BriefField[];
}

interface ContentItem {
  id: string;
  uniqueId: string;
  title: string;
  clientName: string;
  clientId: string;
  contentType: ContentType;
  platforms: string[];
  status: ContentStatus;
  publishDate: string;
  pillarName: string;
  pillarEmoji: string;
  caption: string;
  referenceLinks: string;
  outputUrl: string;
  submittedAt: string;
  createdAt: string;
  description?: string;
  durationSeconds?: number;
  audioReference?: string;
  notes?: string;
  generatedHook?: string;
  generatedStructure?: string;
  generatedCaption?: string;
  briefSections?: BriefSection[];
}

interface RevisionItem {
  id: string;
  text: string;
  timestampStart: string;
  timestampEnd: string;
}

const TYPE_CONFIG: Record<ContentType, { label: string; icon: any; color: string }> = {
  reels: { label: "Reels", icon: Film, color: "from-pink-500 to-rose-500" },
  carousel: { label: "Carousel", icon: Images, color: "from-blue-500 to-indigo-500" },
  story: { label: "Story", icon: Smartphone, color: "from-purple-500 to-violet-500" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-600" },
  idea_submitted: { label: "Review Ide", color: "bg-amber-100 text-amber-700" },
  revision_idea: { label: "Revisi Ide", color: "bg-red-100 text-red-700" },
  approved: { label: "Approved", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "In Production", color: "bg-indigo-100 text-indigo-700" },
  production_submitted: { label: "Review Produksi", color: "bg-purple-100 text-purple-700" },
  revision_production: { label: "Revisi Produksi", color: "bg-red-100 text-red-700" },
  ready_to_post: { label: "Ready", color: "bg-emerald-100 text-emerald-700" },
  posted: { label: "Published", color: "bg-green-100 text-green-700" },
};

type FilterStatus = "pending_review" | "all" | "draft" | "in_progress" | "completed";

export default function AdminReviewPage() {
  const [allContents, setAllContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("pending_review");
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  // Review form states
  const [reviewDecision, setReviewDecision] = useState<"approved" | "revision">("approved");
  const [revisions, setRevisions] = useState<RevisionItem[]>([{ id: "1", text: "", timestampStart: "", timestampEnd: "" }]);
  const [positiveFeedback, setPositiveFeedback] = useState("");
  const [scores, setScores] = useState({ concept: 0, visual: 0, caption: 0 });

  // Fetch all contents from API
  useEffect(() => {
    const fetchContents = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/review-queue?all=true");
        if (res.ok) {
          const data = await res.json();
          setAllContents(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching contents:", error);
        setAllContents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchContents();
  }, []);

  // Filter contents based on status
  const pendingReviewContents = allContents.filter(
    (item) => item.status === "idea_submitted" || item.status === "production_submitted"
  );
  const draftContents = allContents.filter((item) => item.status === "draft");
  const inProgressContents = allContents.filter(
    (item) => ["approved", "in_progress", "revision_idea", "revision_production"].includes(item.status)
  );
  const completedContents = allContents.filter(
    (item) => ["ready_to_post", "posted"].includes(item.status)
  );

  const getFilteredContents = () => {
    switch (filterStatus) {
      case "pending_review":
        return pendingReviewContents;
      case "draft":
        return draftContents;
      case "in_progress":
        return inProgressContents;
      case "completed":
        return completedContents;
      case "all":
      default:
        return allContents;
    }
  };

  const filteredContents = getFilteredContents();

  const selectItem = (item: ContentItem) => {
    setSelectedItem(item);
    setReviewDecision("approved");
    setRevisions([{ id: "1", text: "", timestampStart: "", timestampEnd: "" }]);
    setPositiveFeedback("");
    setScores({ concept: 0, visual: 0, caption: 0 });
  };

  // Check if item needs review
  const needsReview = (status: string) =>
    status === "idea_submitted" || status === "production_submitted";

  // Revision handlers
  const addRevision = () => {
    setRevisions([...revisions, { id: Date.now().toString(), text: "", timestampStart: "", timestampEnd: "" }]);
  };

  const updateRevision = (id: string, field: keyof RevisionItem, value: string) => {
    setRevisions(revisions.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const removeRevision = (id: string) => {
    if (revisions.length === 1) return;
    setRevisions(revisions.filter((r) => r.id !== id));
  };

  const handleSubmitReview = async () => {
    if (!selectedItem) return;

    const hasRevisions = revisions.some((r) => r.text.trim());
    if (reviewDecision === "revision" && !hasRevisions) {
      alert("Harap isi minimal satu poin revisi");
      return;
    }

    try {
      setSubmitting(true);

      // Format revision with timestamps for video content
      const feedback = reviewDecision === "revision"
        ? revisions.filter((r) => r.text.trim()).map((r) => {
            const timestamp = (r.timestampStart || r.timestampEnd)
              ? ` [${r.timestampStart || "0"}s - ${r.timestampEnd || "end"}s]`
              : "";
            return `• ${r.text}${timestamp}`;
          }).join("\n")
        : positiveFeedback;

      const res = await fetch(`/api/contents/${selectedItem.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewPhase: selectedItem.status === "idea_submitted" ? "ideation" : "production",
          decision: reviewDecision,
          feedback,
          conceptScore: scores.concept,
          visualScore: scores.visual,
          captionScore: scores.caption,
        }),
      });

      if (res.ok) {
        // Update local state
        setAllContents((prev) =>
          prev.map((item) =>
            item.id === selectedItem.id
              ? {
                  ...item,
                  status: reviewDecision === "approved"
                    ? (selectedItem.status === "idea_submitted" ? "approved" : "ready_to_post")
                    : (selectedItem.status === "idea_submitted" ? "revision_idea" : "revision_production") as ContentStatus,
                }
              : item
          )
        );
        setSelectedItem(null);
      } else {
        alert("Gagal menyimpan review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarRating = (field: "concept" | "visual" | "caption") => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => setScores({ ...scores, [field]: star })}
          className="focus:outline-none"
        >
          <Star
            className={cn(
              "w-5 h-5 transition-colors",
              star <= scores[field]
                ? "text-amber-400 fill-amber-400"
                : "text-slate-200 hover:text-amber-200"
            )}
          />
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // Detail View (Review Mode)
  if (selectedItem && needsReview(selectedItem.status)) {
    const typeConfig = TYPE_CONFIG[selectedItem.contentType] || { label: "Content", icon: FileVideo, color: "from-slate-500 to-slate-600" };
    const TypeIcon = typeConfig.icon;
    const isIdeation = selectedItem.status === "idea_submitted";

    return (
      <div className="p-8 max-w-6xl animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setSelectedItem(null)}
            className="inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Daftar
          </button>
          <Link
            href={`/dashboard/admin/contents/${selectedItem.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Lihat Detail dengan Tab
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left: Content Details */}
          <div className="col-span-2 space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0",
                  typeConfig.color
                )}>
                  <TypeIcon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-xs font-medium",
                      isIdeation ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    )}>
                      {isIdeation ? "Ideation Review" : "Production Review"}
                    </span>
                    <span className="text-sm text-slate-400 font-mono">{selectedItem.uniqueId}</span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800">{selectedItem.title}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {selectedItem.clientName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Publish: {selectedItem.publishDate ? new Date(selectedItem.publishDate).toLocaleDateString("id-ID") : "-"}
                    </span>
                    <span className="flex items-center gap-1">
                      {selectedItem.pillarEmoji} {selectedItem.pillarName}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description / Ide Awal */}
            {selectedItem.description && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <FileVideo className="w-5 h-5 text-indigo-500" />
                  Deskripsi / Ide Awal
                </h3>
                <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-700 whitespace-pre-wrap">
                  {selectedItem.description}
                </div>
              </div>
            )}

            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-accent" />
                Caption
              </h3>
              <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-700 whitespace-pre-wrap">
                {selectedItem.caption || "Tidak ada caption"}
              </div>
            </div>

            {/* Brief Sections */}
            {selectedItem.briefSections && selectedItem.briefSections.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-violet-500" />
                  Brief Sections
                </h3>
                <div className="space-y-4">
                  {selectedItem.briefSections
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                      <div key={section.id} className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                          <span className="font-medium text-slate-700">{section.title}</span>
                          <span className="text-xs text-slate-500">{section.duration}s</span>
                        </div>
                        <div className="p-4 space-y-2">
                          {section.fields.map((field) => (
                            <div key={field.id} className="flex gap-2 text-sm">
                              <span className="text-slate-500 shrink-0 w-24">{field.label}:</span>
                              <span className="text-slate-700">{field.value || "(empty)"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  <div className="text-sm text-slate-500 text-right">
                    Total: {selectedItem.briefSections.reduce((sum, s) => sum + s.duration, 0)} seconds
                  </div>
                </div>
              </div>
            )}

            {/* Legacy AI Generated Content (fallback) */}
            {(!selectedItem.briefSections || selectedItem.briefSections.length === 0) &&
             (selectedItem.generatedHook || selectedItem.generatedStructure || selectedItem.generatedCaption) && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-violet-500" />
                  Brief (AI Generated)
                </h3>
                <div className="space-y-4">
                  {selectedItem.generatedHook && (
                    <div>
                      <p className="text-xs font-medium text-violet-600 mb-1.5">Hook Options</p>
                      <div className="p-3 bg-violet-50 rounded-lg text-sm text-slate-700 whitespace-pre-wrap border border-violet-100">
                        {selectedItem.generatedHook}
                      </div>
                    </div>
                  )}
                  {selectedItem.generatedStructure && (
                    <div>
                      <p className="text-xs font-medium text-blue-600 mb-1.5">Struktur Konten</p>
                      <div className="p-3 bg-blue-50 rounded-lg text-sm text-slate-700 whitespace-pre-wrap border border-blue-100">
                        {selectedItem.generatedStructure}
                      </div>
                    </div>
                  )}
                  {selectedItem.generatedCaption && (
                    <div>
                      <p className="text-xs font-medium text-emerald-600 mb-1.5">Draft Caption</p>
                      <div className="p-3 bg-emerald-50 rounded-lg text-sm text-slate-700 whitespace-pre-wrap border border-emerald-100">
                        {selectedItem.generatedCaption}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(selectedItem.referenceLinks || selectedItem.outputUrl) && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold text-slate-800 mb-3">Links</h3>
                <div className="space-y-3">
                  {selectedItem.referenceLinks && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Reference Link</p>
                      <a
                        href={selectedItem.referenceLinks}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                      >
                        {selectedItem.referenceLinks}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {selectedItem.outputUrl && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Output URL</p>
                      <a
                        href={selectedItem.outputUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Lihat Output
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold text-slate-800 mb-3">Platform & Type</h3>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Content Type</p>
                  <p className="font-medium">{typeConfig.label}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Platform</p>
                  <div className="flex items-center gap-2">
                    {selectedItem.platforms?.includes("instagram") && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded text-xs">
                        <Instagram className="w-3 h-3" /> Instagram
                      </span>
                    )}
                    {selectedItem.platforms?.includes("tiktok") && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-black text-white rounded text-xs">
                        TikTok
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Review Form */}
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6 sticky top-8">
              <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-accent" />
                Review
              </h2>

              <div className="mb-5">
                <label className="text-sm font-medium text-slate-700 mb-2 block">Keputusan</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReviewDecision("approved")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-medium transition-all text-sm",
                      reviewDecision === "approved"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-500 hover:border-emerald-300"
                    )}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => setReviewDecision("revision")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-medium transition-all text-sm",
                      reviewDecision === "revision"
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-slate-200 text-slate-500 hover:border-amber-300"
                    )}
                  >
                    <AlertCircle className="w-4 h-4" />
                    Revisi
                  </button>
                </div>
              </div>

              {reviewDecision === "revision" ? (
                <div className="mb-5">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Poin Revisi <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {revisions.map((revision, index) => (
                      <div key={revision.id} className="p-3 bg-slate-50 rounded-lg space-y-2">
                        <div className="flex gap-2">
                          <span className="w-6 h-9 flex items-center justify-center text-xs text-slate-400 font-medium">
                            {index + 1}.
                          </span>
                          <input
                            value={revision.text}
                            onChange={(e) => updateRevision(revision.id, "text", e.target.value)}
                            placeholder="Apa yang perlu direvisi..."
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white"
                          />
                          {revisions.length > 1 && (
                            <button
                              onClick={() => removeRevision(revision.id)}
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        {/* Timestamp inputs for video content */}
                        {selectedItem?.contentType === "reels" && (
                          <div className="flex items-center gap-2 pl-8">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs text-slate-500">Timestamp:</span>
                            <input
                              type="number"
                              value={revision.timestampStart}
                              onChange={(e) => updateRevision(revision.id, "timestampStart", e.target.value)}
                              placeholder="0"
                              min="0"
                              className="w-16 px-2 py-1 border border-slate-200 rounded text-xs text-center focus:ring-1 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                            />
                            <span className="text-xs text-slate-400">detik</span>
                            <span className="text-slate-400">-</span>
                            <input
                              type="number"
                              value={revision.timestampEnd}
                              onChange={(e) => updateRevision(revision.id, "timestampEnd", e.target.value)}
                              placeholder="0"
                              min="0"
                              className="w-16 px-2 py-1 border border-slate-200 rounded text-xs text-center focus:ring-1 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                            />
                            <span className="text-xs text-slate-400">detik</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addRevision}
                    className="mt-2 text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Revisi
                  </button>
                </div>
              ) : (
                <div className="mb-5">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Feedback (Opsional)
                  </label>
                  <textarea
                    value={positiveFeedback}
                    onChange={(e) => setPositiveFeedback(e.target.value)}
                    rows={3}
                    placeholder="Feedback positif untuk client..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                  />
                </div>
              )}

              <div className="mb-5">
                <label className="text-sm font-medium text-slate-700 mb-3 block">Skor (Opsional)</label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Concept</span>
                    {renderStarRating("concept")}
                  </div>
                  {!isIdeation && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Visual</span>
                      {renderStarRating("visual")}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Caption</span>
                    {renderStarRating("caption")}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmitReview}
                disabled={submitting || (reviewDecision === "revision" && !revisions.some((r) => r.text.trim()))}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all",
                  submitting || (reviewDecision === "revision" && !revisions.some((r) => r.text.trim()))
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : reviewDecision === "approved"
                    ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 hover:shadow-xl"
                )}
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                {submitting ? "Menyimpan..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="p-8 max-w-6xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <ClipboardCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Review Konten</h1>
            <p className="text-slate-500">Kelola dan review semua konten dari client</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-slate-500">Total Konten</p>
          <p className="text-3xl font-bold text-slate-800">{allContents.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4 border-l-4 border-amber-500">
          <p className="text-sm text-slate-500">Perlu Review</p>
          <p className="text-3xl font-bold text-amber-600">{pendingReviewContents.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4 border-l-4 border-slate-400">
          <p className="text-sm text-slate-500">Draft</p>
          <p className="text-3xl font-bold text-slate-600">{draftContents.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4 border-l-4 border-blue-500">
          <p className="text-sm text-slate-500">In Progress</p>
          <p className="text-3xl font-bold text-blue-600">{inProgressContents.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4 border-l-4 border-green-500">
          <p className="text-sm text-slate-500">Selesai</p>
          <p className="text-3xl font-bold text-green-600">{completedContents.length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-slate-400" />
        {[
          { id: "pending_review" as const, label: "Perlu Review", count: pendingReviewContents.length },
          { id: "all" as const, label: "Semua" },
          { id: "draft" as const, label: "Draft", count: draftContents.length },
          { id: "in_progress" as const, label: "In Progress", count: inProgressContents.length },
          { id: "completed" as const, label: "Selesai", count: completedContents.length },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setFilterStatus(filter.id)}
            className={cn(
              "px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2",
              filterStatus === filter.id
                ? filter.id === "pending_review"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-blue-50 text-blue-600"
                : "text-slate-500 hover:bg-slate-50"
            )}
          >
            {filter.label}
            {filter.count !== undefined && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-md text-xs",
                filterStatus === filter.id
                  ? filter.id === "pending_review" ? "bg-amber-100" : "bg-blue-100"
                  : "bg-slate-100"
              )}>
                {filter.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content List */}
      <div className="space-y-4">
        {filteredContents.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            {filterStatus === "pending_review" ? (
              <>
                <CheckCircle className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  Tidak ada konten yang perlu direview
                </h3>
                <p className="text-slate-500">
                  Semua konten sudah direview. Gunakan filter lain untuk melihat konten lainnya.
                </p>
              </>
            ) : (
              <>
                <FileVideo className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  Tidak ada konten
                </h3>
                <p className="text-slate-500">
                  Belum ada konten dengan status ini.
                </p>
              </>
            )}
          </div>
        ) : (
          filteredContents.map((item, index) => {
            const typeConfig = TYPE_CONFIG[item.contentType] || { label: "Content", icon: FileVideo, color: "from-slate-500 to-slate-600" };
            const TypeIcon = typeConfig.icon;
            const statusConfig = STATUS_CONFIG[item.status] || { label: item.status, color: "bg-slate-100 text-slate-600" };
            const isReviewable = needsReview(item.status);

            return (
              <div
                key={item.id}
                className={cn(
                  "glass-card rounded-2xl p-5 animate-fade-in transition-all",
                  isReviewable
                    ? "cursor-pointer hover:shadow-md hover:border-amber-300"
                    : "hover:shadow-sm"
                )}
                style={{ animationDelay: `${index * 30}ms` }}
                onClick={() => isReviewable && selectItem(item)}
              >
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
                    typeConfig.color
                  )}>
                    <TypeIcon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-xs font-medium",
                            statusConfig.color
                          )}>
                            {statusConfig.label}
                          </span>
                          <span className="text-sm text-slate-400 font-mono">{item.uniqueId}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800">{item.title}</h3>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-3">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {item.clientName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {item.publishDate
                          ? new Date(item.publishDate).toLocaleDateString("id-ID")
                          : "No date"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(item.createdAt).toLocaleDateString("id-ID")}
                      </span>
                    </div>

                    {/* Platform badges */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">{item.pillarEmoji} {item.pillarName}</span>
                      <span className="text-slate-300">|</span>
                      <div className="flex items-center gap-1">
                        {item.platforms?.includes("instagram") && (
                          <span className="w-5 h-5 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Instagram className="w-3 h-3 text-white" />
                          </span>
                        )}
                        {item.platforms?.includes("tiktok") && (
                          <span className="w-5 h-5 rounded bg-black flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {item.outputUrl && (
                      <a
                        href={item.outputUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        Output
                      </a>
                    )}
                    {isReviewable ? (
                      <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium shadow-lg shadow-amber-500/25 hover:shadow-xl transition-all">
                        <ClipboardCheck className="w-4 h-4" />
                        Review
                      </button>
                    ) : (
                      <Link
                        href={`/dashboard/admin/contents/${item.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        Lihat
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
