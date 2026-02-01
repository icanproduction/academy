"use client";

import { useState } from "react";
import {
  GripVertical,
  ChevronDown,
  ChevronRight,
  Trash2,
  Plus,
  Clock,
  Mic,
  Clapperboard,
  Target,
  MessageSquare,
  Film,
  Sparkles,
} from "lucide-react";
import {
  BriefSection as BriefSectionType,
  BriefField,
  FieldType,
  FIELD_CONFIG,
  createField,
} from "@/types/brief";
import { BriefSectionField } from "./brief-section-field";
import { cn } from "@/lib/utils";

// Color-coded section icons based on section type
const getSectionIcon = (title: string) => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('hook') || lowerTitle.includes('opening')) {
    return { icon: Mic, color: 'bg-blue-100 text-blue-600' };
  }
  if (lowerTitle.includes('body') || lowerTitle.includes('content') || lowerTitle.includes('main')) {
    return { icon: Clapperboard, color: 'bg-purple-100 text-purple-600' };
  }
  if (lowerTitle.includes('cta') || lowerTitle.includes('call to action') || lowerTitle.includes('closing')) {
    return { icon: Target, color: 'bg-green-100 text-green-600' };
  }
  if (lowerTitle.includes('script') || lowerTitle.includes('narasi')) {
    return { icon: MessageSquare, color: 'bg-orange-100 text-orange-600' };
  }
  if (lowerTitle.includes('scene') || lowerTitle.includes('visual')) {
    return { icon: Film, color: 'bg-pink-100 text-pink-600' };
  }
  // Default
  return { icon: Sparkles, color: 'bg-slate-100 text-slate-600' };
};

interface BriefSectionProps {
  section: BriefSectionType;
  isEditable: boolean;
  onUpdate: (section: BriefSectionType) => void;
  onDelete: () => void;
  isHighlighted?: boolean;
  dragHandleProps?: any;
}

export function BriefSection({
  section,
  isEditable,
  onUpdate,
  onDelete,
  isHighlighted,
  dragHandleProps,
}: BriefSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const updateField = (fieldId: string, value: string) => {
    onUpdate({
      ...section,
      fields: section.fields.map((f) =>
        f.id === fieldId ? { ...f, value } : f
      ),
    });
  };

  const deleteField = (fieldId: string) => {
    onUpdate({
      ...section,
      fields: section.fields.filter((f) => f.id !== fieldId),
    });
  };

  const addField = (type: FieldType) => {
    const newField = createField(type);
    onUpdate({
      ...section,
      fields: [...section.fields, newField],
    });
    setShowAddField(false);
  };

  const updateTitle = (title: string) => {
    onUpdate({ ...section, title });
    setIsEditingTitle(false);
  };

  const updateDuration = (duration: number) => {
    onUpdate({ ...section, duration: Math.max(1, duration) });
    setIsEditingDuration(false);
  };

  // Get field types not yet added
  const availableFieldTypes = Object.keys(FIELD_CONFIG).filter(
    (type) => !section.fields.some((f) => f.type === type)
  ) as FieldType[];

  const { icon: SectionIcon, color: iconColor } = getSectionIcon(section.title);

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 overflow-hidden transition-colors duration-150 group",
        isHighlighted && "ring-2 ring-blue-400"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        if (!showAddField) setShowAddField(false);
      }}
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
        {isEditable && (
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
          >
            <GripVertical className="w-5 h-5" />
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-500 hover:text-slate-700 transition-colors duration-150"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronDown className={cn("w-5 h-5 transition-transform duration-150")} />
          )}
        </button>

        {/* Color-coded section icon */}
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", iconColor)}>
          <SectionIcon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          {isEditable && isEditingTitle ? (
            <input
              type="text"
              value={section.title}
              onChange={(e) => onUpdate({ ...section, title: e.target.value })}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsEditingTitle(false);
                if (e.key === "Escape") setIsEditingTitle(false);
              }}
              className="font-semibold text-slate-800 bg-white border border-slate-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <h3
              onClick={() => isEditable && setIsEditingTitle(true)}
              className={cn(
                "font-semibold text-slate-800",
                isEditable && "cursor-pointer hover:text-blue-600"
              )}
            >
              {section.title}
            </h3>
          )}
        </div>

        {/* Duration Badge */}
        <div className="flex items-center gap-1.5 text-sm">
          <Clock className="w-4 h-4 text-slate-400" />
          {isEditable && isEditingDuration ? (
            <input
              type="number"
              value={section.duration}
              onChange={(e) =>
                onUpdate({ ...section, duration: parseInt(e.target.value) || 1 })
              }
              onBlur={() => setIsEditingDuration(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsEditingDuration(false);
                if (e.key === "Escape") setIsEditingDuration(false);
              }}
              className="w-12 text-center bg-white border border-slate-300 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={1}
              autoFocus
            />
          ) : (
            <span
              onClick={() => isEditable && setIsEditingDuration(true)}
              className={cn(
                "text-slate-600 font-medium bg-white px-2 py-0.5 rounded-full border border-slate-200",
                isEditable && "cursor-pointer hover:bg-slate-100"
              )}
            >
              {section.duration}s
            </span>
          )}
        </div>

        {isEditable && (
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete section"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Section Content */}
      {!isCollapsed && (
        <div className="p-4 space-y-2">
          {section.fields.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              No fields yet. Add fields to this section.
            </div>
          ) : (
            section.fields.map((field) => (
              <BriefSectionField
                key={field.id}
                field={field}
                isEditable={isEditable}
                onUpdate={(value) => updateField(field.id, value)}
                onDelete={() => deleteField(field.id)}
              />
            ))
          )}

          {/* Add Field Button - visible on hover or when dropdown is open */}
          {isEditable && (
            <div
              className={cn(
                "relative pt-2 transition-all duration-200",
                !isHovered && !showAddField && "opacity-0 h-0 overflow-hidden pt-0",
                (isHovered || showAddField) && "opacity-100"
              )}
            >
              <button
                onClick={() => setShowAddField(!showAddField)}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-dashed border-slate-300 hover:border-blue-400 w-full justify-center"
              >
                <Plus className="w-4 h-4" />
                Add Field
              </button>

              {showAddField && availableFieldTypes.length > 0 && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 min-w-[200px]">
                  {availableFieldTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => addField(type)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors"
                    >
                      <span>{FIELD_CONFIG[type].icon}</span>
                      <span>{FIELD_CONFIG[type].label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
