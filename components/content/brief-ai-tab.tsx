"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FileText, MessageSquare } from "lucide-react";
import { BriefEditor } from "@/components/brief/brief-editor";
import { AIChatPanel } from "@/components/ai/ai-chat-panel";
import { BriefSection, ChatMessage, AISuggestion } from "@/types/brief";

interface BriefAITabProps {
  contentId: string;
  briefSections: BriefSection[];
  chatMessages: ChatMessage[];
  isEditable: boolean;
  isSaving: boolean;
  highlightedSectionId: string | null;
  revisionFeedback?: string | null;
  onSectionsChange: (sections: BriefSection[]) => void;
  onMessagesChange: (messages: ChatMessage[]) => void;
  onSave: () => Promise<void>;
  onApplySuggestion: (suggestion: AISuggestion) => void;
}

export function BriefAITab({
  contentId,
  briefSections,
  chatMessages,
  isEditable,
  isSaving,
  highlightedSectionId,
  revisionFeedback,
  onSectionsChange,
  onMessagesChange,
  onSave,
  onApplySuggestion,
}: BriefAITabProps) {
  // Mobile sub-tab state
  const [mobileSubTab, setMobileSubTab] = useState<"brief" | "ai">("brief");

  return (
    <div className="flex flex-col h-full">
      {/* Mobile sub-tabs */}
      <div className="flex md:hidden border-b border-slate-200 bg-white">
        <button
          onClick={() => setMobileSubTab("brief")}
          className={cn(
            "flex-1 py-3 text-sm font-medium text-center transition-colors flex items-center justify-center gap-1.5",
            mobileSubTab === "brief"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500"
          )}
        >
          <FileText className="w-4 h-4" />
          Brief Editor
        </button>
        <button
          onClick={() => setMobileSubTab("ai")}
          className={cn(
            "flex-1 py-3 text-sm font-medium text-center transition-colors flex items-center justify-center gap-1.5",
            mobileSubTab === "ai"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-500"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          AI Assistant
        </button>
      </div>

      {/* Main content - Split view on desktop */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Brief Editor Panel */}
        <div
          className={cn(
            "flex-1 md:w-[55%] md:max-w-[55%] border-r border-slate-200 bg-white overflow-hidden",
            mobileSubTab !== "brief" && "hidden md:block"
          )}
        >
          <BriefEditor
            sections={briefSections}
            isEditable={isEditable}
            onSectionsChange={onSectionsChange}
            onSave={onSave}
            isSaving={isSaving}
            highlightedSectionId={highlightedSectionId}
          />
        </div>

        {/* AI Chat Panel */}
        <div
          className={cn(
            "flex-1 md:w-[45%] md:max-w-[45%] overflow-hidden",
            mobileSubTab !== "ai" && "hidden md:block"
          )}
        >
          <AIChatPanel
            contentId={contentId}
            messages={chatMessages}
            onMessagesChange={onMessagesChange}
            isEditable={isEditable}
            onApplySuggestion={onApplySuggestion}
            revisionFeedback={revisionFeedback}
            briefSections={briefSections}
          />
        </div>
      </div>
    </div>
  );
}
