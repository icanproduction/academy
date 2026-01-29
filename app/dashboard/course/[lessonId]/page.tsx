"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn, formatDuration } from "@/lib/utils";

// Demo data — same as course page, will be replaced with API
const ALL_LESSONS = [
  { id: "l1", moduleId: "m1", moduleTitle: "Content Strategy", title: "Pengenalan Content Strategy", description: "Pahami dasar-dasar content strategy untuk brand kamu. Kita akan bahas kenapa pendekatan terstruktur lebih penting dari posting asal-asalan, dan bagaimana melihat konten sebagai sistem bisnis — bukan sekadar social media posts.", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 8, order: 1, status: "completed" },
  { id: "l2", moduleId: "m1", moduleTitle: "Content Strategy", title: "Menentukan Content Pillars", description: "Pelajari cara mengidentifikasi 4-5 tema inti yang merepresentasikan brand kamu. Kita akan buat framework pilar dengan rasio supaya tim kamu selalu tau jenis konten apa yang harus dibuat selanjutnya.", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 12, order: 2, status: "completed" },
  { id: "l3", moduleId: "m1", moduleTitle: "Content Strategy", title: "Strategi Platform", description: "Tidak semua platform sama. Pelajari cara memilih platform yang tepat untuk brand kamu, konten apa yang works di mana, dan kenapa fokus mengalahkan spread.", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 15, order: 3, status: "in_progress" },
  { id: "l4", moduleId: "m1", moduleTitle: "Content Strategy", title: "Membangun Content Calendar", description: "Buat template content calendar bulanan yang bisa diikuti tim kamu. Kita akan setup cadence, timing, dan workflow untuk output yang konsisten.", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 10, order: 4, status: "not_started" },
  { id: "l5", moduleId: "m2", moduleTitle: "Visual System", title: "Dasar Visual Identity Brand", description: "Temukan elemen visual yang mendefinisikan brand kamu dan cara mendokumentasikannya untuk tim.", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 10, order: 1, status: "not_started" },
  { id: "l6", moduleId: "m2", moduleTitle: "Visual System", title: "Membangun Color Palette", description: "Pilih dan dokumentasikan warna brand dengan hex codes, aturan penggunaan, dan kombinasi yang tepat.", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 12, order: 2, status: "not_started" },
  { id: "l7", moduleId: "m2", moduleTitle: "Visual System", title: "Aturan Tipografi & Layout", description: "Tetapkan panduan tipografi dan pola layout yang menciptakan konsistensi di semua konten.", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 14, order: 3, status: "not_started" },
  { id: "l8", moduleId: "m2", moduleTitle: "Visual System", title: "Panduan Gaya Foto & Video", description: "Definisikan mood visual, pencahayaan, sudut, dan gaya editing untuk brand kamu.", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 11, order: 4, status: "not_started" },
  { id: "l9", moduleId: "m3", moduleTitle: "Voice & Messaging", title: "Menemukan Brand Voice", description: "Definisikan cara brand kamu berbicara menggunakan deskriptor kepribadian dan contoh nyata.", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 10, order: 1, status: "not_started" },
  { id: "l10", moduleId: "m3", moduleTitle: "Voice & Messaging", title: "Tone Matrix & Guidelines", description: "Buat panduan tone untuk berbagai situasi — formal, casual, fun, urgent.", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 12, order: 2, status: "not_started" },
  { id: "l11", moduleId: "m3", moduleTitle: "Voice & Messaging", title: "Formula Menulis Caption", description: "7 struktur caption yang terbukti berhasil dan bisa langsung dipakai tim kamu.", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 15, order: 3, status: "not_started" },
  { id: "l12", moduleId: "m3", moduleTitle: "Voice & Messaging", title: "Strategi Hashtag & CTA", description: "Bangun library hashtag dan variasi CTA kamu.", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 8, order: 4, status: "not_started" },
  { id: "l13", moduleId: "m4", moduleTitle: "Workflow Mastery", title: "Setup Production Pipeline", description: "Rancang alur produksi konten end-to-end dari ide sampai publish.", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 14, order: 1, status: "not_started" },
  { id: "l14", moduleId: "m4", moduleTitle: "Workflow Mastery", title: "Konfigurasi Tool Stack", description: "Setup tools terjangkau yang menggantikan software agency mahal.", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 10, order: 2, status: "not_started" },
  { id: "l15", moduleId: "m4", moduleTitle: "Workflow Mastery", title: "Proses Approval & QC", description: "Buat alur approval cepat yang tidak bottleneck di owner.", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 12, order: 3, status: "not_started" },
  { id: "l16", moduleId: "m4", moduleTitle: "Workflow Mastery", title: "Metode Batch Production", description: "Produksi konten seminggu dalam satu hari menggunakan metode batch.", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 10, order: 4, status: "not_started" },
  { id: "l17", moduleId: "m5", moduleTitle: "Performance & Optimization", title: "KPI yang Benar-Benar Penting", description: "Singkirkan vanity metrics dan fokus pada apa yang mendorong hasil bisnis.", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 12, order: 1, status: "not_started" },
  { id: "l18", moduleId: "m5", moduleTitle: "Performance & Optimization", title: "Review Mingguan & Bulanan", description: "Setup ritual review untuk terus meningkatkan konten kamu.", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 10, order: 2, status: "not_started" },
  { id: "l19", moduleId: "m5", moduleTitle: "Performance & Optimization", title: "Playbook Optimisasi", description: "Apa yang harus dilakukan ketika konten underperform, overperform, atau flatline.", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 8, order: 3, status: "not_started" },
];

