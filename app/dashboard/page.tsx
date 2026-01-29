"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  BookOpen,
  Layers,
  Play,
  Sparkles,
  FileText,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  ArrowRight,
  Target,
} from "lucide-react";

interface DashboardData {
  progress: {
    currentPhase: string;
    currentDay: number;
    completionPercentage: number;
  } | null;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    dueDate: string;
    week: number;
  }>;
  courseProgress: {
    total: number;
    completed: number;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<DashboardData["tasks"]>([]);

  useEffect(() => {
    const initialData: DashboardData = {
      progress: {
        currentPhase: "Systematize",
        currentDay: 14,
        completionPercentage: 15,
      },
      tasks: [
        { id: "1", title: "Selesaikan modul Brand DNA", status: "in_progress", dueDate: "2025-02-10", week: 1 },
        { id: "2", title: "Tentukan content pillars", status: "todo", dueDate: "2025-02-14", week: 2 },
        { id: "3", title: "Setup template content calendar", status: "todo", dueDate: "2025-02-17", week: 2 },
        { id: "4", title: "Buat panduan visual", status: "todo", dueDate: "2025-02-21", week: 3 },
        { id: "5", title: "Tulis dokumen brand voice", status: "todo", dueDate: "2025-02-24", week: 3 },
      ],
      courseProgress: { total: 19, completed: 3 },
    };
    setData(initialData);
    setTasks(initialData.tasks);
    setLoading(false);
  }, []);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "done" ? "todo" : "done" }
          : t
      )
    );
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Memuat dashboard...</span>
        </div>
      </div>
    );
  }

  const progress = data?.progress;
  const courseProgress = data?.courseProgress || { total: 0, completed: 0 };

  const phaseColors: Record<string, string> = {
    Systematize: "from-blue-500 to-indigo-500",
    Execute: "from-emerald-500 to-teal-500",
    Optimize: "from-violet-500 to-purple-500",
  };

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-10 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className={cn(
            "w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
            phaseColors[progress?.currentPhase || "Systematize"],
            "shadow-blue-500/30"
          )}>
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Selamat Datang</h1>
            <p className="text-slate-500">
              Hari ke-<span className="font-semibold text-slate-700">{progress?.currentDay || 0}</span> dari 90 — Fase: <span className="font-semibold text-blue-600">{progress?.currentPhase || "Belum Dimulai"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Progress Program */}
        <div className="glass-card rounded-2xl p-6 card-hover animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-600">
              Program
            </span>
          </div>
          <p className="text-sm text-slate-500 mb-1">Progress Program</p>
          <p className="text-4xl font-bold text-slate-800">{progress?.completionPercentage || 0}<span className="text-xl text-slate-400">%</span></p>
          <div className="progress-bar mt-4">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress?.completionPercentage || 0}%` }}
            />
          </div>
        </div>

        {/* Materi Selesai */}
        <div className="glass-card rounded-2xl p-6 card-hover animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">
              Materi
            </span>
          </div>
          <p className="text-sm text-slate-500 mb-1">Materi Selesai</p>
          <p className="text-4xl font-bold text-slate-800">
            {courseProgress.completed}
            <span className="text-xl text-slate-400">/{courseProgress.total}</span>
          </p>
          <div className="progress-bar mt-4">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${courseProgress.total > 0 ? (courseProgress.completed / courseProgress.total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Fase Saat Ini */}
        <div className="glass-card rounded-2xl p-6 card-hover animate-fade-in" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-violet-50 text-violet-600">
              Fase
            </span>
          </div>
          <p className="text-sm text-slate-500 mb-1">Fase Saat Ini</p>
          <p className="text-3xl font-bold text-slate-800">{progress?.currentPhase || "—"}</p>
          <p className="text-slate-500 text-sm mt-2 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Hari ke-{progress?.currentDay || 0} dari 30
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Aksi Cepat
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/course"
            className="group glass-card rounded-2xl p-6 card-hover animate-fade-in relative overflow-hidden"
            style={{ animationDelay: "400ms" }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                <Play className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                Lanjut Belajar
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </p>
              <p className="text-sm text-slate-500 mt-1">Lanjutkan materi terakhir</p>
            </div>
          </Link>

          <Link
            href="/dashboard/brand"
            className="group glass-card rounded-2xl p-6 card-hover animate-fade-in relative overflow-hidden"
            style={{ animationDelay: "500ms" }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-slate-800 group-hover:text-amber-600 transition-colors flex items-center gap-2">
                Brand & Assets
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </p>
              <p className="text-sm text-slate-500 mt-1">Lihat brand guide & assets</p>
            </div>
          </Link>

          <Link
            href="/dashboard/playbook"
            className="group glass-card rounded-2xl p-6 card-hover animate-fade-in relative overflow-hidden"
            style={{ animationDelay: "600ms" }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-slate-800 group-hover:text-violet-600 transition-colors flex items-center gap-2">
                Brand Playbook
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </p>
              <p className="text-sm text-slate-500 mt-1">Lihat panduan brand kamu</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Tasks */}
      <div className="animate-fade-in" style={{ animationDelay: "700ms" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Tugas Kamu
          </h2>
          <span className="text-sm text-slate-500">
            {tasks.filter(t => t.status === "done").length}/{tasks.length} selesai
          </span>
        </div>
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="divide-y divide-slate-100">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors animate-fade-in"
                style={{ animationDelay: `${800 + index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                      task.status === "done"
                        ? "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/30"
                        : task.status === "in_progress"
                        ? "border-2 border-blue-500 bg-blue-50"
                        : "border-2 border-slate-300 hover:border-slate-400"
                    )}
                  >
                    {task.status === "done" && <CheckCircle2 className="w-4 h-4 text-white" />}
                    {task.status === "in_progress" && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                  </button>
                  <div>
                    <p className={cn(
                      "text-sm font-medium transition-all",
                      task.status === "done" ? "line-through text-slate-400" : "text-slate-700"
                    )}>
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        Minggu {task.week}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-xs px-2.5 py-1 rounded-full font-medium",
                    task.status === "done"
                      ? "bg-emerald-50 text-emerald-600"
                      : task.status === "in_progress"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-slate-100 text-slate-500"
                  )}>
                    {task.status === "done" ? "Selesai" : task.status === "in_progress" ? "Dikerjakan" : "Belum"}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {task.dueDate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
