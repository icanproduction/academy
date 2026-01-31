"use client";

import { useState } from "react";
import { Check, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { AISuggestion, FIELD_CONFIG } from "@/types/brief";
import { cn } from "@/lib/utils";

interface AISuggestionCardProps {
  suggestion: AISuggestion;
  index: number;
  onApply: (selectedSuggestion: AISuggestion) => void;
  isEditable: boolean;
}

export function AISuggestionCard({
  suggestion,
  index,
  onApply,
  isEditable,
}: AISuggestionCardProps) {
  // Track selected sections (for partial apply)
  const [selectedSections, setSelectedSections] = useState<Set<number>>(
    new Set(suggestion.sections.map((_, idx) => idx))
  );
  const [expanded, setExpanded] = useState(true);

  const toggleSection = (sectionIdx: number) => {
    const newSelected = new Set(selectedSections);
    if (newSelected.has(sectionIdx)) {
      newSelected.delete(sectionIdx);
    } else {
      newSelected.add(sectionIdx);
    }
    setSelectedSections(newSelected);
  };

  const handleApply = () => {
    // Filter to only selected sections
    const filteredSuggestion: AISuggestion = {
      ...suggestion,
      sections: suggestion.sections.filter((_, idx) => selectedSections.has(idx)),
    };
    onApply(filteredSuggestion);
  };

  const allSelected = selectedSections.size === suggestion.sections.length;
  const noneSelected = selectedSections.size === 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div
        className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <h4 className="font-medium text-slate-700">
            {suggestion.label || `Option ${index + 1}`}
          </h4>
          {suggestion.preview && (
            <p className="text-sm text-slate-500 mt-0.5">{suggestion.preview}</p>
          )}
        </div>
        <button className="p-1 hover:bg-slate-200 rounded transition-colors">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>
      </div>

      {/* Sections - Expandable */}
      {expanded && (
        <div className="p-4 space-y-3">
          {/* Select All / Deselect All toggle */}
          {suggestion.sections.length > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
              <span>{selectedSections.size} dari {suggestion.sections.length} section dipilih</span>
              <button
                onClick={() => {
                  if (allSelected) {
                    setSelectedSections(new Set());
                  } else {
                    setSelectedSections(new Set(suggestion.sections.map((_, idx) => idx)));
                  }
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {allSelected ? "Deselect All" : "Select All"}
              </button>
            </div>
          )}

          {suggestion.sections.map((section, sIdx) => {
            const isSelected = selectedSections.has(sIdx);
            return (
              <div
                key={sIdx}
                className={cn(
                  "space-y-2 p-3 rounded-lg border-2 transition-all cursor-pointer",
                  isSelected
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-slate-200 bg-slate-50 opacity-60"
                )}
                onClick={() => toggleSection(sIdx)}
              >
                <div className="flex items-center gap-2">
                  {/* Checkbox */}
                  <div className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
                    isSelected
                      ? "border-blue-500 bg-blue-500"
                      : "border-slate-300 bg-white"
                  )}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>

                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex-1">
                    {section.title}
                  </span>
                  {section.duration && (
                    <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded">
                      {section.duration}s
                    </span>
                  )}
                </div>

                {section.fields?.map((field, fIdx) => {
                  const config = FIELD_CONFIG[field.type];
                  return (
                    <div
                      key={fIdx}
                      className="flex items-start gap-2 text-sm bg-white rounded-lg px-3 py-2"
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
            );
          })}
        </div>
      )}

      {/* Apply Button */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
        <button
          onClick={handleApply}
          disabled={!isEditable || noneSelected}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium w-full justify-center transition-colors",
            isEditable && !noneSelected
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          )}
        >
          <Check className="w-4 h-4" />
          {noneSelected ? "Pilih section dulu" : `Apply ${selectedSections.size} Section ke Brief`}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
