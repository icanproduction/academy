"use client";

import { useState } from "react";
import {
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Music2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Hash,
  Play
} from "lucide-react";
import { TrendingVideo } from "@/types";
import { TikTokEmbed } from "./tiktok-embed";
import { cn } from "@/lib/utils";

interface TrendingVideoCardProps {
  video: TrendingVideo;
  onViewDetails?: (video: TrendingVideo) => void;
}

// Format large numbers (e.g., 1.2M, 500K)
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}

// Format duration in seconds to mm:ss
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function TrendingVideoCard({ video, onViewDetails }: TrendingVideoCardProps) {
  const [copied, setCopied] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(video.videoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const openInTikTok = () => {
    window.open(video.videoUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors group">
      {/* Video Preview */}
      <div className="relative aspect-[9/16] bg-slate-100">
        {showEmbed ? (
          <TikTokEmbed
            videoUrl={video.videoUrl}
            videoId={video.videoId}
            thumbnailUrl={video.thumbnailUrl}
          />
        ) : (
          <>
            {/* Thumbnail */}
            {video.thumbnailUrl ? (
              <img
                src={video.thumbnailUrl}
                alt={video.description || "TikTok video"}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                <Play className="w-12 h-12 text-slate-400" />
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            {/* Play button */}
            <button
              onClick={() => setShowEmbed(true)}
              className="absolute inset-0 flex items-center justify-center group/play"
            >
              <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform transition-transform group-hover/play:scale-110">
                <Play className="w-7 h-7 text-slate-800 ml-1" fill="currentColor" />
              </div>
            </button>

            {/* Duration badge */}
            <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 rounded-lg text-white text-xs font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(video.duration)}
            </div>

            {/* Category badge */}
            {video.category && (
              <div className="absolute top-3 right-3 px-2 py-1 bg-blue-500/80 rounded-lg text-white text-xs font-medium">
                {video.category}
              </div>
            )}

            {/* Stats overlay */}
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center gap-3 text-white text-xs">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {formatNumber(video.views)}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" />
                  {formatNumber(video.likes)}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {formatNumber(video.comments)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Author info */}
        <div className="flex items-center gap-3">
          {video.authorAvatar ? (
            <img
              src={video.authorAvatar}
              alt={video.authorNickname}
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
              {video.authorNickname?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {video.authorNickname || video.authorUsername}
            </p>
            <p className="text-xs text-slate-500 truncate">
              @{video.authorUsername}
            </p>
          </div>
        </div>

        {/* Description */}
        {video.description && (
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {video.description}
          </p>
        )}

        {/* Hashtags */}
        {video.hashtags && (Array.isArray(video.hashtags) ? video.hashtags.length > 0 : video.hashtags.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {(Array.isArray(video.hashtags)
              ? video.hashtags
              : typeof video.hashtags === "string"
                ? (video.hashtags as string).split(",")
                : []
            )
              .slice(0, 4)
              .map((tag: string, idx: number) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium"
                >
                  <Hash className="w-3 h-3" />
                  {tag.replace("#", "").trim()}
                </span>
              ))}
          </div>
        )}

        {/* Sound */}
        {video.soundTitle && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
            <Music2 className="w-4 h-4 text-pink-500 shrink-0" />
            <span className="truncate">{video.soundTitle}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={openInTikTok}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Buka
          </button>
          <button
            onClick={copyLink}
            className={cn(
              "flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              copied
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            )}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
