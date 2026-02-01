"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Film,
  Images,
  Smartphone,
  Calendar,
  Link as LinkIcon,
  Package,
  Save,
  Loader2,
  ExternalLink,
  Instagram,
} from "lucide-react";
import { StatusSelector, ContentStatus } from "./status-selector";

type ContentType = "reels" | "carousel" | "story";

interface ContentData {
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

interface ContentDetailTabProps {
  content: ContentData;
  isEditable: boolean;
  onUpdate: (updates: Partial<ContentData>) => Promise<void>;
}

const TYPE_OPTIONS = [
  { value: "reels", label: "Reels / Video", icon: Film, color: "from-pink-500 to-rose-500" },
  { value: "carousel", label: "Carousel", icon: Images, color: "from-blue-500 to-indigo-500" },
  { value: "story", label: "Story", icon: Smartphone, color: "from-purple-500 to-violet-500" },
];

const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "tiktok", label: "TikTok", icon: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  ) },
];

export function ContentDetailTab({ content, isEditable, onUpdate }: ContentDetailTabProps) {
  const [localContent, setLocalContent] = useState(content);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleFieldChange = (field: string, value: any) => {
    setLocalContent({ ...localContent, [field]: value });
  };

  const handleSaveField = async (field: string) => {
    setSaving(true);
    try {
      await onUpdate({ [field]: localContent[field as keyof typeof localContent] });
      setEditingField(null);
    } catch (error) {
      console.error("Error saving field:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: ContentStatus) => {
    setSaving(true);
    try {
      await onUpdate({ status: newStatus });
      setLocalContent({ ...localContent, status: newStatus });
    } finally {
      setSaving(false);
    }
  };

  const handlePlatformToggle = (platform: string) => {
    const currentPlatforms = localContent.platforms || [];
    const newPlatforms = currentPlatforms.includes(platform)
      ? currentPlatforms.filter(p => p !== platform)
      : [...currentPlatforms, platform];
    handleFieldChange("platforms", newPlatforms);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5 md:space-y-6">
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        {/* Left Column */}
        <div className="space-y-4 md:space-y-5">
          {/* Content Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tipe Konten
            </label>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((type) => {
                const Icon = type.icon;
                const isSelected = localContent.contentType === type.value;
                return (
                  <button
                    key={type.value}
                    onClick={() => isEditable && handleFieldChange("contentType", type.value)}
                    disabled={!isEditable}
                    className={cn(
                      "flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-lg border-2 transition-all text-xs md:text-sm",
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 hover:border-slate-300",
                      !isEditable && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Platform */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Platform
            </label>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map((platform) => {
                const Icon = platform.icon;
                const isSelected = localContent.platforms?.includes(platform.value);
                return (
                  <button
                    key={platform.value}
                    onClick={() => isEditable && handlePlatformToggle(platform.value)}
                    disabled={!isEditable}
                    className={cn(
                      "flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-lg border-2 transition-all text-xs md:text-sm",
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 hover:border-slate-300",
                      !isEditable && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{platform.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Pillar */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Content Pillar
            </label>
            <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-lg mr-2">{localContent.pillarEmoji || "📌"}</span>
              <span className="font-medium">{localContent.pillarName || "No pillar selected"}</span>
            </div>
          </div>

          {/* Highlight Product */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Package className="w-4 h-4 inline mr-1" />
              Highlight Produk/Service
            </label>
            <input
              type="text"
              value={localContent.description || ""}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              disabled={!isEditable}
              placeholder="Produk atau service yang di-highlight"
              className={cn(
                "w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                !isEditable && "bg-slate-50 cursor-not-allowed"
              )}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4 md:space-y-5">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Status
            </label>
            <StatusSelector
              value={localContent.status}
              onChange={handleStatusChange}
              disabled={!isEditable || saving}
            />
          </div>

          {/* Jadwal Posting */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Jadwal Posting
            </label>
            <input
              type="datetime-local"
              value={localContent.publishDate ? new Date(localContent.publishDate).toISOString().slice(0, 16) : ""}
              onChange={(e) => handleFieldChange("publishDate", e.target.value)}
              disabled={!isEditable}
              className={cn(
                "w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                !isEditable && "bg-slate-50 cursor-not-allowed"
              )}
            />
          </div>

          {/* Link Output */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <ExternalLink className="w-4 h-4 inline mr-1" />
              Link Output
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={localContent.outputUrl || ""}
                onChange={(e) => handleFieldChange("outputUrl", e.target.value)}
                disabled={!isEditable}
                placeholder="https://..."
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                  !isEditable && "bg-slate-50 cursor-not-allowed"
                )}
              />
              {localContent.outputUrl && (
                <a
                  href={localContent.outputUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-slate-600" />
                </a>
              )}
            </div>
          </div>

          {/* Link Referensi */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <LinkIcon className="w-4 h-4 inline mr-1" />
              Link Referensi
            </label>
            <input
              type="url"
              value={localContent.referenceLinks || ""}
              onChange={(e) => handleFieldChange("referenceLinks", e.target.value)}
              disabled={!isEditable}
              placeholder="https://instagram.com/reel/..."
              className={cn(
                "w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                !isEditable && "bg-slate-50 cursor-not-allowed"
              )}
            />
          </div>
        </div>
      </div>

      {/* Full Width Fields */}
      <div className="space-y-4 md:space-y-5">
        {/* Judul / Topic */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Judul / Topic
          </label>
          <input
            type="text"
            value={localContent.title || ""}
            onChange={(e) => handleFieldChange("title", e.target.value)}
            disabled={!isEditable}
            placeholder="Judul konten..."
            className={cn(
              "w-full px-4 py-3 rounded-lg border border-slate-200 text-base font-medium",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
              !isEditable && "bg-slate-50 cursor-not-allowed"
            )}
          />
        </div>

        {/* Deskripsi Konten */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Deskripsi Konten
          </label>
          <textarea
            value={localContent.description || ""}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            disabled={!isEditable}
            rows={3}
            placeholder="Deskripsi singkat tentang konten ini..."
            className={cn(
              "w-full px-4 py-3 rounded-lg border border-slate-200 text-sm resize-none",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
              !isEditable && "bg-slate-50 cursor-not-allowed"
            )}
          />
        </div>

        {/* Caption */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Caption
          </label>
          <textarea
            value={localContent.caption || ""}
            onChange={(e) => handleFieldChange("caption", e.target.value)}
            disabled={!isEditable}
            rows={5}
            placeholder="Caption untuk posting..."
            className={cn(
              "w-full px-4 py-3 rounded-lg border border-slate-200 text-sm resize-none",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
              !isEditable && "bg-slate-50 cursor-not-allowed"
            )}
          />
        </div>
      </div>

      {/* Save Button */}
      {isEditable && (
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            onClick={() => onUpdate(localContent)}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Simpan Perubahan
          </button>
        </div>
      )}
    </div>
  );
}
