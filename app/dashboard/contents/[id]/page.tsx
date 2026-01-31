"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Film,
  Images,
  Smartphone,
  Instagram,
  Calendar,
  Clock,
  Link as LinkIcon,
  Music,
  FileText,
  Send,
  Upload,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  History,
  Pencil,
  ExternalLink,
  Play,
  User,
  Star,
  Loader2,
  Sparkles,
  Bot,
  Copy,
  Check,
  Save,
  X,
} from "lucide-react";

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
  durationSeconds: number;
  audioReference: string;
  slideCount: number;
  slideNotes: string;
  ctaNotes: string;
  outputUrl: string;
  notes: string;
  createdAt: string;
  submittedAt: string;
  approvedAt: string;
  description?: string;
}

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  message: string;
  createdAt: string;
}

interface Review {
  id: string;
  reviewPhase: "ideation" | "production";
  reviewerName: string;
  decision: "approved" | "revision";
  feedback: string;
  conceptScore: number;
  visualScore: number;
  captionScore: number;
  createdAt: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIData {
  chatHistory: ChatMessage[];
  generatedHook: string;
  generatedStructure: string;
  generatedCaption: string;
  description: string;
}

const STATUS_CONFIG: Record<ContentStatus, { label: string; color: string; bgColor: string; icon: any; description: string }> = {
  idea_draft: { label: "Draft Ide", color: "text-slate-600", bgColor: "bg-slate-100", icon: Pencil, description: "Kamu masih bisa edit dan develop ide ini dengan AI" },
  idea_submitted: { label: "Menunggu Review", color: "text-blue-600", bgColor: "bg-blue-50", icon: Send, description: "Menunggu review dari tim iCAN" },
  idea_revision: { label: "Perlu Revisi", color: "text-amber-600", bgColor: "bg-amber-50", icon: AlertCircle, description: "Ada revisi dari tim iCAN" },
  production_ready: { label: "Siap Produksi", color: "text-indigo-600", bgColor: "bg-indigo-50", icon: CheckCircle, description: "Ide disetujui, siap untuk diproduksi" },
  production_in_progress: { label: "Dalam Produksi", color: "text-purple-600", bgColor: "bg-purple-50", icon: Clock, description: "Sedang dalam proses produksi" },
  production_submitted: { label: "Review Hasil", color: "text-blue-600", bgColor: "bg-blue-50", icon: Play, description: "Menunggu review hasil produksi" },
  production_revision: { label: "Revisi Output", color: "text-amber-600", bgColor: "bg-amber-50", icon: AlertCircle, description: "Output perlu direvisi" },
  ready_to_post: { label: "Siap Posting", color: "text-emerald-600", bgColor: "bg-emerald-50", icon: CheckCircle, description: "Konten siap untuk diposting" },
  posted: { label: "Sudah Tayang", color: "text-green-700", bgColor: "bg-green-100", icon: CheckCircle, description: "Konten sudah live" },
};

const TYPE_CONFIG: Record<ContentType, { label: string; icon: any; color: string }> = {
  reels: { label: "Reels/Video", icon: Film, color: "from-pink-500 to-rose-500" },
  carousel: { label: "Carousel", icon: Images, color: "from-blue-500 to-indigo-500" },
  story: { label: "Story", icon: Smartphone, color: "from-purple-500 to-violet-500" },
};

const QUICK_ACTIONS = [
  { label: "Generate Hook", prompt: "Buatkan 3 opsi hook yang menarik untuk konten ini" },
  { label: "Buat Struktur", prompt: "Buatkan struktur detail konten ini (scene by scene)" },
  { label: "Draft Caption", prompt: "Buatkan draft caption yang engaging untuk konten ini" },
  { label: "Improve Hook", prompt: "Berikan saran untuk improve hook yang sudah ada" },
];

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contentId = params.id as string;
  const chatEndRef = useRef<HTMLDivElement>(null);
  const aiChatEndRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<"overview" | "ai" | "discussion" | "history">("overview");
  const [content, setContent] = useState<Content | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingComment, setSendingComment] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [outputUrl, setOutputUrl] = useState("");
  const [session, setSession] = useState<any>(null);

  // Editable fields
  const [editingCaption, setEditingCaption] = useState(false);
  const [editingPublishDate, setEditingPublishDate] = useState(false);
  const [tempCaption, setTempCaption] = useState("");
  const [tempPublishDate, setTempPublishDate] = useState("");
  const [saving, setSaving] = useState(false);

  // AI Chat state
  const [aiData, setAiData] = useState<AIData | null>(null);
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const stored = localStorage.getItem("ican_session");
        if (stored) {
          setSession(JSON.parse(stored));
        }

        // Fetch content
        const contentRes = await fetch(`/api/contents/${contentId}`);
        if (contentRes.ok) {
          const data = await contentRes.json();
          const contentData = data.data || data;
          setContent(contentData);
          setTempCaption(contentData.caption || "");
          setTempPublishDate(contentData.publishDate || "");
        }

        // Fetch AI chat data (full history from database)
        const aiRes = await fetch(`/api/contents/${contentId}/chat?full=true`);
        if (aiRes.ok) {
          const data = await aiRes.json();
          if (data.success && data.data) {
            setAiData(data.data);
            setAiMessages(data.data.chatHistory || []);
          }
        }

        // Fetch comments
        const commentsRes = await fetch(`/api/contents/${contentId}/comments`);
        if (commentsRes.ok) {
          const data = await commentsRes.json();
          setComments(Array.isArray(data) ? data : (data.data || []));
        }

        // Fetch reviews
        const reviewsRes = await fetch(`/api/contents/${contentId}/reviews`);
        if (reviewsRes.ok) {
          const data = await reviewsRes.json();
          setReviews(Array.isArray(data) ? data : (data.data || []));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [contentId]);

  useEffect(() => {
    if (activeTab === "discussion" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    if (activeTab === "ai" && aiChatEndRef.current) {
      aiChatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments, aiMessages, activeTab]);

  const handleSaveCaption = async () => {
    if (!content) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/contents/${contentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: tempCaption }),
      });
      if (res.ok) {
        setContent({ ...content, caption: tempCaption });
        setEditingCaption(false);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePublishDate = async () => {
    if (!content) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/contents/${contentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishDate: tempPublishDate }),
      });
      if (res.ok) {
        setContent({ ...content, publishDate: tempPublishDate });
        setEditingPublishDate(false);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitIdea = async () => {
    if (!content) return;
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
      console.error("Error:", error);
    }
  };

  const handleUploadOutput = async () => {
    if (!content || !outputUrl) return;
    try {
      const res = await fetch(`/api/contents/${contentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "production_submitted", outputUrl }),
      });
      if (res.ok) {
        setContent({ ...content, status: "production_submitted", outputUrl });
        setOutputUrl("");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleMarkAsPosted = async () => {
    if (!content) return;
    try {
      const res = await fetch(`/api/contents/${contentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "posted" }),
      });
      if (res.ok) {
        setContent({ ...content, status: "posted" });
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !session) return;

    try {
      setSendingComment(true);
      const res = await fetch(`/api/contents/${contentId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: newComment,
          authorId: session.id || session.clientId || "anonymous",
          authorName: session.name,
          authorRole: session.role,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments([...comments, {
          id: data.id,
          authorId: session.id || "",
          authorName: session.name,
          authorRole: session.role,
          message: newComment,
          createdAt: new Date().toISOString(),
        }]);
        setNewComment("");
      } else {
        const errData = await res.json();
        console.error("Error response:", errData);
        alert("Gagal mengirim komentar: " + (errData.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan saat mengirim komentar");
    } finally {
      setSendingComment(false);
    }
  };

  const handleAiChat = async (message?: string) => {
    const msgToSend = message || aiInput;
    if (!msgToSend.trim() || aiLoading) return;

    const userMessage: ChatMessage = { role: "user", content: msgToSend };
    setAiMessages(prev => [...prev, userMessage]);
    setAiInput("");
    setAiLoading(true);

    try {
      const res = await fetch(`/api/contents/${contentId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msgToSend,
          conversationHistory: aiMessages,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const assistantMessage: ChatMessage = { role: "assistant", content: data.response };
        setAiMessages(prev => [...prev, assistantMessage]);

        if (data.extracted) {
          setAiData(prev => ({
            ...prev!,
            generatedHook: data.extracted.hook || prev?.generatedHook || "",
            generatedStructure: data.extracted.structure || prev?.generatedStructure || "",
            generatedCaption: data.extracted.caption || prev?.generatedCaption || "",
          }));
        }
      } else {
        const errorMessage: ChatMessage = { role: "assistant", content: `Error: ${data.error || "Terjadi kesalahan"}` };
        setAiMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: ChatMessage = { role: "assistant", content: "Maaf, terjadi kesalahan. Silakan coba lagi." };
      setAiMessages(prev => [...prev, errorMessage]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-fg-muted mb-4">Konten tidak ditemukan</p>
          <Link href="/dashboard/contents" className="text-accent hover:underline">
            Kembali ke Daftar Konten
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[content.status];
  const typeConfig = TYPE_CONFIG[content.contentType];
  const StatusIcon = statusConfig.icon;
  const TypeIcon = typeConfig.icon;

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: FileText },
    { id: "ai" as const, label: "AI Assistant", icon: Sparkles },
    { id: "discussion" as const, label: "Diskusi", icon: MessageSquare, count: comments.length },
    { id: "history" as const, label: "Review", icon: History, count: reviews.length },
  ];

  // AI Assistant now available for all statuses
  const canUseAI = true;
  const canEdit = content.status === "idea_draft" || content.status === "idea_revision";

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Link
          href="/dashboard/contents"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all mt-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
              typeConfig.color
            )}>
              <TypeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-mono">{content.uniqueId}</p>
              <h1 className="text-2xl font-bold text-slate-800">{content.title}</h1>
            </div>
          </div>
        </div>

        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl font-medium",
          statusConfig.bgColor,
          statusConfig.color
        )}>
          <StatusIcon className="w-5 h-5" />
          {statusConfig.label}
        </div>
      </div>

      {/* Status Description & Actions */}
      <div className="glass-card rounded-2xl p-5 mb-6">
        <p className="text-slate-600 mb-4">{statusConfig.description}</p>

        <div className="flex flex-wrap gap-3">
          {content.status === "idea_draft" && (
            <>
              <button
                onClick={() => setActiveTab("ai")}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-violet-500/25 hover:shadow-xl transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Develop dengan AI
              </button>
              <button
                onClick={handleSubmitIdea}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all"
              >
                <Send className="w-4 h-4" />
                Submit untuk Review
              </button>
            </>
          )}

          {content.status === "idea_revision" && (
            <>
              <button
                onClick={() => setActiveTab("ai")}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-violet-500/25 hover:shadow-xl transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Revisi dengan AI
              </button>
              <button
                onClick={handleSubmitIdea}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all"
              >
                <Send className="w-4 h-4" />
                Re-submit
              </button>
            </>
          )}

          {(content.status === "production_ready" || content.status === "production_revision") && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {content.status === "production_revision" ? "Re-upload Output" : "Upload Output"} (Google Drive/Canva link)
              </label>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={outputUrl}
                  onChange={(e) => setOutputUrl(e.target.value)}
                  placeholder="https://drive.google.com/... atau https://www.canva.com/..."
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button
                  onClick={handleUploadOutput}
                  disabled={!outputUrl}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all",
                    outputUrl
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  )}
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
              </div>
            </div>
          )}

          {content.status === "ready_to_post" && (
            <button
              onClick={handleMarkAsPosted}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              Tandai Sudah Diposting
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? tab.id === "ai"
                    ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white"
                    : "bg-blue-50 text-blue-600"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded-md text-xs",
                  activeTab === tab.id ? "bg-white/20" : "bg-slate-100"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="glass-card rounded-2xl p-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            {/* Basic Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Tipe Konten</p>
                <p className="font-medium text-slate-800 flex items-center gap-2">
                  <TypeIcon className="w-4 h-4" />
                  {typeConfig.label}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Platform</p>
                <div className="flex items-center gap-1">
                  {content.platforms?.includes("instagram") && (
                    <span className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Instagram className="w-3.5 h-3.5 text-white" />
                    </span>
                  )}
                  {content.platforms?.includes("tiktok") && (
                    <span className="w-6 h-6 rounded-md bg-black flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Content Pillar</p>
                <p className="font-medium text-slate-800">{content.pillarEmoji} {content.pillarName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  Tanggal Publish
                  {canEdit && !editingPublishDate && (
                    <button onClick={() => setEditingPublishDate(true)} className="text-blue-500 hover:text-blue-600">
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </p>
                {editingPublishDate ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={tempPublishDate}
                      onChange={(e) => setTempPublishDate(e.target.value)}
                      className="px-2 py-1 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button onClick={handleSavePublishDate} disabled={saving} className="text-green-600 hover:text-green-700">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setEditingPublishDate(false); setTempPublishDate(content.publishDate || ""); }} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="font-medium text-slate-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {content.publishDate ? new Date(content.publishDate).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }) : "-"}
                  </p>
                )}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Description */}
            {content.description && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Deskripsi / Ide Awal</h3>
                <div className="p-4 bg-slate-50 rounded-xl whitespace-pre-wrap text-slate-700">
                  {content.description}
                </div>
              </div>
            )}

            {/* Caption - Editable */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-500">Caption</h3>
                {canEdit && !editingCaption && (
                  <button
                    onClick={() => setEditingCaption(true)}
                    className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                )}
              </div>
              {editingCaption ? (
                <div className="space-y-3">
                  <textarea
                    value={tempCaption}
                    onChange={(e) => setTempCaption(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    placeholder="Tulis caption konten..."
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveCaption}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-all disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Simpan
                    </button>
                    <button
                      onClick={() => { setEditingCaption(false); setTempCaption(content.caption || ""); }}
                      className="px-4 py-2 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-100 transition-all"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl whitespace-pre-wrap text-slate-700">
                  {content.caption || <span className="text-slate-400 italic">Tidak ada caption</span>}
                </div>
              )}
            </div>

            {/* Type specific details */}
            {content.contentType === "reels" && (content.durationSeconds || content.audioReference) && (
              <div className="grid grid-cols-2 gap-4">
                {content.durationSeconds > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Durasi
                    </h3>
                    <p className="text-slate-800">{content.durationSeconds} detik</p>
                  </div>
                )}
                {content.audioReference && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                      <Music className="w-4 h-4" />
                      Audio Reference
                    </h3>
                    <p className="text-slate-800">{content.audioReference}</p>
                  </div>
                )}
              </div>
            )}

            {content.referenceLinks && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Link Referensi
                </h3>
                <a
                  href={content.referenceLinks}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  {content.referenceLinks}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {content.outputUrl && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Output URL
                </h3>
                <a
                  href={content.outputUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  {content.outputUrl}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {content.notes && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Catatan
                </h3>
                <p className="text-slate-700">{content.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* AI Assistant Tab */}
        {activeTab === "ai" && (
          <div className="animate-fade-in">
            {false ? ( // AI now available for all statuses
              <div className="text-center py-8">
                <Bot className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">AI Assistant tidak tersedia</h3>
                <p className="text-slate-500">AI Assistant hanya tersedia saat status konten adalah Draft atau Revision.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-2 mb-4">
                    <Bot className="w-5 h-5 text-violet-600" />
                    <h3 className="font-semibold text-slate-800">Chat dengan AI</h3>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {QUICK_ACTIONS.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAiChat(action.prompt)}
                        disabled={aiLoading}
                        className="px-3 py-1.5 text-sm bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 transition-all disabled:opacity-50"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>

                  <div className="h-[400px] overflow-y-auto border border-slate-200 rounded-xl p-4 mb-4 bg-slate-50">
                    {aiMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <Sparkles className="w-12 h-12 text-violet-300 mb-4" />
                        <h4 className="font-medium text-slate-700 mb-2">Mulai develop konten dengan AI</h4>
                        <p className="text-sm text-slate-500 max-w-md">
                          Tanyakan apa saja untuk membantu develop ide konten kamu - dari hook, struktur, hingga caption yang engaging.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {aiMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "")}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                              msg.role === "user"
                                ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white"
                                : "bg-gradient-to-br from-violet-500 to-purple-500 text-white"
                            )}>
                              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                            </div>
                            <div className={cn(
                              "max-w-[80%] rounded-2xl px-4 py-3",
                              msg.role === "user"
                                ? "bg-blue-500 text-white rounded-br-md"
                                : "bg-white border border-slate-200 text-slate-700 rounded-bl-md"
                            )}>
                              <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                            </div>
                          </div>
                        ))}
                        {aiLoading && (
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                              <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                                <span className="text-sm text-slate-500">AI sedang berpikir...</span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={aiChatEndRef} />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAiChat()}
                      placeholder="Tanyakan sesuatu ke AI..."
                      disabled={aiLoading}
                      className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all disabled:opacity-50"
                    />
                    <button
                      onClick={() => handleAiChat()}
                      disabled={!aiInput.trim() || aiLoading}
                      className={cn(
                        "px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2",
                        aiInput.trim() && !aiLoading
                          ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      )}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-violet-600" />
                    Generated Content
                  </h3>

                  <div className="border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Hook</span>
                      {aiData?.generatedHook && (
                        <button onClick={() => handleCopy(aiData.generatedHook, "hook")} className="text-slate-400 hover:text-slate-600">
                          {copiedField === "hook" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {aiData?.generatedHook || <span className="text-slate-400 italic">Belum ada hook</span>}
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Struktur</span>
                      {aiData?.generatedStructure && (
                        <button onClick={() => handleCopy(aiData.generatedStructure, "structure")} className="text-slate-400 hover:text-slate-600">
                          {copiedField === "structure" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {aiData?.generatedStructure || <span className="text-slate-400 italic">Belum ada struktur</span>}
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Caption</span>
                      {aiData?.generatedCaption && (
                        <button onClick={() => handleCopy(aiData.generatedCaption, "caption")} className="text-slate-400 hover:text-slate-600">
                          {copiedField === "caption" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {aiData?.generatedCaption || <span className="text-slate-400 italic">Belum ada caption</span>}
                    </div>
                  </div>

                  <div className="bg-violet-50 rounded-xl p-3 border border-violet-100">
                    <p className="text-xs text-violet-700">
                      Generated content akan otomatis tersimpan. Kamu bisa copy dan gunakan sebagai referensi saat produksi.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Discussion Tab */}
        {activeTab === "discussion" && (
          <div className="animate-fade-in">
            <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 mb-2">Belum ada diskusi</p>
                  <p className="text-xs text-slate-400">Mulai diskusi dengan tim iCAN di sini</p>
                </div>
              ) : (
                comments.map((comment) => {
                  const isAdmin = comment.authorRole === "admin";
                  const isMe = session && (comment.authorName === session.name);

                  return (
                    <div key={comment.id} className={cn("flex gap-3", isMe ? "flex-row-reverse" : "")}>
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0",
                        isAdmin
                          ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white"
                          : "bg-gradient-to-br from-emerald-500 to-green-500 text-white"
                      )}>
                        {comment.authorName[0]}
                      </div>
                      <div className={cn("max-w-[70%]", isMe ? "items-end" : "")}>
                        <div className={cn("flex items-center gap-2 mb-1", isMe ? "flex-row-reverse" : "")}>
                          <span className="font-medium text-slate-800 text-sm">
                            {comment.authorName}
                            {isAdmin && (
                              <span className="ml-1 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded">
                                iCAN Team
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(comment.createdAt).toLocaleString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className={cn(
                          "rounded-2xl p-3 text-sm",
                          isMe
                            ? "bg-blue-500 text-white rounded-br-md"
                            : isAdmin
                            ? "bg-blue-50 text-slate-700 rounded-bl-md"
                            : "bg-slate-100 text-slate-700 rounded-bl-md"
                        )}>
                          {comment.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="flex gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0",
                  session?.role === "admin"
                    ? "bg-gradient-to-br from-blue-500 to-indigo-500"
                    : "bg-gradient-to-br from-emerald-500 to-green-500"
                )}>
                  {session?.name?.[0] || "?"}
                </div>
                <div className="flex-1">
                  <div className="flex gap-2">
                    <input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddComment()}
                      placeholder="Tulis pesan..."
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || sendingComment}
                      className={cn(
                        "px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2",
                        newComment.trim() && !sendingComment
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      )}
                    >
                      {sendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="animate-fade-in">
            {reviews.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Belum ada review</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className={cn(
                    "p-5 rounded-xl border-2",
                    review.decision === "approved"
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-amber-200 bg-amber-50/50"
                  )}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          review.decision === "approved" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                        )}>
                          {review.decision === "approved" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {review.reviewPhase === "ideation" ? "Ideation Review" : "Production Review"}
                          </p>
                          <p className="text-sm text-slate-500">
                            by {review.reviewerName} · {new Date(review.createdAt).toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-sm font-medium",
                        review.decision === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {review.decision === "approved" ? "Approved" : "Needs Revision"}
                      </span>
                    </div>

                    {review.feedback && (
                      <div className="mb-4 p-3 bg-white/50 rounded-lg">
                        <p className="text-sm font-medium text-slate-600 mb-1">Feedback:</p>
                        <p className="text-slate-700 whitespace-pre-wrap">{review.feedback}</p>
                      </div>
                    )}

                    {(review.conceptScore || review.visualScore || review.captionScore) && (
                      <div className="flex gap-4">
                        {review.conceptScore > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-500">Concept:</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={cn("w-4 h-4", i < review.conceptScore ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                              ))}
                            </div>
                          </div>
                        )}
                        {review.visualScore > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-500">Visual:</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={cn("w-4 h-4", i < review.visualScore ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                              ))}
                            </div>
                          </div>
                        )}
                        {review.captionScore > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-500">Caption:</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={cn("w-4 h-4", i < review.captionScore ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
