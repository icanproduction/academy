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
} from "lucide-react";

type ContentType = "reels" | "carousel" | "story";
type ContentStatus = "idea_submitted" | "production_submitted";

interface ReviewItem {
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
}

interface RevisionItem {
  id: string;
  text: string;
}

const TYPE_CONFIG: Record<ContentType, { label: string; icon: any; color: string }> = {
  reels: { label: "Reels", icon: Film, color: "from-pink-500 to-rose-500" },
  carousel: { label: "Carousel", icon: Images, color: "from-blue-500 to-indigo-500" },
  story: { label: "Story", icon: Smartphone, color: "from-purple-500 to-violet-500" },
};

export default function AdminReviewPage() {
  const [queue, setQueue] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterPhase, setFilterPhase] = useState<"all" | "ideation" | "production">("all");
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);

  // Review form states
  const [reviewDecision, setReviewDecision] = useState<"approved" | "revision">("approved");
  const [revisions, setRevisions] = useState<RevisionItem[]>([{ id: "1", text: "" }]);
  const [positiveFeedback, setPositiveFeedback] = useState("");
  const [scores, setScores] = useState({ concept: 0, visual: 0, caption: 0 });

  // Fetch review queue from API
  useEffect(() => {
    const fetchQueue = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/review-queue");
        if (res.ok) {
          const data = await res.json();
          // Ensure data is always an array
          setQueue(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching queue:", error);
        setQueue([]);
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
  }, []);

  const ideationQueue = (queue || []).filter((item) => item.status === "idea_submitted");
  const productionQueue = (queue || []).filter((item) => item.status === "production_submitted");

  const filteredQueue = filterPhase === "all"
    ? queue
    : filterPhase === "ideation"
    ? ideationQueue
    : productionQueue;

  const selectItem = (item: ReviewItem) => {
    setSelectedItem(item);
    setReviewDecision("approved");
    setRevisions([{ id: "1", text: "" }]);
    setPositiveFeedback("");
    setScores({ concept: 0, visual: 0, caption: 0 });
  };

  // Revision handlers
  const addRevision = () => {
    setRevisions([...revisions, { id: Date.now().toString(), text: "" }]);
  };

  const updateRevision = (id: string, text: string) => {
    setRevisions(revisions.map((r) => (r.id === id ? { ...r, text } : r)));
  };

  const removeRevision = (id: string) => {
    if (revisions.length === 1) return;
    setRevisions(revisions.filter((r) => r.id !== id));
  };

  const handleSubmitReview = async () => {
    if (!selectedItem) return;

    // Validate
    const hasRevisions = revisions.some((r) => r.text.trim());
    if (reviewDecision === "revision" && !hasRevisions) {
      alert("Harap isi minimal satu poin revisi");
      return;
    }

    try {
      setSubmitting(true);

      // Combine feedback
      const feedback = reviewDecision === "revision"
        ? revisions.filter((r) => r.text.trim()).map((r) => `• ${r.text}`).join("\n")
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
        // Remove from queue
        setQueue((prev) => prev.filter((item) => item.id !== selectedItem.id));
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

  // Detail View
  if (selectedItem) {
    const typeConfig = TYPE_CONFIG[selectedItem.contentType];
    const TypeIcon = typeConfig.icon;
    const isIdeation = selectedItem.status === "idea_submitted";

    return (
      <div className="p-8 max-w-6xl animate-fade-in">
        {/* Back button */}
        <button
          onClick={() => setSelectedItem(null)}
          className="inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Antrian
        </button>

        <div className="grid grid-cols-3 gap-6">
          {/* Left: Content Details */}
          <div className="col-span-2 space-y-6">
            {/* Header */}
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
                      Publish: {new Date(selectedItem.publishDate).toLocaleDateString("id-ID")}
                    </span>
                    <span className="flex items-center gap-1">
                      {selectedItem.pillarEmoji} {selectedItem.pillarName}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Caption */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-accent" />
                Caption
              </h3>
              <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-700 whitespace-pre-wrap">
                {selectedItem.caption || "Tidak ada caption"}
              </div>
            </div>

            {/* Links */}
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

            {/* Platform info */}
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
                    {selectedItem.platforms.includes("instagram") && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded text-xs">
                        <Instagram className="w-3 h-3" /> Instagram
                      </span>
                    )}
                    {selectedItem.platforms.includes("tiktok") && (
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

              {/* Decision */}
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

              {/* Conditional Feedback */}
              {reviewDecision === "revision" ? (
                /* Multiple Revisions */
                <div className="mb-5">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Poin Revisi <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {revisions.map((revision, index) => (
                      <div key={revision.id} className="flex gap-2">
                        <span className="w-6 h-10 flex items-center justify-center text-xs text-slate-400 font-medium">
                          {index + 1}.
                        </span>
                        <input
                          value={revision.text}
                          onChange={(e) => updateRevision(revision.id, e.target.value)}
                          placeholder="Apa yang perlu direvisi..."
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
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
                /* Positive Feedback */
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

              {/* Scores */}
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

              {/* Submit */}
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

  // Queue List View
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
            <p className="text-slate-500">Review dan approve konten dari client</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-slate-500">Total Antrian</p>
          <p className="text-3xl font-bold text-slate-800">{queue.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4 border-l-4 border-blue-500">
          <p className="text-sm text-slate-500">Ideation Review</p>
          <p className="text-3xl font-bold text-blue-600">{ideationQueue.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4 border-l-4 border-purple-500">
          <p className="text-sm text-slate-500">Production Review</p>
          <p className="text-3xl font-bold text-purple-600">{productionQueue.length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {[
          { id: "all" as const, label: "Semua" },
          { id: "ideation" as const, label: "Ideation", count: ideationQueue.length },
          { id: "production" as const, label: "Production", count: productionQueue.length },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setFilterPhase(filter.id)}
            className={cn(
              "px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2",
              filterPhase === filter.id
                ? "bg-blue-50 text-blue-600"
                : "text-slate-500 hover:bg-slate-50"
            )}
          >
            {filter.label}
            {filter.count !== undefined && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-md text-xs",
                filterPhase === filter.id ? "bg-blue-100" : "bg-slate-100"
              )}>
                {filter.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Queue List */}
      <div className="space-y-4">
        {filteredQueue.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              {queue.length === 0 ? "Belum ada konten yang perlu direview" : "Semua sudah direview!"}
            </h3>
            <p className="text-slate-500">
              {queue.length === 0
                ? "Konten akan muncul di sini ketika client submit untuk review."
                : "Tidak ada konten yang menunggu review saat ini."}
            </p>
          </div>
        ) : (
          filteredQueue.map((item, index) => {
            const typeConfig = TYPE_CONFIG[item.contentType];
            const TypeIcon = typeConfig.icon;
            const isIdeation = item.status === "idea_submitted";

            return (
              <div
                key={item.id}
                className="glass-card rounded-2xl p-5 animate-fade-in cursor-pointer hover:shadow-md hover:border-accent/30 transition-all"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => selectItem(item)}
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
                            isIdeation ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                          )}>
                            {isIdeation ? "Ideation" : "Production"}
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
                        Publish: {new Date(item.publishDate).toLocaleDateString("id-ID")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Submitted: {new Date(item.submittedAt).toLocaleString("id-ID")}
                      </span>
                    </div>

                    {/* Platform badges */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">{item.pillarEmoji} {item.pillarName}</span>
                      <span className="text-slate-300">|</span>
                      <div className="flex items-center gap-1">
                        {item.platforms.includes("instagram") && (
                          <span className="w-5 h-5 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Instagram className="w-3 h-3 text-white" />
                          </span>
                        )}
                        {item.platforms.includes("tiktok") && (
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
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      Review
                    </button>
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
