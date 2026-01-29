"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Calendar,
  Clock,
  Target,
  BookOpen,
  FileVideo,
  TrendingUp,
  Edit,
  CheckCircle,
  Play,
  Pause,
  Loader2,
  Package,
  FolderOpen,
  Sparkles,
  Users,
  Plus,
  ExternalLink,
  Trash2,
  Star,
  RefreshCw,
  LayoutGrid,
  FileText,
} from "lucide-react";

// Types
interface Client {
  id: string;
  businessName: string;
  industry: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: string;
  startDate: string;
  instagram?: string;
  website?: string;
}

interface KnowledgeBankItem {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: number;
  includeInBrief: boolean;
  isActive: boolean;
}

interface ClientICP {
  id: string;
  icpName: string;
  ageRange: string;
  gender: string[];
  location: string[];
  occupation: string;
  painPoints: string;
  goals: string;
  isPrimary: boolean;
}

interface ClientProduct {
  id: string;
  productName: string;
  category: string;
  description: string;
  priceType: string;
  priceMin: number;
  priceMax: number;
  isFeatured: boolean;
}

interface ClientAsset {
  id: string;
  assetName: string;
  assetType: string;
  url: string;
  description: string;
}

interface ContentPillar {
  id: string;
  name: string;
  emoji: string;
  description: string;
  targetRatio: number;
  color: string;
  targetEmotion?: string;
  ctaType?: string;
}

interface ReelsBrief {
  id: string;
  requestId: string;
  topic: string;
  status: string;
  createdAt: string;
}

type TabId = "overview" | "products" | "pillars" | "assets" | "briefs";

const phaseColor: Record<string, string> = {
  Systematize: "from-blue-500 to-indigo-600",
  Execute: "from-emerald-500 to-green-600",
  Optimize: "from-violet-500 to-purple-600",
  Completed: "from-slate-400 to-slate-500",
};

const phaseTextColor: Record<string, string> = {
  Systematize: "text-blue-600 bg-blue-50",
  Execute: "text-emerald-600 bg-emerald-50",
  Optimize: "text-violet-600 bg-violet-50",
  Completed: "text-slate-600 bg-slate-100",
};

