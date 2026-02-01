"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Loader2, ExternalLink, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface TikTokEmbedProps {
  videoUrl: string;
  videoId: string;
  thumbnailUrl?: string;
  className?: string;
}

export function TikTokEmbed({
  videoUrl,
  videoId,
  thumbnailUrl,
  className
}: TikTokEmbedProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [embedHtml, setEmbedHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch TikTok oEmbed data when user clicks play
  const loadEmbed = async () => {
    if (embedHtml) {
      setIsPlaying(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use TikTok's oEmbed API
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
      const response = await fetch(oembedUrl);

      if (!response.ok) {
        throw new Error("Failed to fetch embed");
      }

      const data = await response.json();
      setEmbedHtml(data.html);
      setIsPlaying(true);
    } catch (err: any) {
      console.error("Error loading TikTok embed:", err);
      setError("Tidak bisa memuat video. Klik untuk buka di TikTok.");
    } finally {
      setIsLoading(false);
    }
  };

  // Load TikTok embed script when embedHtml changes
  useEffect(() => {
    if (embedHtml && isPlaying && containerRef.current) {
      // Remove existing scripts
      const existingScript = document.getElementById("tiktok-embed-script");
      if (existingScript) {
        existingScript.remove();
      }

      // Add TikTok embed script
      const script = document.createElement("script");
      script.id = "tiktok-embed-script";
      script.src = "https://www.tiktok.com/embed.js";
      script.async = true;
      document.body.appendChild(script);

      return () => {
        script.remove();
      };
    }
  }, [embedHtml, isPlaying]);

  const openInTikTok = () => {
    window.open(videoUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={cn(
        "relative w-full aspect-[9/16] bg-slate-900 rounded-xl overflow-hidden group",
        className
      )}
      ref={containerRef}
    >
      {!isPlaying ? (
        // Thumbnail / Preview State
        <>
          {/* Thumbnail */}
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt="Video thumbnail"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
              <div className="text-slate-500 text-sm">No thumbnail</div>
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Play button */}
          <button
            onClick={loadEmbed}
            disabled={isLoading}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <div className={cn(
              "w-16 h-16 rounded-full bg-white/90 flex items-center justify-center transition-transform duration-200",
              "group-hover:scale-110 shadow-lg",
              isLoading && "animate-pulse"
            )}>
              {isLoading ? (
                <Loader2 className="w-8 h-8 text-slate-700 animate-spin" />
              ) : (
                <Play className="w-8 h-8 text-slate-800 ml-1" fill="currentColor" />
              )}
            </div>
          </button>

          {/* TikTok watermark */}
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 rounded-lg text-white text-xs font-medium flex items-center gap-1">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
            </svg>
            TikTok
          </div>

          {/* Error state */}
          {error && (
            <button
              onClick={openInTikTok}
              className="absolute inset-x-0 bottom-0 p-3 bg-red-500/90 text-white text-sm text-center"
            >
              {error}
              <ExternalLink className="w-4 h-4 inline ml-2" />
            </button>
          )}
        </>
      ) : (
        // Embedded Player State
        <div className="relative w-full h-full">
          {embedHtml && (
            <div
              className="w-full h-full [&_blockquote]:!m-0 [&_blockquote]:!max-w-full [&_iframe]:!w-full [&_iframe]:!h-full"
              dangerouslySetInnerHTML={{ __html: embedHtml }}
            />
          )}

          {/* Close button */}
          <button
            onClick={() => setIsPlaying(false)}
            className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors z-20"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Open in TikTok */}
          <button
            onClick={openInTikTok}
            className="absolute bottom-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors z-20"
            title="Buka di TikTok"
          >
            <ExternalLink className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
