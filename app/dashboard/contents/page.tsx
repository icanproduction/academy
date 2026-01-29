"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Plus,
  Filter,
  Search,
  Film,
  Images,
  Smartphone,
  Instagram,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Eye,
  Pencil,
  MoreHorizontal,
  Calendar,
  ChevronDown,
  Loader2,
} from "lucide-react";

// Content types and status
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
  contentType: ContentType;
  platforms: string[];
  status: ContentStatus;
  publishDate: string;
  pillarName: string;
  pillarEmoji: string;
  pillarColor: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<ContentStatus, { label: string; color: string; bgColor: string; icon: any }> = {
  idea_draft: { label: "Draft Ide", color: "text-slate-600", bgColor: "bg-slate-100", icon: Pencil },
  idea_submitted: { label: "Menunggu Review", color: "text-blue-600", bgColor: "bg-blue-50", icon: Send },
  idea_revision: { label: "Perlu Revisi", color: "text-amber-600", bgColor: "bg-amber-50", icon: AlertCircle },
  production_ready: { label: "Siap Produksi", color: "text-indigo-600", bgColor: "bg-indigo-50", icon: CheckCircle },
  production_in_progress: { label: "Dalam Produksi", color: "text-purple-600", bgColor: "bg-purple-50", icon: Clock },
  production_submitted: { label: "Review Hasil", color: "text-blue-600", bgColor: "bg-blue-50", icon: Eye },
  production_revision: { label: "Revisi Output", color: "text-amber-600", bgColor: "bg-amber-50", icon: AlertCircle },
  ready_to_post: { label: "Siap Posting", color: "text-emerald-600", bgColor: "bg-emerald-50", icon: CheckCircle },
  posted: { label: "Sudah Tayang", color: "text-green-700", bgColor: "bg-green-100", icon: CheckCircle },
};

const TYPE_CONFIG: Record<ContentType, { label: string; icon: any; color: string }> = {
  reels: { label: "Reels/Video", icon: Film, color: "text-pink-500" },
  carousel: { label: "Carousel", icon: Images, color: "text-blue-500" },
  story: { label: "Story", icon: Smartphone, color: "text-purple-500" },
};

const PILLAR_COLORS: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  green: "bg-green-100 text-green-700 border-green-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
  pink: "bg-pink-100 text-pink-700 border-pink-200",
  red: "bg-red-100 text-red-700 border-red-200",
  yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
  teal: "bg-teal-100 text-teal-700 border-teal-200",
};