export default function AdminClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  // Data for tabs
  const [knowledgeBank, setKnowledgeBank] = useState<KnowledgeBankItem[]>([]);
  const [icps, setICPs] = useState<ClientICP[]>([]);
  const [products, setProducts] = useState<ClientProduct[]>([]);
  const [assets, setAssets] = useState<ClientAsset[]>([]);
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [briefs, setBriefs] = useState<ReelsBrief[]>([]);

  // Context status
  const [contextStatus, setContextStatus] = useState<{ cached: boolean; lastUpdated?: string }>({ cached: false });
  const [recompiling, setRecompiling] = useState(false);

  // Calculate current day based on start date
  const getCurrentDay = (startDate?: string): number => {
    if (!startDate) return 1;
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.min(diffDays, 90);
  };

  // Calculate phase based on current day
  const getPhase = (day: number, status?: string): string => {
    if (status === "completed") return "Completed";
    if (day <= 30) return "Systematize";
    if (day <= 60) return "Execute";
    return "Optimize";
  };

  // Fetch client data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/clients/${clientId}`);
        if (res.ok) {
          const data = await res.json();
          setClient(data);
        }
      } catch (error) {
        console.error("Error fetching client:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [clientId]);

  // Fetch tab-specific data when tab changes
  useEffect(() => {
    const fetchTabData = async () => {
      try {
        switch (activeTab) {
          case "overview":
            // Fetch knowledge bank and ICPs for overview
            const [kbRes, icpRes] = await Promise.all([
              fetch(`/api/clients/${clientId}/knowledge-bank?isActive=true`),
              fetch(`/api/clients/${clientId}/icp`),
            ]);
            if (kbRes.ok) {
              const data = await kbRes.json();
              setKnowledgeBank(Array.isArray(data) ? data : []);
            }
            if (icpRes.ok) {
              const data = await icpRes.json();
              setICPs(Array.isArray(data) ? data : []);
            }
            break;

          case "products":
            const prodRes = await fetch(`/api/clients/${clientId}/products?isActive=true`);
            if (prodRes.ok) {
              const data = await prodRes.json();
              setProducts(Array.isArray(data) ? data : []);
            }
            break;

          case "pillars":
            const pillarRes = await fetch(`/api/pillars?clientId=${clientId}`);
            if (pillarRes.ok) {
              const data = await pillarRes.json();
              setPillars(Array.isArray(data) ? data : []);
            }
            break;

          case "assets":
            const assetRes = await fetch(`/api/clients/${clientId}/assets`);
            if (assetRes.ok) {
              const data = await assetRes.json();
              setAssets(Array.isArray(data) ? data : []);
            }
            break;

          case "briefs":
            const briefsRes = await fetch(`/api/clients/${clientId}/briefs`);
            if (briefsRes.ok) {
              const data = await briefsRes.json();
              setBriefs(Array.isArray(data) ? data : []);
            }
            break;
        }
      } catch (error) {
        console.error("Error fetching tab data:", error);
      }
    };

    if (clientId) {
      fetchTabData();
    }
  }, [activeTab, clientId]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok && client) {
        setClient({ ...client, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleRecompileContext = async () => {
    try {
      setRecompiling(true);
      const res = await fetch(`/api/clients/${clientId}/compile-context`, {
        method: "POST",
      });
      if (res.ok) {
        setContextStatus({ cached: true, lastUpdated: new Date().toISOString() });
      }
    } catch (error) {
      console.error("Error recompiling context:", error);
    } finally {
      setRecompiling(false);
    }
  };

  const formatPrice = (priceMin: number, priceMax: number, priceType: string) => {
    const format = (n: number) => {
      if (n >= 1000000) return `Rp${(n / 1000000).toFixed(1)}jt`;
      if (n >= 1000) return `Rp${Math.floor(n / 1000)}K`;
      return `Rp${n}`;
    };

    if (priceType === "Range" && priceMax > priceMin) {
      return `${format(priceMin)} - ${format(priceMax)}`;
    }
    if (priceType === "Starting From") {
      return `Mulai ${format(priceMin)}`;
    }
    return format(priceMin);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-fg-muted mb-4">Client tidak ditemukan</p>
          <Link href="/dashboard/admin/clients" className="text-accent hover:underline">
            Kembali ke Daftar Client
          </Link>
        </div>
      </div>
    );
  }

  const currentDay = getCurrentDay(client.startDate);
  const phase = getPhase(currentDay, client.status);
  const progress = Math.round((currentDay / 90) * 100);

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: LayoutGrid },
    { id: "products" as const, label: "Products", icon: Package },
    { id: "pillars" as const, label: "Pillars", icon: Target },
    { id: "assets" as const, label: "Assets", icon: FolderOpen },
    { id: "briefs" as const, label: "Briefs", icon: Sparkles },
  ];

  return (
    <div className="p-8 max-w-6xl animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/admin/clients"
          className="inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Client
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={cn("w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-2xl shadow-lg", phaseColor[phase])}>
              {client.businessName?.[0] || "?"}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{client.businessName}</h1>
              <p className="text-fg-muted text-sm">{client.industry || "No industry"}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={cn("px-3 py-1 rounded-full text-xs font-medium", phaseTextColor[phase])}>
                  {phase} • Hari {currentDay}
                </span>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium",
                  client.status === "active" ? "bg-green-50 text-green-700" :
                  client.status === "completed" ? "bg-blue-50 text-blue-700" :
                  "bg-yellow-50 text-yellow-700"
                )}>
                  {client.status === "active" ? "Aktif" :
                   client.status === "completed" ? "Selesai" : "Pause"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {client.status === "active" ? (
              <button
                onClick={() => handleStatusChange("paused")}
                className="px-3 py-2 rounded-lg text-sm bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors flex items-center gap-1.5"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            ) : client.status === "paused" ? (
              <button
                onClick={() => handleStatusChange("active")}
                className="px-3 py-2 rounded-lg text-sm bg-green-50 text-green-700 hover:bg-green-100 transition-colors flex items-center gap-1.5"
              >
                <Play className="w-4 h-4" />
                Aktifkan
              </button>
            ) : null}
            <button className="bg-slate-100 hover:bg-slate-200 text-fg-secondary font-medium text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === tab.id
                  ? "border-accent text-accent"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Progress */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  Progress 90 Hari
                </h2>
                <span className="text-2xl font-bold">{progress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                <div
                  className={cn("h-full bg-gradient-to-r rounded-full transition-all", phaseColor[phase])}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-fg-muted">
                <span>Hari {currentDay}</span>
                <span>Hari 90</span>
              </div>
            </div>

            {/* Knowledge Bank & ICP Row */}
            <div className="grid grid-cols-2 gap-6">
              {/* Knowledge Bank Summary */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-accent" />
                    Knowledge Bank
                  </h2>
                  <Link
                    href={`/dashboard/admin/clients/${clientId}/knowledge-bank`}
                    className="text-sm text-accent hover:underline"
                  >
                    Manage →
                  </Link>
                </div>
                {knowledgeBank.length > 0 ? (
                  <div className="space-y-2">
                    {knowledgeBank.slice(0, 4).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded">
                            {item.category}
                          </span>
                          <span className="text-sm font-medium truncate max-w-[180px]">{item.title}</span>
                        </div>
                        {item.includeInBrief && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    ))}
                    {knowledgeBank.length > 4 && (
                      <p className="text-xs text-slate-400 text-center pt-2">
                        +{knowledgeBank.length - 4} more items
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Belum ada knowledge</p>
                    <Link
                      href={`/dashboard/admin/clients/${clientId}/knowledge-bank`}
                      className="text-accent text-sm hover:underline"
                    >
                      Tambah sekarang
                    </Link>
                  </div>
                )}

                {/* Context Status */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Context: {contextStatus.cached ? (
                      <span className="text-green-600">✅ Cached</span>
                    ) : (
                      <span className="text-amber-600">⚠️ Not compiled</span>
                    )}
                  </div>
                  <button
                    onClick={handleRecompileContext}
                    disabled={recompiling}
                    className="text-xs text-accent hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={cn("w-3 h-3", recompiling && "animate-spin")} />
                    {recompiling ? "Compiling..." : "Recompile"}
                  </button>
                </div>
              </div>

              {/* ICP Summary */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent" />
                    Target Audience
                  </h2>
                  <Link
                    href={`/dashboard/admin/clients/${clientId}/icp`}
                    className="text-sm text-accent hover:underline"
                  >
                    Manage →
                  </Link>
                </div>
                {icps.length > 0 ? (
                  <div className="space-y-3">
                    {icps.map((icp) => (
                      <div key={icp.id} className={cn(
                        "p-3 rounded-lg",
                        icp.isPrimary ? "bg-accent/5 border border-accent/20" : "bg-slate-50"
                      )}>
                        <div className="flex items-center gap-2 mb-1">
                          {icp.isPrimary && (
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          )}
                          <span className="font-medium text-sm">{icp.icpName}</span>
                          {icp.isPrimary && (
                            <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {icp.ageRange} • {icp.gender?.join("/") || "All"} • {icp.location?.slice(0, 2).join(", ")}
                        </p>
                        {icp.painPoints && (
                          <p className="text-xs text-slate-600 mt-1 truncate">
                            "{icp.painPoints.substring(0, 60)}..."
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Belum ada ICP</p>
                    <Link
                      href={`/dashboard/admin/clients/${clientId}/icp`}
                      className="text-accent text-sm hover:underline"
                    >
                      Tambah sekarang
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-accent" />
                Informasi Kontak
              </h2>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <span className="text-lg">👤</span>
                  </div>
                  <div>
                    <p className="text-xs text-fg-muted">Contact Person</p>
                    <p className="font-medium text-sm">{client.contactPerson || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-fg-muted" />
                  </div>
                  <div>
                    <p className="text-xs text-fg-muted">Email</p>
                    <p className="font-medium text-sm">{client.email || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-fg-muted" />
                  </div>
                  <div>
                    <p className="text-xs text-fg-muted">Telepon</p>
                    <p className="font-medium text-sm">{client.phone || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-fg-muted" />
                  </div>
                  <div>
                    <p className="text-xs text-fg-muted">Mulai</p>
                    <p className="font-medium text-sm">
                      {client.startDate ? new Date(client.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action: Request Brief */}
            <Link
              href={`/dashboard/admin/clients/${clientId}/brief/new`}
              className="block glass-card rounded-2xl p-6 hover:shadow-lg hover:border-accent/30 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center shadow-lg shadow-accent/25 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">Request Reels Brief</p>
                    <p className="text-sm text-slate-500">Generate brief dengan AI</p>
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 text-slate-400 rotate-180 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === "products" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Products ({products.length})</h2>
              <Link
                href={`/dashboard/admin/clients/${clientId}/products`}
                className="bg-accent hover:bg-accent-hover text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Manage Products
              </Link>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {products.map((product) => (
                  <div key={product.id} className="glass-card rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {product.isFeatured && (
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          )}
                          <span className="font-semibold">{product.productName}</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {product.category}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">{product.description}</p>
                    <p className="font-bold text-accent">
                      {formatPrice(product.priceMin, product.priceMax, product.priceType)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-12 text-center">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Belum ada product</h3>
                <p className="text-sm text-slate-500 mb-4">Tambahkan products untuk digunakan dalam brief generation</p>
                <Link
                  href={`/dashboard/admin/clients/${clientId}/products`}
                  className="bg-accent hover:bg-accent-hover text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Product
                </Link>
              </div>
            )}
          </div>
        )}

        {/* PILLARS TAB */}
        {activeTab === "pillars" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Content Pillars ({pillars.length})</h2>
              <Link
                href={`/dashboard/admin/clients/${clientId}/pillars`}
                className="bg-accent hover:bg-accent-hover text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Manage Pillars
              </Link>
            </div>

            {pillars.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {pillars.map((pillar) => (
                  <div key={pillar.id} className="glass-card rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{pillar.emoji || "📌"}</span>
                        <div>
                          <p className="font-semibold">{pillar.name}</p>
                          <p className="text-xs text-slate-500">
                            {pillar.targetEmotion || "Educate"} • CTA: {pillar.ctaType || "Follow"}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-accent">{pillar.targetRatio}%</span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{pillar.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-12 text-center">
                <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Belum ada content pillars</h3>
                <p className="text-sm text-slate-500 mb-4">Setup content pillars untuk strategi konten client</p>
                <Link
                  href={`/dashboard/admin/clients/${clientId}/pillars`}
                  className="bg-accent hover:bg-accent-hover text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Setup Pillars
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ASSETS TAB */}
        {activeTab === "assets" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Assets ({assets.length})</h2>
              <Link
                href={`/dashboard/admin/clients/${clientId}/assets`}
                className="bg-accent hover:bg-accent-hover text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Manage Assets
              </Link>
            </div>

            {assets.length > 0 ? (
              <div className="space-y-3">
                {/* Group by type */}
                {["Canva Template", "Font", "Logo", "Guidelines", "Other"].map((type) => {
                  const typeAssets = assets.filter((a) => a.assetType === type);
                  if (typeAssets.length === 0) return null;

                  return (
                    <div key={type}>
                      <h3 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                        {type === "Canva Template" && "🎨"}
                        {type === "Font" && "🔤"}
                        {type === "Logo" && "🖼️"}
                        {type === "Guidelines" && "📋"}
                        {type === "Other" && "📁"}
                        {type.toUpperCase()}
                      </h3>
                      <div className="space-y-2">
                        {typeAssets.map((asset) => (
                          <div key={asset.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium">{asset.assetName}</p>
                              {asset.description && (
                                <p className="text-sm text-slate-500">{asset.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {asset.url && (
                                <a
                                  href={asset.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 text-sm text-accent bg-accent/10 rounded-lg hover:bg-accent/20 transition-colors flex items-center gap-1"
                                >
                                  Open
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                              <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-12 text-center">
                <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Belum ada assets</h3>
                <p className="text-sm text-slate-500 mb-4">Upload template, font, logo, dan guidelines untuk client</p>
                <Link
                  href={`/dashboard/admin/clients/${clientId}/assets`}
                  className="bg-accent hover:bg-accent-hover text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Asset
                </Link>
              </div>
            )}
          </div>
        )}

        {/* BRIEFS TAB */}
        {activeTab === "briefs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Reels Briefs ({briefs.length})</h2>
              <Link
                href={`/dashboard/admin/clients/${clientId}/brief/new`}
                className="bg-accent hover:bg-accent-hover text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate Brief
              </Link>
            </div>

            {briefs.length > 0 ? (
              <div className="space-y-3">
                {briefs.map((brief) => (
                  <Link
                    key={brief.id}
                    href={`/dashboard/admin/clients/${clientId}/brief/${brief.id}`}
                    className="glass-card rounded-xl p-4 flex items-center justify-between hover:shadow-md hover:border-accent/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">{brief.requestId}</p>
                        <p className="text-sm text-slate-500">{brief.topic}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        brief.status === "Approved" ? "bg-green-50 text-green-700" :
                        brief.status === "Generated" ? "bg-blue-50 text-blue-700" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {brief.status}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(brief.createdAt).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-12 text-center">
                <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Belum ada brief</h3>
                <p className="text-sm text-slate-500 mb-4">Generate Reels brief dengan AI untuk client ini</p>
                <Link
                  href={`/dashboard/admin/clients/${clientId}/brief/new`}
                  className="bg-accent hover:bg-accent-hover text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Brief
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
