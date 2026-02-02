"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  Maximize2,
  Image as ImageIcon,
  Film,
  ExternalLink,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface GoogleDriveEmbedProps {
  url: string;
  className?: string;
}

type MediaType = "video" | "image" | "unknown";

/**
 * Parse Google Drive URL and extract file ID
 * Supports formats:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - https://docs.google.com/...
 */
function parseGoogleDriveUrl(url: string): { fileId: string | null; type: MediaType } {
  if (!url) return { fileId: null, type: "unknown" };

  try {
    const urlObj = new URL(url);

    // Check if it's a Google Drive URL
    if (!urlObj.hostname.includes("google.com")) {
      return { fileId: null, type: "unknown" };
    }

    let fileId: string | null = null;

    // Format: /file/d/FILE_ID/view
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) {
      fileId = fileMatch[1];
    }

    // Format: ?id=FILE_ID
    if (!fileId) {
      fileId = urlObj.searchParams.get("id");
    }

    // Format: /d/FILE_ID (for folders or other)
    if (!fileId) {
      const dMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (dMatch) {
        fileId = dMatch[1];
      }
    }

    // Determine type based on URL hints (we can't know for sure without API)
    // Default to video for Google Drive files (most common use case for content)
    let type: MediaType = "video";

    // Check URL for image hints
    if (url.includes("image") || url.includes("photo") || url.includes("img")) {
      type = "image";
    }

    return { fileId, type };
  } catch {
    return { fileId: null, type: "unknown" };
  }
}

/**
 * Get embed URL for Google Drive file
 */
function getEmbedUrl(fileId: string, type: MediaType): string {
  if (type === "video") {
    // Video preview/embed URL
    return `https://drive.google.com/file/d/${fileId}/preview`;
  } else {
    // Image embed URL
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
}

/**
 * Get thumbnail URL for Google Drive file
 */
function getThumbnailUrl(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
}

export function GoogleDriveEmbed({ url, className }: GoogleDriveEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaType, setMediaType] = useState<MediaType>("video");

  const { fileId, type } = parseGoogleDriveUrl(url);

  useEffect(() => {
    setMediaType(type);
    setIsLoading(true);
    setHasError(false);
  }, [url, type]);

  if (!fileId) {
    return null;
  }

  const embedUrl = getEmbedUrl(fileId, mediaType);
  const thumbnailUrl = getThumbnailUrl(fileId);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className={cn("rounded-xl overflow-hidden bg-slate-900", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800">
        <div className="flex items-center gap-2">
          {mediaType === "video" ? (
            <Film className="w-4 h-4 text-blue-400" />
          ) : (
            <ImageIcon className="w-4 h-4 text-green-400" />
          )}
          <span className="text-sm text-slate-300 font-medium">
            {mediaType === "video" ? "Video Preview" : "Image Preview"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle media type */}
          <button
            onClick={() => setMediaType(mediaType === "video" ? "image" : "video")}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title={mediaType === "video" ? "View as Image" : "View as Video"}
          >
            {mediaType === "video" ? (
              <ImageIcon className="w-4 h-4" />
            ) : (
              <Film className="w-4 h-4" />
            )}
          </button>
          {/* Open in new tab */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Open in Google Drive"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="relative aspect-video bg-black">
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="text-sm text-slate-400">Loading preview...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="flex flex-col items-center gap-3 text-center px-4">
              <AlertCircle className="w-10 h-10 text-amber-500" />
              <div>
                <p className="text-slate-300 font-medium">Cannot load preview</p>
                <p className="text-sm text-slate-500 mt-1">
                  File might be private or restricted
                </p>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Google Drive
              </a>
            </div>
          </div>
        )}

        {/* Video embed */}
        {mediaType === "video" && (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        )}

        {/* Image embed */}
        {mediaType === "image" && (
          <img
            src={embedUrl}
            alt="Content preview"
            className="w-full h-full object-contain"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        )}
      </div>

      {/* Footer - Tips */}
      <div className="px-4 py-2 bg-slate-800 border-t border-slate-700">
        <p className="text-xs text-slate-500">
          💡 Tips: Pastikan file Google Drive sudah di-share dengan "Anyone with the link can view"
        </p>
      </div>
    </div>
  );
}

/**
 * Check if URL is a Google Drive URL
 */
export function isGoogleDriveUrl(url: string): boolean {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes("google.com") &&
           (url.includes("drive.google.com") || url.includes("docs.google.com"));
  } catch {
    return false;
  }
}