export default function ContentsPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch contents from API
  useEffect(() => {
    const fetchContents = async () => {
      try {
        setLoading(true);
        // Get session to get client ID
        const stored = localStorage.getItem("ican_session");
        if (!stored) return;

        const session = JSON.parse(stored);
        const res = await fetch(`/api/contents?clientId=${session.id}`);
        if (res.ok) {
          const data = await res.json();
          setContents(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching contents:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContents();
  }, []);

  // Filter contents
  const filteredContents = contents.filter((c) => {
    const matchesSearch = c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.uniqueId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    const matchesType = filterType === "all" || c.contentType === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Group by status phase
  const ideationContents = filteredContents.filter((c) =>
    ["idea_draft", "idea_submitted", "idea_revision"].includes(c.status)
  );
  const productionContents = filteredContents.filter((c) =>
    ["production_ready", "production_in_progress", "production_submitted", "production_revision"].includes(c.status)
  );
  const publishContents = filteredContents.filter((c) =>
    ["ready_to_post", "posted"].includes(c.status)
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Konten Saya</h1>
          <p className="text-slate-500 mt-1">Kelola semua konten yang kamu buat</p>
        </div>
        <Link
          href="/dashboard/contents/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          Buat Konten Baru
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="glass-card rounded-2xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari judul atau ID konten..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all",
              showFilters
                ? "bg-blue-50 text-blue-600 border border-blue-200"
                : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
            )}
          >
            <Filter className="w-4 h-4" />
            Filter
            <ChevronDown className={cn("w-4 h-4 transition-transform", showFilters && "rotate-180")} />
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-100 animate-fade-in">
            {/* Status Filter */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="all">Semua Status</option>
                <optgroup label="Ideation">
                  <option value="idea_draft">Draft Ide</option>
                  <option value="idea_submitted">Menunggu Review</option>
                  <option value="idea_revision">Perlu Revisi</option>
                </optgroup>
                <optgroup label="Production">
                  <option value="production_ready">Siap Produksi</option>
                  <option value="production_submitted">Review Hasil</option>
                  <option value="production_revision">Revisi Output</option>
                </optgroup>
                <optgroup label="Publish">
                  <option value="ready_to_post">Siap Posting</option>
                  <option value="posted">Sudah Tayang</option>
                </optgroup>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Tipe Konten</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="all">Semua Tipe</option>
                <option value="reels">Reels/Video</option>
                <option value="carousel">Carousel</option>
                <option value="story">Story</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-slate-500">Total Konten</p>
          <p className="text-2xl font-bold text-slate-800">{contents.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-slate-500">Dalam Proses</p>
          <p className="text-2xl font-bold text-blue-600">{ideationContents.length + productionContents.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-slate-500">Siap Posting</p>
          <p className="text-2xl font-bold text-emerald-600">{publishContents.filter(c => c.status === "ready_to_post").length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-slate-500">Sudah Tayang</p>
          <p className="text-2xl font-bold text-green-600">{publishContents.filter(c => c.status === "posted").length}</p>
        </div>
      </div>

      {/* Content List */}
      <div className="space-y-4">
        {filteredContents.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Film className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              {contents.length === 0 ? "Belum ada konten" : "Tidak ada konten yang sesuai filter"}
            </h3>
            <p className="text-slate-500 mb-6">
              {contents.length === 0
                ? "Mulai buat konten pertama kamu sekarang!"
                : "Coba ubah filter atau kata kunci pencarian"}
            </p>
            {contents.length === 0 && (
              <Link
                href="/dashboard/contents/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium"
              >
                <Plus className="w-5 h-5" />
                Buat Konten Baru
              </Link>
            )}
          </div>
        ) : (
          filteredContents.map((content, index) => {
            const statusConfig = STATUS_CONFIG[content.status] || STATUS_CONFIG.idea_draft;
            const typeConfig = TYPE_CONFIG[content.contentType] || TYPE_CONFIG.reels;
            const StatusIcon = statusConfig.icon;
            const TypeIcon = typeConfig.icon;

            return (
              <Link
                key={content.id}
                href={`/dashboard/contents/${content.id}`}
                className="glass-card rounded-2xl p-5 block hover:shadow-lg transition-all duration-300 group animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                    content.contentType === "reels" && "from-pink-500 to-rose-500",
                    content.contentType === "carousel" && "from-blue-500 to-indigo-500",
                    content.contentType === "story" && "from-purple-500 to-violet-500"
                  )}>
                    <TypeIcon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-400 font-mono mb-1">{content.uniqueId}</p>
                        <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                          {content.title}
                        </h3>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium shrink-0",
                        statusConfig.bgColor,
                        statusConfig.color
                      )}>
                        <StatusIcon className="w-4 h-4" />
                        {statusConfig.label}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      {/* Pillar */}
                      {content.pillarName && (
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-medium border",
                          PILLAR_COLORS[content.pillarColor] || PILLAR_COLORS.blue
                        )}>
                          {content.pillarEmoji} {content.pillarName}
                        </span>
                      )}

                      {/* Platforms */}
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

                      {/* Type */}
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <TypeIcon className={cn("w-3.5 h-3.5", typeConfig.color)} />
                        {typeConfig.label}
                      </span>

                      {/* Publish Date */}
                      {content.publishDate && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(content.publishDate).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      // TODO: show dropdown menu
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
