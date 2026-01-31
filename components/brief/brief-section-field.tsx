"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { BriefField, FIELD_CONFIG } from "@/types/brief";
import { cn } from "@/lib/utils";

interface BriefSectionFieldProps {
  field: BriefField;
  isEditable: boolean;
  onUpdate: (value: string) => void;
  onDelete: () => void;
  isHighlighted?: boolean;
}

export function BriefSectionField({
  field,
  isEditable,
  onUpdate,
  onDelete,
  isHighlighted,
}: BriefSectionFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(field.value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const config = FIELD_CONFIG[field.type];

  useEffect(() => {
    setLocalValue(field.value);
  }, [field.value]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== field.value) {
      onUpdate(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setLocalValue(field.value);
      setIsEditing(false);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [localValue, isEditing]);

  return (
    <div
      className={cn(
        "group relative rounded-lg transition-all duration-300",
        isHighlighted && "ring-2 ring-blue-400 bg-blue-50/50"
      )}
    >
      <div className="flex items-start gap-3 p-2">
        <span className="text-lg mt-0.5 shrink-0">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-slate-500 mb-1">
            {config.label}
          </div>
          {isEditable ? (
            isEditing ? (
              <textarea
                ref={textareaRef}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder={config.placeholder}
                className="w-full text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[60px]"
                rows={2}
              />
            ) : (
              <div
                onClick={() => setIsEditing(true)}
                className={cn(
                  "text-sm rounded-lg px-3 py-2 min-h-[40px] cursor-text transition-colors",
                  localValue
                    ? "text-slate-700 bg-slate-50 hover:bg-slate-100"
                    : "text-slate-400 bg-slate-50 hover:bg-slate-100 italic"
                )}
              >
                {localValue || config.placeholder}
              </div>
            )
          ) : (
            <div
              className={cn(
                "text-sm rounded-lg px-3 py-2 min-h-[40px]",
                localValue ? "text-slate-700 bg-slate-50" : "text-slate-400 bg-slate-50 italic"
              )}
            >
              {localValue || "(Empty)"}
            </div>
          )}
        </div>
        {isEditable && (
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Delete field"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
