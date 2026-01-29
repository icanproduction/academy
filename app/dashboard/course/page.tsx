"use client";

import { useState } from "react";
import Link from "next/link";
import { cn, formatDuration } from "@/lib/utils";

// Demo data — will be replaced with Notion API
const MODULES = [
  {
    id: "m1",
    title: "Content Strategy",
    description: "Bangun fondasi sistem konten kamu — pilar, platform, dan audiens.",
    order: 1,
    durationHours: 1.5,
    thumbnailUrl: "",
    lessons: [
      { id: "l1", title: "Pengenalan Content Strategy", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 8, order: 1, status: "completed" },
      { id: "l2", title: "Menentukan Content Pillars", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 12, order: 2, status: "completed" },
      { id: "l3", title: "Strategi Platform", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 15, order: 3, status: "in_progress" },
      { id: "l4", title: "Membangun Content Calendar", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 10, order: 4, status: "not_started" },
    ],
  },
  {
    id: "m2",
    title: "Visual System",
    description: "Buat identitas visual yang konsisten dan mudah direplikasi tim kamu.",
    order: 2,
    durationHours: 1.5,
    thumbnailUrl: "",
    lessons: [
      { id: "l5", title: "Dasar Visual Identity Brand", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 10, order: 1, status: "not_started" },
      { id: "l6", title: "Membangun Color Palette", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 12, order: 2, status: "not_started" },
      { id: "l7", title: "Aturan Tipografi & Layout", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 14, order: 3, status: "not_started" },
      { id: "l8", title: "Panduan Gaya Foto & Video", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 11, order: 4, status: "not_started" },
    ],
  },
  {
    id: "m3",
    title: "Voice & Messaging",
    description: "Tentukan cara brand kamu berbicara — tone, kosakata, dan formula caption.",
    order: 3,
    durationHours: 1.5,
    thumbnailUrl: "",
    lessons: [
      { id: "l9", title: "Menemukan Brand Voice", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 10, order: 1, status: "not_started" },
      { id: "l10", title: "Tone Matrix & Guidelines", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 12, order: 2, status: "not_started" },
      { id: "l11", title: "Formula Menulis Caption", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 15, order: 3, status: "not_started" },
      { id: "l12", title: "Strategi Hashtag & CTA", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 8, order: 4, status: "not_started" },
    ],
  },
  {
    id: "m4",
    title: "Workflow Mastery",
    description: "Setup workflow produksi, tools, dan proses approval.",
    order: 4,
    durationHours: 1.5,
    thumbnailUrl: "",
    lessons: [
      { id: "l13", title: "Setup Production Pipeline", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 14, order: 1, status: "not_started" },
      { id: "l14", title: "Konfigurasi Tool Stack", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 10, order: 2, status: "not_started" },
      { id: "l15", title: "Proses Approval & QC", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 12, order: 3, status: "not_started" },
      { id: "l16", title: "Metode Batch Production", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 10, order: 4, status: "not_started" },
    ],
  },
  {
    id: "m5",
    title: "Performance & Optimization",
    description: "Ukur, analisis, dan tingkatkan output konten secara berkelanjutan.",
    order: 5,
    durationHours: 1,
    thumbnailUrl: "",
    lessons: [
      { id: "l17", title: "KPI yang Benar-Benar Penting", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 12, order: 1, status: "not_started" },
      { id: "l18", title: "Review Mingguan & Bulanan", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 10, order: 2, status: "not_started" },
      { id: "l19", title: "Playbook Optimisasi", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 8, order: 3, status: "not_started" },
    ],
  },
];

export default function CoursePage() {
  const [expandedModule, setExpandedModule] = useState<string | null>("m1");

  const totalLessons = MODULES.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedLessons = MODULES.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.status === "completed").length,
    0
  );

  // Find next lesson to continue
  const nextLesson = MODULES.flatMap((m) => m.lessons).find(
    (l) => l.status === "in_progress" || l.status === "not_started"
  );

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-slate-50 to-white p-8 pb-12">
        <div className="max-w-4xl">
          <p className="text-accent text-sm font-medium tracking-wider uppercase mb-3">
            iCAN Content System
          </p>
          <h1 className="text-4xl font-heading font-bold mb-4">
            Bikin tim in-house kamu
            <br />
            lebih jago dari agency
          </h1>
          <p className="text-fg-secondary text-lg mb-6 max-w-2xl">
            Sistem 90 hari untuk membangun, menjalankan, dan mengoptimalkan tim konten kamu.
            5 modul. 19 materi. Semua yang kamu butuhkan.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-accent font-bold text-lg">{completedLessons}</span>
              <span className="text-fg-muted text-sm">/ {totalLessons} materi</span>
            </div>
            <div className="h-2 w-48 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${(completedLessons / totalLessons) * 100}%` }}
              />
            </div>
            {nextLesson && (
              <Link
                href={`/dashboard/course/${nextLesson.id}`}
                className="ml-auto bg-accent hover:bg-accent-hover text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
              >
                {completedLessons > 0 ? "Lanjutkan" : "Mulai Belajar"}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="p-8 max-w-4xl">
        <div className="space-y-3">
          {MODULES.map((module) => {
            const moduleLessonsCompleted = module.lessons.filter(
              (l) => l.status === "completed"
            ).length;
            const isExpanded = expandedModule === module.id;
            const isModuleComplete = moduleLessonsCompleted === module.lessons.length;

            return (
              <div key={module.id} className="border border-border rounded-xl overflow-hidden bg-white">
                {/* Module Header */}
                <button
                  onClick={() => setExpandedModule(isExpanded ? null : module.id)}
                  className="w-full flex items-center gap-5 p-5 hover:bg-slate-50 transition-colors text-left"
                >
                  {/* Module Number */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0",
                      isModuleComplete
                        ? "bg-green-100 text-green-600"
                        : "bg-accent/10 text-accent"
                    )}
                  >
                    {isModuleComplete ? "✓" : module.order}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{module.title}</h3>
                    <p className="text-fg-muted text-sm mt-0.5">{module.description}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm text-fg-muted">
                      {moduleLessonsCompleted}/{module.lessons.length} materi
                    </p>
                    <p className="text-xs text-fg-muted">{module.durationHours} jam</p>
                  </div>

                  <span className={cn("text-fg-muted transition-transform", isExpanded && "rotate-180")}>
                    ▾
                  </span>
                </button>

                {/* Lessons */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {module.lessons.map((lesson, idx) => (
                      <Link
                        key={lesson.id}
                        href={`/dashboard/course/${lesson.id}`}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors border-b border-border last:border-0"
                      >
                        {/* Status */}
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                            lesson.status === "completed"
                              ? "bg-green-600 text-white"
                              : lesson.status === "in_progress"
                              ? "bg-accent text-white"
                              : "bg-slate-100 text-fg-muted"
                          )}
                        >
                          {lesson.status === "completed" ? "✓" : idx + 1}
                        </div>

                        <div className="flex-1">
                          <p className={cn(
                            "text-sm font-medium",
                            lesson.status === "completed" && "text-fg-secondary"
                          )}>
                            {lesson.title}
                          </p>
                        </div>

                        <span className="text-xs text-fg-muted">
                          {formatDuration(lesson.durationMinutes)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
