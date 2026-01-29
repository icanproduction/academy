"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ArrowRight,
  TrendingUp,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Briefcase,
} from "lucide-react";

const DEMO_CLIENTS = [
  { id: "1", name: "Kedai Kopi Nusantara", day: 45, phase: "Execute", progress: 50, modulesCompleted: 12, totalModules: 24 },
  { id: "2", name: "Skin Glow Beauty", day: 12, phase: "Systematize", progress: 13, modulesCompleted: 3, totalModules: 24 },
  { id: "3", name: "FitZone Gym", day: 78, phase: "Optimize", progress: 87, modulesCompleted: 21, totalModules: 24 },
];

const DEMO_CALLS = [
  { id: "c1", client: "Skin Glow Beauty", type: "Strategy Review", datetime: "2025-02-06T10:00:00" },
  { id: "c2", client: "FitZone Gym", type: "Execution Check", datetime: "2025-02-07T14:00:00" },
  { id: "c3", client: "Kedai Kopi Nusantara", type: "Performance Review", datetime: "2025-02-10T10:00:00" },
];

const phaseColor: Record<string, string> = {
  Systematize: "from-blue-500 to-indigo-600",
  Execute: "from-emerald-500 to-green-600",
  Optimize: "from-violet-500 to-purple-600",
};

const phaseTextColor: Record<string, string> = {
  Systematize: "text-blue-600",
  Execute: "text-emerald-600",
  Optimize: "text-violet-600",
};

export default function AdminDashboardPage() {
  const activeClients = DEMO_CLIENTS.length;
  const totalModulesLearned = DEMO_CLIENTS.reduce((sum, c) => sum + c.modulesCompleted, 0);
  const avgProgress = Math.round(DEMO_CLIENTS.reduce((sum, c) => sum + c.progress, 0) / DEMO_CLIENTS.length);

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
            <p className="text-slate-500">Overview iCAN Platform</p>
          </div>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="glass-card rounded-2xl p-5 card-hover animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/30">
              <Users className="w-5 h-5 text-white" />
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-slate-500 text-sm mb-1">Client Aktif</p>
          <p className="text-3xl font-bold text-slate-800">{activeClients}</p>
        </div>

        <div className="glass-card rounded-2xl p-5 card-hover animate-fade-in" style={{ animationDelay: "150ms" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/30">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-slate-500 text-sm mb-1">Total Modul Selesai</p>
          <p className="text-3xl font-bold text-blue-600">{totalModulesLearned}</p>
        </div>

        <div className="glass-card rounded-2xl p-5 card-hover animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md shadow-emerald-500/30">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-slate-500 text-sm mb-1">Rata-rata Progress</p>
          <p className="text-3xl font-bold text-emerald-600">{avgProgress}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client List */}
        <div className="glass-card rounded-2xl p-6 animate-fade-in lg:col-span-1" style={{ animationDelay: "250ms" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-500" />
              Daftar Client
            </h2>
            <Link href="/dashboard/admin/clients" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 group">
              Lihat Semua
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="space-y-3">
            {DEMO_CLIENTS.map((c, i) => (
              <Link key={c.id} href={`/dashboard/admin/clients/${c.id}`} className="block p-4 rounded-xl bg-slate-50/80 hover:bg-slate-100 transition-all group animate-fade-in" style={{ animationDelay: `${300 + i * 50}ms` }}>
                <div className="flex items-center gap-4 mb-3">
                  <div className={cn("w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shadow-md", phaseColor[c.phase])}>
                    {c.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{c.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>Hari {c.day}/90</span>
                      <span>·</span>
                      <span className={cn("font-medium", phaseTextColor[c.phase])}>{c.phase}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-700">{c.progress}%</span>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full bg-gradient-to-r rounded-full transition-all duration-500", phaseColor[c.phase])}
                    style={{ width: `${c.progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                  <span>{c.modulesCompleted} modul selesai</span>
                  <span>{c.totalModules - c.modulesCompleted} tersisa</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming Calls */}
        <div className="glass-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-500" />
            Jadwal Call
          </h2>
          <div className="space-y-3">
            {DEMO_CALLS.map((call, i) => {
              const d = new Date(call.datetime);
              return (
                <div key={call.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/80 hover:bg-slate-100 transition-all cursor-pointer group animate-fade-in" style={{ animationDelay: `${350 + i * 50}ms` }}>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex flex-col items-center justify-center shadow-md shadow-teal-500/30">
                    <span className="text-lg font-bold text-white">{d.toLocaleDateString("id-ID", { day: "numeric" })}</span>
                    <span className="text-[10px] text-teal-100 uppercase font-medium">{d.toLocaleDateString("id-ID", { month: "short" })}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-teal-600 transition-colors">{call.client}</p>
                    <p className="text-xs text-slate-500">{call.type}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-slate-700">{d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                    <p className="text-xs text-slate-400">WIB</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty state if no calls */}
          {DEMO_CALLS.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Belum ada jadwal call</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-card rounded-2xl p-6 animate-fade-in lg:col-span-2" style={{ animationDelay: "350ms" }}>
          <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-500" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/admin/clients" className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 transition-all group text-center">
              <Users className="w-8 h-8 text-violet-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-slate-700">Kelola Client</p>
            </Link>
            <Link href="/dashboard/admin/modules" className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all group text-center">
              <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-slate-700">Kelola Modul</p>
            </Link>
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 text-center opacity-50 cursor-not-allowed">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-500">Konten</p>
              <p className="text-xs text-slate-400">Coming Soon</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 text-center opacity-50 cursor-not-allowed">
              <TrendingUp className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-500">Analytics</p>
              <p className="text-xs text-slate-400">Coming Soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
