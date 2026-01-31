"use client";

import { useState } from "react";
import {
  GripVertical,
  ChevronDown,
  ChevronRight,
  Trash2,
  Plus,
  Clock,
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

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 group",
        isHighlighted && "ring-2 ring-blue-400 shadow-blue-100"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        // Only close add field dropdown if not actively using it
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
          className="text-slate-500 hover:text-slate-700"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

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
