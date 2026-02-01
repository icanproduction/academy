"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Play,
  BookOpen,
  Briefcase,
  FileVideo,
  Users,
  Box,
  ClipboardCheck,
  LogOut,
  ChevronRight,
  User,
  Database,
  PlusCircle,
  FolderOpen,
  Menu,
  X,
} from "lucide-react";

const CLIENT_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/knowledge", label: "Knowledge Bank", icon: Database },
  { href: "/dashboard/contents", label: "Konten Saya", icon: FileVideo },
  { href: "/dashboard/assets", label: "Assets", icon: FolderOpen },
  { href: "/dashboard/course", label: "Materi", icon: Play },
  { href: "/dashboard/profile", label: "Profil Saya", icon: User },
];

const ADMIN_NAV = [
  { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/admin/clients", label: "Kelola Client", icon: Users },
  { href: "/dashboard/admin/modules", label: "Kelola Modul", icon: Box },
  { href: "/dashboard/admin/review", label: "Review Konten", icon: ClipboardCheck },
];

interface Session {
  email: string;
  role: string;
  name: string;
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("ican_session");
    if (stored) {
      setSession(JSON.parse(stored));
    }
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (onClose) {
      onClose();
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("ican_session");
    router.push("/login");
  };

  const initials = session?.name
    ? session.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const navItems = session?.role === "admin" ? ADMIN_NAV : CLIENT_NAV;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 glass-sidebar flex flex-col z-50 transition-transform duration-300",
          // Mobile: hidden by default, shown when isOpen
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-5 border-b border-slate-200/60 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-xl group-hover:shadow-blue-500/40 transition-all duration-300">
              <span className="text-white font-bold text-lg">i</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none gradient-text">iCAN</h1>
              <p className="text-[10px] text-slate-500 font-medium">Content System</p>
            </div>
          </Link>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && item.href !== "/dashboard/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                  "animate-fade-in",
                  isActive
                    ? "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
                )}
                <Icon className={cn(
                  "w-5 h-5 transition-all duration-200",
                  isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                )} />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <ChevronRight className="w-4 h-4 text-blue-500 opacity-60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-slate-200/60">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-slate-800">{session?.name || "User"}</p>
              <p className="text-xs text-slate-500 capitalize">{session?.role || ""}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

// Mobile Header with hamburger menu
export function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 flex items-center px-4 z-30 lg:hidden">
      <button
        onClick={onMenuClick}
        className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100"
      >
        <Menu className="w-6 h-6" />
      </button>
      <div className="flex items-center gap-2 ml-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">i</span>
        </div>
        <span className="font-bold text-slate-800">iCAN</span>
      </div>
    </header>
  );
}
