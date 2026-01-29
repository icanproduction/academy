"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  youtubeVideoId: string;
  durationMinutes: number;
  order: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  durationHours: number;
  lessons: Lesson[];
}

const DEMO_MODULES: Module[] = [
  {
    id: "m1",
    title: "Content Strategy",
    description: "Bangun fondasi sistem konten kamu",
    order: 1,
    durationHours: 1.5,
    lessons: [
      { id: "l1", title: "Pengenalan Content Strategy", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 8, order: 1 },
      { id: "l2", title: "Menentukan Content Pillars", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 12, order: 2 },
      { id: "l3", title: "Strategi Platform", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 15, order: 3 },
      { id: "l4", title: "Membangun Content Calendar", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 10, order: 4 },
    ],
  },
  {
    id: "m2",
    title: "Visual System",
    description: "Buat identitas visual yang konsisten",
    order: 2,
    durationHours: 1.5,
    lessons: [
      { id: "l5", title: "Dasar Visual Identity Brand", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 10, order: 1 },
      { id: "l6", title: "Membangun Color Palette", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 12, order: 2 },
      { id: "l7", title: "Aturan Tipografi & Layout", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 14, order: 3 },
      { id: "l8", title: "Panduan Gaya Foto & Video", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 11, order: 4 },
    ],
  },
  {
    id: "m3",
    title: "Voice & Messaging",
    description: "Tentukan cara brand kamu berbicara",
    order: 3,
    durationHours: 1.5,
    lessons: [
      { id: "l9", title: "Menemukan Brand Voice", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 10, order: 1 },
      { id: "l10", title: "Tone Matrix & Guidelines", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 12, order: 2 },
      { id: "l11", title: "Formula Menulis Caption", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 15, order: 3 },
      { id: "l12", title: "Strategi Hashtag & CTA", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 8, order: 4 },
    ],
  },
  {
    id: "m4",
    title: "Workflow Mastery",
    description: "Setup workflow produksi dan tools",
    order: 4,
    durationHours: 1.5,
    lessons: [
      { id: "l13", title: "Setup Production Pipeline", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 14, order: 1 },
      { id: "l14", title: "Konfigurasi Tool Stack", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 10, order: 2 },
      { id: "l15", title: "Proses Approval & QC", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 12, order: 3 },
      { id: "l16", title: "Metode Batch Production", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 10, order: 4 },
    ],
  },
  {
    id: "m5",
    title: "Performance & Optimization",
    description: "Ukur dan tingkatkan output konten",
    order: 5,
    durationHours: 1,
    lessons: [
      { id: "l17", title: "KPI yang Benar-Benar Penting", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 12, order: 1 },
      { id: "l18", title: "Review Mingguan & Bulanan", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 10, order: 2 },
      { id: "l19", title: "Playbook Optimisasi", youtubeVideoId: "dQw4w9WgXcQ", durationMinutes: 8, order: 3 },
    ],
  },
];

