"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  FolderOpen,
  Plus,
  ExternalLink,
  Palette,
  FileImage,
  Link2,
  Video,
  MoreHorizontal,
  Search,
  X,
  Loader2,
  Trash2,
} from "lucide-react";

interface Asset {
  id: string;
  assetName: string;
  assetType: string;
  url: string;
  description: string;
}

const ASSET_TYPES = [
  { value: "Canva Template", label: "Canva Template", icon: Palette },
  { value: "Font", label: "Font", icon: FileImage },
  { value: "Logo", label: "Logo", icon: FileImage },
  { value: "Guidelines", label: "Guidelines", icon: Link2 },
  { value: "Other", label: "Lainnya", icon: MoreHorizontal },
];

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  // Form states
  const [newAsset, setNewAsset] = useState({
    assetName: "",
    assetType: "Canva Template",
    url: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Get client ID from session
    const session = localStorage.getItem("ican_session");
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setClientId(parsed.clientId);
      } catch (e) {
        console.error("Error parsing session:", e);
        setLoading(false);
      }
    } else {
      // No session, stop loading
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (clientId) {
      fetchAssets();
    }
  }, [clientId]);

  const fetchAssets = async () => {
    if (!clientId) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/client/assets?clientId=${clientId}`);
      const data = await res.json();
      if (data.success) {
        setAssets(data.assets);
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsset = async () => {
    if (!clientId || !newAsset.assetName || !newAsset.url) return;

    try {
      setSaving(true);
      const res = await fetch("/api/client/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, ...newAsset }),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewAsset({ assetName: "", assetType: "Canva Template", url: "", description: "" });
        fetchAssets();
      } else {
        alert("Gagal menambahkan asset: " + data.error);
      }
    } catch (error) {
      console.error("Error adding asset:", error);
      alert("Gagal menambahkan asset");
    } finally {
      setSaving(false);
    }
  };

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !filterType || asset.assetType === filterType;
    return matchesSearch && matchesType;
  });

  // Group by type
  const groupedAssets = ASSET_TYPES.reduce((acc, type) => {
    const typeAssets = filteredAssets.filter(a => a.assetType === type.value);
    if (typeAssets.length > 0) {
      acc[type.value] = typeAssets;
    }
    return acc;
  }, {} as Record<string, Asset[]>);

  const getTypeIcon = (type: string) => {
    const found = ASSET_TYPES.find(t => t.value === type);
    return found?.icon || MoreHorizontal;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      "Canva Template": "from-purple-500 to-violet-600",
      Font: "from-pink-500 to-rose-600",
      Logo: "from-blue-500 to-cyan-600",
      Guidelines: "from-green-500 to-emerald-600",
      Other: "from-slate-500 to-gray-600",
    };
    return colors[type] || colors.Other;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Memuat assets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Brand Assets</h1>
              <p className="text-slate-500 text-sm">
                Simpan dan kelola link assets brand kamu
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Tambah Asset
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari asset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterType(null)}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-all",
              !filterType
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Semua
          </button>
          {ASSET_TYPES.slice(0, 4).map((type) => (
            <button
              key={type.value}
              onClick={() => setFilterType(filterType === type.value ? null : type.value)}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5",
                filterType === type.value
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              <type.icon className="w-4 h-4" />
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <FolderOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Belum ada assets</h3>
          <p className="text-slate-500 mb-6">
            Tambahkan link assets seperti template Canva, design files, dan lainnya.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Tambah Asset Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedAssets).map(([type, typeAssets], groupIndex) => {
            const TypeIcon = getTypeIcon(type);
            return (
              <div key={type} className="animate-fade-in" style={{ animationDelay: `${200 + groupIndex * 100}ms` }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={cn(
                    "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center",
                    getTypeColor(type)
                  )}>
                    <TypeIcon className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="font-semibold text-slate-800">{type}</h2>
                  <span className="text-sm text-slate-500">({typeAssets.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeAssets.map((asset, index) => (
                    <a
                      key={asset.id}
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group glass-card rounded-xl p-4 hover:shadow-lg transition-all duration-300 animate-fade-in"
                      style={{ animationDelay: `${300 + index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {asset.assetName}
                        </h3>
                        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500 flex-shrink-0 ml-2" />
                      </div>
                      {asset.description && (
                        <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                          {asset.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Link2 className="w-3 h-3" />
                        <span className="truncate">
                          {new URL(asset.url).hostname}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">Tambah Asset Baru</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nama Asset *
                </label>
                <input
                  type="text"
                  value={newAsset.assetName}
                  onChange={(e) => setNewAsset({ ...newAsset, assetName: e.target.value })}
                  placeholder="Contoh: Template Instagram Carousel"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Tipe
                </label>
                <select
                  value={newAsset.assetType}
                  onChange={(e) => setNewAsset({ ...newAsset, assetType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  {ASSET_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  URL Link *
                </label>
                <input
                  type="url"
                  value={newAsset.url}
                  onChange={(e) => setNewAsset({ ...newAsset, url: e.target.value })}
                  placeholder="https://www.canva.com/design/..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Deskripsi (opsional)
                </label>
                <textarea
                  value={newAsset.description}
                  onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
                  placeholder="Deskripsi singkat tentang asset ini..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleAddAsset}
                disabled={!newAsset.assetName || !newAsset.url || saving}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Tambah Asset
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
