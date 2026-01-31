"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

export type ContentStatus =
  | "idea_draft"
  | "idea_submitted"
  | "idea_revision"
  | "production_ready"
  | "production_in_progress"
  | "production_submitted"
  | "production_revision"
  | "ready_to_post"
  | "posted";

interface StatusOption {
  value: ContentStatus;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: "idea_draft",
    label: "Draft",
    color: "gray",
    bgColor: "bg-gray-100",
    textColor: "text-gray-700",
  },
  {
    value: "idea_submitted",
    label: "Menunggu Review",
    color: "blue",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
  },
  {
    value: "idea_revision",
    label: "Revisi Ide",
    color: "orange",
    bgColor: "bg-orange-100",
    textColor: "text-orange-700",
  },
  {
    value: "production_ready",
    label: "Siap Produksi",
    color: "indigo",
    bgColor: "bg-indigo-100",
    textColor: "text-indigo-700",
  },
  {
    value: "production_in_progress",
    label: "Dalam Produksi",
    color: "purple",
    bgColor: "bg-purple-100",
    textColor: "text-purple-700",
  },
  {
    value: "production_submitted",
    label: "Review Hasil",
    color: "blue",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
  },
  {
    value: "production_revision",
    label: "Revisi Output",
    color: "orange",
    bgColor: "bg-orange-100",
    textColor: "text-orange-700",
  },
  {
    value: "ready_to_post",
    label: "Siap Posting",
    color: "green",
    bgColor: "bg-green-100",
    textColor: "text-green-700",
  },
  {
    value: "posted",
    label: "Published",
    color: "emerald",
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-700",
  },
];

interface StatusSelectorProps {
  value: ContentStatus;
  onChange: (status: ContentStatus) => void;
  disabled?: boolean;
}

export function StatusSelector({ value, onChange, disabled }: StatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === value) || STATUS_OPTIONS[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors w-full",
          disabled && "opacity-60 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "px-2.5 py-1 rounded-md text-sm font-medium",
            currentStatus.bgColor,
            currentStatus.textColor
          )}
        >
          {currentStatus.label}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 ml-auto transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-slate-200 z-50 py-1 animate-fade-in">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status.value}
              onClick={() => {
                onChange(status.value);
                setIsOpen(false);
              }}
              className={cn(
                "w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between transition-colors",
                value === status.value && "bg-slate-50"
              )}
            >
              <span
                className={cn(
                  "px-2.5 py-1 rounded-md text-sm font-medium",
                  status.bgColor,
                  status.textColor
                )}
              >
                {status.label}
              </span>
              {value === status.value && (
                <Check className="w-4 h-4 text-blue-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Compact version for header/badges
export function StatusBadge({ status }: { status: ContentStatus }) {
  const statusOption = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
        statusOption.bgColor,
        statusOption.textColor
      )}
    >
      {statusOption.label}
    </span>
  );
}
