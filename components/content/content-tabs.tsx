"use client";

import { cn } from "@/lib/utils";
import { FileText, Sparkles, MessageSquareText } from "lucide-react";

export type ContentTabType = "detail" | "brief" | "discussion";

interface TabConfig {
  id: ContentTabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabConfig[] = [
  { id: "detail", label: "Detail Konten", icon: FileText },
  { id: "brief", label: "Brief & AI Assistant", icon: Sparkles },
  { id: "discussion", label: "Diskusi & Review", icon: MessageSquareText },
];

interface ContentTabsProps {
  activeTab: ContentTabType;
  onTabChange: (tab: ContentTabType) => void;
}

export function ContentTabs({ activeTab, onTabChange }: ContentTabsProps) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Mobile version for smaller screens
export function ContentTabsMobile({ activeTab, onTabChange }: ContentTabsProps) {
  return (
    <div className="flex border-t border-slate-200 md:hidden">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
              isActive
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="truncate">{tab.label.split(" ")[0]}</span>
          </button>
        );
      })}
    </div>
  );
}
