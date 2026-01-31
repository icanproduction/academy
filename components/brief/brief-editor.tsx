"use client";

import { useState, useEffect } from "react";
import { Plus, Clock, Save, Loader2 } from "lucide-react";
import {
  BriefSection as BriefSectionType,
  SECTION_TEMPLATES,
  createSectionFromTemplate,
} from "@/types/brief";
import { BriefSection } from "./brief-section";
import { cn } from "@/lib/utils";

interface BriefEditorProps {
  sections: BriefSectionType[];
  isEditable: boolean;
  onSectionsChange: (sections: BriefSectionType[]) => void;
  onSave?: () => void;
  isSaving?: boolean;
  highlightedSectionId?: string | null;
}

export function BriefEditor({
  sections,
  isEditable,
  onSectionsChange,
  onSave,
  isSaving,
  highlightedSectionId,
}: BriefEditorProps) {
  const [showAddSection, setShowAddSection] = useState(false);
  const [localSections, setLocalSections] = useState(sections);

  useEffect(() => {
    setLocalSections(sections);
  }, [sections]);

  const updateSection = (sectionId: string, updatedSection: BriefSectionType) => {
    const newSections = localSections.map((s) =>
      s.id === sectionId ? updatedSection : s
    );
    setLocalSections(newSections);
    onSectionsChange(newSections);
  };

  const deleteSection = (sectionId: string) => {
    if (!confirm("Delete this section?")) return;
    const newSections = localSections
      .filter((s) => s.id !== sectionId)
      .map((s, i) => ({ ...s, order: i + 1 }));
    setLocalSections(newSections);
    onSectionsChange(newSections);
  };

  const addSection = (templateKey: string) => {
    const newSection = createSectionFromTemplate(
      templateKey,
      localSections.length + 1
    );
    const newSections = [...localSections, newSection];
    setLocalSections(newSections);
    onSectionsChange(newSections);
    setShowAddSection(false);
  };

  const totalDuration = localSections.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white sticky top-0 z-10">
        <h2 className="font-semibold text-slate-800">Brief</h2>
        <div className="relative">
          {isEditable && (
            <button
              onClick={() => setShowAddSection(!showAddSection)}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Section
            </button>
          )}

          {showAddSection && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 min-w-[200px]">
              {Object.entries(SECTION_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => addSection(key)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors"
                >
                  <span>{template.icon}</span>
                  <span>{template.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {localSections.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No sections yet</p>
            </div>
            {isEditable && (
              <button
                onClick={() => setShowAddSection(true)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Add your first section
              </button>
            )}
          </div>
        ) : (
          localSections
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <BriefSection
                key={section.id}
                section={section}
                isEditable={isEditable}
                onUpdate={(updated) => updateSection(section.id, updated)}
                onDelete={() => deleteSection(section.id)}
                isHighlighted={highlightedSectionId === section.id}
              />
            ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Clock className="w-4 h-4" />
          <span>Total Duration:</span>
          <span className="font-semibold">{totalDuration} seconds</span>
        </div>

        {isEditable && onSave && (
          <button
            onClick={onSave}
            disabled={isSaving}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              isSaving
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Brief
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
