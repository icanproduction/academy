"use client";

import { Bot, User } from "lucide-react";
import { ChatMessage, AISuggestion } from "@/types/brief";
import { AISuggestionCard } from "./ai-suggestion-card";
import { cn } from "@/lib/utils";

interface AIMessageProps {
  message: ChatMessage;
  isEditable: boolean;
  onApplySuggestion: (suggestion: AISuggestion) => void;
}

export function AIMessage({
  message,
  isEditable,
  onApplySuggestion,
}: AIMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isUser
            ? "bg-blue-100 text-blue-600"
            : "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Content */}
      <div className={cn("flex-1 space-y-3", isUser && "text-right")}>
        <div
          className={cn(
            "inline-block rounded-2xl px-4 py-2.5 max-w-[90%]",
            isUser
              ? "bg-blue-600 text-white rounded-br-md"
              : "bg-white border border-slate-200 text-slate-700 rounded-bl-md"
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Suggestions */}
        {!isUser && message.suggestions && message.suggestions.length > 0 && (
          <div className="space-y-3">
            {message.suggestions.map((suggestion, idx) => (
              <AISuggestionCard
                key={idx}
                suggestion={suggestion}
                index={idx}
                isEditable={isEditable}
                onApply={(filteredSuggestion) => onApplySuggestion(filteredSuggestion)}
              />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p
          className={cn(
            "text-xs text-slate-400",
            isUser ? "text-right" : "text-left"
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