export default function AdminModulesPage() {
  const [modules, setModules] = useState<Module[]>(DEMO_MODULES);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<{ moduleId: string; lesson: Lesson | null }>({ moduleId: "", lesson: null });

  // Module form state
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDesc, setModuleDesc] = useState("");

  // Lesson form state
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonYoutubeId, setLessonYoutubeId] = useState("");
  const [lessonDuration, setLessonDuration] = useState("");

  const openEditModule = (mod: Module) => {
    setEditingModule(mod);
    setModuleTitle(mod.title);
    setModuleDesc(mod.description);
    setShowModuleModal(true);
  };

  const openAddModule = () => {
    setEditingModule(null);
    setModuleTitle("");
    setModuleDesc("");
    setShowModuleModal(true);
  };

  const saveModule = () => {
    if (!moduleTitle.trim()) return;

    if (editingModule) {
      setModules(modules.map(m =>
        m.id === editingModule.id
          ? { ...m, title: moduleTitle, description: moduleDesc }
          : m
      ));
    } else {
      const newModule: Module = {
        id: `m${Date.now()}`,
        title: moduleTitle,
        description: moduleDesc,
        order: modules.length + 1,
        durationHours: 0,
        lessons: [],
      };
      setModules([...modules, newModule]);
    }
    setShowModuleModal(false);
  };

  const openEditLesson = (moduleId: string, lesson: Lesson) => {
    setEditingLesson({ moduleId, lesson });
    setLessonTitle(lesson.title);
    setLessonYoutubeId(lesson.youtubeVideoId);
    setLessonDuration(String(lesson.durationMinutes));
    setShowLessonModal(true);
  };

  const openAddLesson = (moduleId: string) => {
    setEditingLesson({ moduleId, lesson: null });
    setLessonTitle("");
    setLessonYoutubeId("");
    setLessonDuration("");
    setShowLessonModal(true);
  };

  const saveLesson = () => {
    if (!lessonTitle.trim() || !editingLesson.moduleId) return;

    setModules(modules.map(m => {
      if (m.id !== editingLesson.moduleId) return m;

      if (editingLesson.lesson) {
        // Edit existing
        return {
          ...m,
          lessons: m.lessons.map(l =>
            l.id === editingLesson.lesson!.id
              ? { ...l, title: lessonTitle, youtubeVideoId: lessonYoutubeId, durationMinutes: parseInt(lessonDuration) || 0 }
              : l
          ),
        };
      } else {
        // Add new
        const newLesson: Lesson = {
          id: `l${Date.now()}`,
          title: lessonTitle,
          youtubeVideoId: lessonYoutubeId,
          durationMinutes: parseInt(lessonDuration) || 0,
          order: m.lessons.length + 1,
        };
        return { ...m, lessons: [...m.lessons, newLesson] };
      }
    }));
    setShowLessonModal(false);
  };

  const deleteLesson = (moduleId: string, lessonId: string) => {
    if (!confirm("Yakin hapus lesson ini?")) return;
    setModules(modules.map(m =>
      m.id === moduleId
        ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) }
        : m
    ));
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Kelola Modul & Materi</h1>
          <p className="text-fg-muted text-sm mt-1">Tambah, edit, dan atur urutan modul dan lesson</p>
        </div>
        <button
          onClick={openAddModule}
          className="bg-accent hover:bg-accent-hover text-white font-medium text-sm px-5 py-2.5 rounded-lg transition-colors"
        >
          + Tambah Modul
        </button>
      </div>

      <div className="space-y-4">
        {modules.map((mod) => (
          <div key={mod.id} className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center font-bold">
                  {mod.order}
                </div>
                <div>
                  <p className="font-medium">{mod.title}</p>
                  <p className="text-xs text-fg-muted">{mod.lessons.length} lesson · {mod.durationHours} jam</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModule(mod)}
                  className="text-sm text-fg-muted hover:text-accent px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => openAddLesson(mod.id)}
                  className="text-sm text-fg-muted hover:text-accent px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  + Lesson
                </button>
              </div>
            </div>

            {/* Lessons */}
            <div className="space-y-2 pl-14">
              {mod.lessons.map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-fg-muted font-mono w-5">{lesson.order}</span>
                    <span className="text-sm">{lesson.title}</span>
                    <span className="text-xs text-fg-muted">({lesson.durationMinutes} menit)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditLesson(mod.id, lesson)}
                      className="text-xs text-fg-muted hover:text-accent transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteLesson(mod.id, lesson.id)}
                      className="text-xs text-fg-muted hover:text-red-500 transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModuleModal(false)}>
          <div className="bg-white border border-border rounded-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-6">{editingModule ? "Edit Modul" : "Tambah Modul Baru"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Judul Modul</label>
                <input
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  placeholder="Contoh: Advanced Content Strategy"
                  className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Deskripsi</label>
                <textarea
                  value={moduleDesc}
                  onChange={(e) => setModuleDesc(e.target.value)}
                  placeholder="Deskripsi singkat modul ini"
                  rows={3}
                  className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowModuleModal(false)} className="px-4 py-2 text-sm text-fg-muted hover:text-fg">
                  Batal
                </button>
                <button onClick={saveModule} className="bg-accent hover:bg-accent-hover text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors">
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowLessonModal(false)}>
          <div className="bg-white border border-border rounded-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-6">{editingLesson.lesson ? "Edit Lesson" : "Tambah Lesson Baru"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Judul Lesson</label>
                <input
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="Contoh: Introduction to Content Strategy"
                  className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">YouTube Video ID</label>
                <input
                  value={lessonYoutubeId}
                  onChange={(e) => setLessonYoutubeId(e.target.value)}
                  placeholder="Contoh: dQw4w9WgXcQ"
                  className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-mono"
                />
                <p className="text-xs text-fg-muted mt-1">Ambil dari URL YouTube: youtube.com/watch?v=<span className="text-accent">VIDEO_ID</span></p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Durasi (menit)</label>
                <input
                  type="number"
                  value={lessonDuration}
                  onChange={(e) => setLessonDuration(e.target.value)}
                  placeholder="10"
                  className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowLessonModal(false)} className="px-4 py-2 text-sm text-fg-muted hover:text-fg">
                  Batal
                </button>
                <button onClick={saveLesson} className="bg-accent hover:bg-accent-hover text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors">
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
