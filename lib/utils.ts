import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getPhaseNumber(phase: string) {
  const phases: Record<string, number> = {
    Systematize: 1,
    Execute: 2,
    Optimize: 3,
  };
  return phases[phase] || 0;
}

export function getContentTypeIcon(contentType: string): string {
  const icons: Record<string, string> = {
    feed: "📷",
    carousel: "🎠",
    reels: "🎬",
    tiktok: "🎵",
    story: "📱",
    video: "🎥",
    article: "📝",
    podcast: "🎙️",
  };
  return icons[contentType?.toLowerCase()] || "📄";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    idea: "bg-slate-500",
    draft: "bg-amber-500",
    ready: "bg-blue-500",
    submitted: "bg-indigo-500",
    approved: "bg-emerald-500",
    posted: "bg-green-600",
    rejected: "bg-red-500",
    in_progress: "bg-blue-500",
    review: "bg-purple-500",
    done: "bg-emerald-500",
  };
  return colors[status?.toLowerCase()] || "bg-slate-400";
}
