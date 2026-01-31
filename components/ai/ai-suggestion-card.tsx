"use client";

import { Check, ArrowRight } from "lucide-react";
import { AISuggestion, FIELD_CONFIG } from "@/types/brief";
import { cn } from "@/lib/utils";

interface AISuggestionCardProps {
  suggestion: AISuggestion;
  index: number;
  onApply: () => void;
  isEditable: boolean;
}

export function AISuggestionCard({
  suggestion,
  index,
  onApply,
  isEditable,
}: AISuggestionCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <h4 className="font-medium text-slate-700">
          {suggestion.label || `Option ${index + 1}`}
        </h4>
        {suggestion.preview && (
          <p className="text-sm text-slate-500 mt-0.5">{suggestion.preview}</p>
        )}
      </div>

      <div className="p-4 space-y-3">
        {suggestion.sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {section.title}
              </span>
              {section.duration && (
                <span className="text-xs text-slate-400">
                  ({section.duration}s)
                </span>
              )}
            </div>

            {section.fields?.map((field, fIdx) => {
              const config = FIELD_CONFIG[field.type];
              return (
                <div
                  key={fIdx}
                  className="flex items-start gap-2 text-sm bg-slate-50 rounded-lg px-3 py-2"
                >
                  <span className="shrink-0">{config?.icon || "📝"}</span>
                  <div>
                    <span className="text-slate-500 text-xs">
                      {config?.label || field.type}:
                    </span>
                    <p className="text-slate-700">{field.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
        <button
          onClick={onApply}
          disabled={!isEditable}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium w-full justify-center transition-colors",
            isEditable
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          )}
        >
          <Check className="w-4 h-4" />
          Apply to Brief
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
