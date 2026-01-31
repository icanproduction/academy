"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BriefSection } from "@/types/brief";

interface UseAutoSaveOptions {
  interval?: number; // in milliseconds, default 2 minutes
  onSave: () => Promise<void>;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  lastSaved: Date | null;
  isSaving: boolean;
  saveNow: () => Promise<void>;
  hasUnsavedChanges: boolean;
}

export function useAutoSave(
  data: BriefSection[],
  options: UseAutoSaveOptions
): UseAutoSaveReturn {
  const { interval = 120000, onSave, enabled = true } = options; // Default 2 minutes

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Keep track of the last saved data to detect changes
  const lastSavedDataRef = useRef<string>("");
  const dataRef = useRef(data);

  // Update ref when data changes
  useEffect(() => {
    dataRef.current = data;
    const currentDataString = JSON.stringify(data);
    if (lastSavedDataRef.current && lastSavedDataRef.current !== currentDataString) {
      setHasUnsavedChanges(true);
    }
  }, [data]);

  // Save function
  const saveNow = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await onSave();
      setLastSaved(new Date());
      lastSavedDataRef.current = JSON.stringify(dataRef.current);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave, isSaving]);

  // Auto-save interval
  useEffect(() => {
    if (!enabled) return;

    // Initial save reference
    if (!lastSavedDataRef.current && data.length > 0) {
      lastSavedDataRef.current = JSON.stringify(data);
    }

    const timer = setInterval(async () => {
      const currentDataString = JSON.stringify(dataRef.current);

      // Only save if data has changed since last save
      if (lastSavedDataRef.current !== currentDataString && dataRef.current.length > 0) {
        await saveNow();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [interval, enabled, saveNow, data]);

  // Save on page unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    lastSaved,
    isSaving,
    saveNow,
    hasUnsavedChanges,
  };
}