export default function LessonPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;

  const lessonIndex = ALL_LESSONS.findIndex((l) => l.id === lessonId);
  const lesson = ALL_LESSONS[lessonIndex];
  const prevLesson = lessonIndex > 0 ? ALL_LESSONS[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < ALL_LESSONS.length - 1 ? ALL_LESSONS[lessonIndex + 1] : null;

  const [isCompleted, setIsCompleted] = useState(lesson?.status === "completed");

  // Group lessons by module for sidebar
  const moduleMap = ALL_LESSONS.reduce((acc, l) => {
    if (!acc[l.moduleId]) {
      acc[l.moduleId] = { title: l.moduleTitle, lessons: [] };
    }
    acc[l.moduleId].lessons.push(l);
    return acc;
  }, {} as Record<string, { title: string; lessons: typeof ALL_LESSONS }>);

  if (!lesson) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <p className="text-fg-muted">Materi tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Main Content */}
      <div className="flex-1 max-w-[calc(100%-320px)]">
        {/* Video Player */}
        <div className="bg-black">
          <div className="max-w-5xl mx-auto">
            <div className="video-container">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${lesson.youtubeVideoId}?rel=0&modestbranding=1`}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>

        {/* Lesson Info */}
        <div className="max-w-3xl mx-auto p-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-fg-muted mb-4">
            <Link href="/dashboard/course" className="hover:text-fg transition-colors">
              Materi
            </Link>
            <span>/</span>
            <span>{lesson.moduleTitle}</span>
            <span>/</span>
            <span className="text-fg-secondary">Lesson {lesson.order}</span>
          </div>

          <h1 className="text-3xl font-heading font-bold mb-3">{lesson.title}</h1>
          <p className="text-fg-secondary text-lg leading-relaxed mb-8">
            {lesson.description}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setIsCompleted(!isCompleted)}
              className={cn(
                "px-5 py-2.5 rounded-lg font-medium transition-colors",
                isCompleted
                  ? "bg-green-600 text-white"
                  : "bg-white border border-border hover:border-green-600 text-fg-secondary hover:text-green-600"
              )}
            >
              {isCompleted ? "✓ Selesai" : "Tandai Selesai"}
            </button>
            <span className="text-fg-muted text-sm">{formatDuration(lesson.durationMinutes)}</span>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between border-t border-border pt-6">
            {prevLesson ? (
              <Link
                href={`/dashboard/course/${prevLesson.id}`}
                className="flex items-center gap-2 text-fg-secondary hover:text-fg transition-colors"
              >
                <span>←</span>
                <div>
                  <p className="text-xs text-fg-muted">Sebelumnya</p>
                  <p className="text-sm">{prevLesson.title}</p>
                </div>
              </Link>
            ) : (
              <div />
            )}
            {nextLesson ? (
              <Link
                href={`/dashboard/course/${nextLesson.id}`}
                className="flex items-center gap-2 text-right text-fg-secondary hover:text-fg transition-colors"
              >
                <div>
                  <p className="text-xs text-fg-muted">Selanjutnya</p>
                  <p className="text-sm">{nextLesson.title}</p>
                </div>
                <span>→</span>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>

      {/* Sidebar - Lesson List */}
      <aside className="w-80 bg-slate-50 border-l border-border overflow-y-auto h-screen sticky top-0">
        <div className="p-4">
          <Link
            href="/dashboard/course"
            className="text-sm text-fg-muted hover:text-fg transition-colors mb-4 block"
          >
            ← Kembali ke Materi
          </Link>
        </div>

        {Object.entries(moduleMap).map(([moduleId, module]) => (
          <div key={moduleId} className="mb-2">
            <div className="px-4 py-2">
              <h4 className="text-xs font-medium text-fg-muted uppercase tracking-wider">
                {module.title}
              </h4>
            </div>
            {module.lessons.map((l) => (
              <Link
                key={l.id}
                href={`/dashboard/course/${l.id}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                  l.id === lessonId
                    ? "bg-accent/10 text-accent border-l-2 border-accent"
                    : "text-fg-secondary hover:bg-slate-100 hover:text-fg"
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0",
                    l.status === "completed"
                      ? "bg-green-600 text-white"
                      : l.id === lessonId
                      ? "bg-accent text-white"
                      : "bg-slate-200 text-fg-muted"
                  )}
                >
                  {l.status === "completed" ? "✓" : l.order}
                </div>
                <span className="truncate">{l.title}</span>
              </Link>
            ))}
          </div>
        ))}
      </aside>
    </div>
  );
}
