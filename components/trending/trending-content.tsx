"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Loader2,
  RefreshCw,
  Filter,
  Grid3X3,
  LayoutList,
  Search,
  AlertCircle,
  Flame,
  Sparkles,
  Clock
} from "lucide-react";
import { TrendingVideo } from "@/types";
import { TrendingVideoCard } from "./trending-video-card";
import { cn } from "@/lib/utils";

// Category config with icons and colors
const CATEGORY_CONFIG: Record<string, { icon: any; color: string; bgColor: string }> = {
  entertainment: { icon: Sparkles, color: "text-purple-600", bgColor: "bg-purple-100" },
  education: { icon: Flame, color: "text-orange-600", bgColor: "bg-orange-100" },
  lifestyle: { icon: TrendingUp, color: "text-green-600", bgColor: "bg-green-100" },
  trending: { icon: Flame, color: "text-red-600", bgColor: "bg-red-100" },
  default: { icon: TrendingUp, color: "text-blue-600", bgColor: "bg-blue-100" },
};

export function TrendingContent() {
  const [videos, setVideos] = useState<TrendingVideo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch trending videos
  const fetchVideos = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const params = new URLSearchParams();
      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }
      params.append("limit", "50");

      const response = await fetch(`/api/trending?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Gagal memuat video trending");
      }

      const data = await response.json();
      setVideos(data.videos || []);
      setCategories(data.categories || []);
    } catch (err: any) {
      console.error("Error fetching trending videos:", err);
      setError(err.message || "Gagal memuat video trending");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [selectedCategory]);

  // Filter videos by search query
  const filteredVideos = videos.filter((video) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const hashtagsArr = Array.isArray(video.hashtags)
      ? video.hashtags
      : typeof video.hashtags === "string"
        ? (video.hashtags as string).split(",")
        : [];
    return (
      video.description?.toLowerCase().includes(query) ||
      video.authorUsername?.toLowerCase().includes(query) ||
      video.authorNickname?.toLowerCase().includes(query) ||
      video.soundTitle?.toLowerCase().includes(query) ||
      hashtagsArr.some((tag: string) => tag.toLowerCase().includes(query))
    );
  });

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="aspect-[9/16] bg-slate-100 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded animate-pulse w-2/3" />
                <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2" />
              </div>
            </div>
            <div className="h-4 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            Trending Content
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Inspirasi konten dari TikTok yang sedang viral
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchVideos(true)}
            disabled={isRefreshing}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              isRefreshing
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari video, hashtag, atau kreator..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category Tabs & View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                selectedCategory === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              Semua
            </button>
            {categories.map((category) => {
              const config = CATEGORY_CONFIG[category.toLowerCase()] || CATEGORY_CONFIG.default;
              const Icon = config.icon;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                    selectedCategory === category
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {category}
                </button>
              );
            })}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "grid"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "list"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-3" />
          <h3 className="font-semibold text-red-800 mb-1">Gagal Memuat Data</h3>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchVideos()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-2">
            {searchQuery ? "Tidak Ada Hasil" : "Belum Ada Video Trending"}
          </h3>
          <p className="text-sm text-slate-500">
            {searchQuery
              ? `Tidak ditemukan video untuk "${searchQuery}"`
              : "Video trending akan muncul di sini setelah di-sync."}
          </p>
        </div>
      ) : (
        <>
          {/* Result count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Menampilkan <span className="font-medium text-slate-700">{filteredVideos.length}</span> video
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear search
              </button>
            )}
          </div>

          {/* Video Grid */}
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
                : "space-y-4"
            )}
          >
            {filteredVideos.map((video) => (
              <TrendingVideoCard key={video.id} video={video} />
            ))}
          </div>
        </>
      )}

      {/* Last Updated Info */}
      {!isLoading && videos.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-4">
          <Clock className="w-3.5 h-3.5" />
          Data diperbarui setiap hari secara otomatis
        </div>
      )}
    </div>
  );
}
