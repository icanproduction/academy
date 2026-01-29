"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  Package,
  Target,
  Star,
  MapPin,
  Briefcase,
  Calendar,
  Mail,
  Phone,
  Loader2,
} from "lucide-react";

interface BrandData {
  client: {
    id: string;
    businessName: string;
    industry: string;
    contactPerson: string;
    email: string;
    phone: string;
    status: string;
    startDate: string;
  } | null;
  icps: Array<{
    id: string;
    icpName: string;
    ageRange: string;
    gender: string[];
    location: string[];
    occupation: string;
    interests: string[];
    painPoints: string;
    goals: string;
    isPrimary: boolean;
  }>;
  products: Array<{
    id: string;
    productName: string;
    category: string;
    description: string;
    priceType: string;
    priceMin: number;
    priceMax: number;
    usp: string;
    isFeatured: boolean;
  }>;
  pillars: Array<{
    id: string;
    name: string;
    emoji: string;
    description: string;
    targetRatio: number;
    color: string;
  }>;
}

export default function MyBrandPage() {
  const [data, setData] = useState<BrandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get session
        const session = localStorage.getItem("ican_session");
        if (!session) {
          setError("Silakan login terlebih dahulu");
          setLoading(false);
          return;
        }

        const parsed = JSON.parse(session);
        const clientId = parsed.id; // Note: login saves as "id" not "clientId"

        if (!clientId) {
          setError("Client ID tidak ditemukan");
          setLoading(false);
          return;
        }

        // Fetch all data in one API call
        const res = await fetch(`/api/my-brand?clientId=${clientId}`);
        const result = await res.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || "Gagal memuat data");
        }
      } catch (err) {
        setError("Terjadi kesalahan saat memuat data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatPrice = (priceMin: number, priceMax: number, priceType: string) => {
    const format = (n: number) => {
      if (n >= 1000000000) return `Rp${(n / 1000000000).toFixed(1)}M`;
      if (n >= 1000000) return `Rp${(n / 1000000).toFixed(0)}jt`;
      if (n >= 1000) return `Rp${Math.floor(n / 1000)}K`;
      return `Rp${n.toLocaleString()}`;
    };

    if (priceType === "Range" && priceMax > priceMin) {
      return `${format(priceMin)} - ${format(priceMax)}`;
    }
    if (priceType === "Starting From") {
      return `Mulai ${format(priceMin)}`;
    }
    return format(priceMin);
  };

  const getCurrentDay = (startDate?: string): number => {
    if (!startDate) return 1;
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.min(diffDays, 90);
  };

  const getPhase = (day: number): string => {
    if (day <= 30) return "Systematize";
    if (day <= 60) return "Execute";
    return "Optimize";
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Memuat data brand...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-slate-700 font-medium mb-2">Gagal Memuat Data</p>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { client, icps, products, pillars } = data;
  const currentDay = getCurrentDay(client?.startDate);
  const phase = getPhase(currentDay);
  const progress = Math.round((currentDay / 90) * 100);
  const primaryICP = icps.find((i) => i.isPrimary) || icps[0];

  const phaseColors: Record<string, string> = {
    Systematize: "from-blue-500 to-indigo-600",
    Execute: "from-emerald-500 to-green-600",
    Optimize: "from-violet-500 to-purple-600",
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Brand Saya</h1>
        <p className="text-slate-500">Informasi lengkap tentang brand dan strategi konten Anda</p>
      </div>

      {/* Progress Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${phaseColors[phase]} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
              {client?.businessName?.[0] || "?"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{client?.businessName || "-"}</h2>
              <p className="text-slate-500">{client?.industry || "-"}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-800">{progress}%</p>
            <p className="text-sm text-slate-500">Progress 90 Hari</p>
          </div>
        </div>

        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full bg-gradient-to-r ${phaseColors[phase]} rounded-full transition-all`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className={`px-3 py-1 rounded-full font-medium ${
            phase === "Systematize" ? "bg-blue-50 text-blue-700" :
            phase === "Execute" ? "bg-emerald-50 text-emerald-700" :
            "bg-violet-50 text-violet-700"
          }`}>
            {phase} • Hari {currentDay}
          </span>
          <span className="text-slate-400">Hari 90</span>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Target Audience (ICP) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-2 text-slate-800">
              <Users className="w-5 h-5 text-purple-600" />
              Target Audience
            </h2>
            <span className="text-xs text-slate-400">{icps.length} ICP</span>
          </div>

          {primaryICP ? (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="font-semibold text-slate-800">{primaryICP.icpName}</span>
                  {primaryICP.isPrimary && (
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">Primary</span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  {primaryICP.ageRange} • {primaryICP.gender?.join("/") || "All"}
                </p>

                {primaryICP.location?.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{primaryICP.location.join(", ")}</span>
                  </div>
                )}

                {primaryICP.occupation && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span>{primaryICP.occupation}</span>
                  </div>
                )}

                {primaryICP.painPoints && (
                  <div className="mt-3 p-3 bg-white/60 rounded-lg">
                    <p className="text-xs font-medium text-slate-500 mb-1">Pain Points:</p>
                    <p className="text-sm text-slate-700">{primaryICP.painPoints}</p>
                  </div>
                )}

                {primaryICP.interests?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {primaryICP.interests.slice(0, 5).map((interest) => (
                      <span key={interest} className="px-2 py-0.5 bg-pink-100 text-pink-600 text-xs rounded-full">
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {icps.length > 1 && (
                <p className="text-xs text-slate-400 text-center">+{icps.length - 1} ICP lainnya</p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada target audience</p>
            </div>
          )}
        </div>

        {/* Products */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-2 text-slate-800">
              <Package className="w-5 h-5 text-orange-600" />
              Produk & Jasa
            </h2>
            <span className="text-xs text-slate-400">{products.length} items</span>
          </div>

          {products.length > 0 ? (
            <div className="space-y-3">
              {products.slice(0, 4).map((product) => (
                <div
                  key={product.id}
                  className={`p-3 rounded-xl ${product.isFeatured ? "bg-orange-50 border border-orange-100" : "bg-slate-50"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {product.isFeatured && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                      <span className="font-medium text-sm text-slate-800">{product.productName}</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">
                      {formatPrice(product.priceMin, product.priceMax, product.priceType)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{product.description}</p>
                </div>
              ))}
              {products.length > 4 && (
                <p className="text-xs text-slate-400 text-center">+{products.length - 4} produk lainnya</p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada produk</p>
            </div>
          )}
        </div>

        {/* Content Pillars */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-2 text-slate-800">
              <Target className="w-5 h-5 text-blue-600" />
              Content Pillars
            </h2>
            <span className="text-xs text-slate-400">{pillars.length} pillars</span>
          </div>

          {pillars.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {pillars.map((pillar) => (
                <div key={pillar.id} className="p-4 bg-slate-50 rounded-xl text-center">
                  <span className="text-3xl mb-2 block">{pillar.emoji || "📌"}</span>
                  <p className="font-semibold text-sm text-slate-800 mb-1">{pillar.name}</p>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                      style={{ width: `${pillar.targetRatio || 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{pillar.targetRatio || 0}% ratio</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Target className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada content pillars</p>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:col-span-2">
          <h2 className="font-bold flex items-center gap-2 text-slate-800 mb-4">
            <Building2 className="w-5 h-5 text-slate-600" />
            Informasi Bisnis
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <span className="text-lg">👤</span>
              </div>
              <div>
                <p className="text-xs text-slate-500">Contact Person</p>
                <p className="font-medium text-sm text-slate-800">{client?.contactPerson || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Mail className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="font-medium text-sm text-slate-800 truncate max-w-[150px]">{client?.email || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Phone className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Telepon</p>
                <p className="font-medium text-sm text-slate-800">{client?.phone || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Mulai Program</p>
                <p className="font-medium text-sm text-slate-800">
                  {client?.startDate
                    ? new Date(client.startDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
