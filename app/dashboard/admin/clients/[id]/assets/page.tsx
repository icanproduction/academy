"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  FolderOpen,
  FileImage,
  Type,
  Palette,
  FileText,
  MoreHorizontal,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

interface ClientAsset {
  id: string;
  assetName: string;
  assetType: "Canva Template" | "Font" | "Logo" | "Guidelines" | "Other";
  url: string;
  description: string;
  isActive: boolean;
}

const assetTypeConfig = {
  "Canva Template": { icon: Palette, color: "bg-purple-100 text-purple-700" },
  Font: { icon: Type, color: "bg-blue-100 text-blue-700" },
  Logo: { icon: FileImage, color: "bg-green-100 text-green-700" },
  Guidelines: { icon: FileText, color: "bg-orange-100 text-orange-700" },
  Other: { icon: MoreHorizontal, color: "bg-gray-100 text-gray-700" },
};

export default function AssetsPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [assets, setAssets] = useState<ClientAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    assetName: "",
    assetType: "Canva Template" as ClientAsset["assetType"],
    url: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    try {
      const clientRes = await fetch(`/api/clients/${clientId}`);
      if (clientRes.ok) {
        const client = await clientRes.json();
        setClientName(client.businessName);
      }

      const res = await fetch(`/api/clients/${clientId}/assets`);
      if (res.ok) {
        const data = await res.json();
        setAssets(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingId
        ? `/api/clients/${clientId}/assets/${editingId}`
        : `/api/clients/${clientId}/assets`;

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchData();
        resetForm();
      }
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (asset: ClientAsset) => {
    setEditingId(asset.id);
    setFormData({
      assetName: asset.assetName,
      assetType: asset.assetType,
      url: asset.url,
      description: asset.description,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus asset ini?")) return;

    try {
      const res = await fetch(`/api/clients/${clientId}/assets/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      assetName: "",
      assetType: "Canva Template",
      url: "",
      description: "",
    });
  };

  const groupedAssets = assets.reduce((acc, asset) => {
    if (!acc[asset.assetType]) acc[asset.assetType] = [];
    acc[asset.assetType].push(asset);
    return acc;
  }, {} as Record<string, ClientAsset[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/admin/clients/${clientId}`}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <FolderOpen className="w-6 h-6 text-green-600" />
                Client Assets
              </h1>
              <p className="text-slate-600">{clientName}</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Asset
          </button>
        </div>

        {/* Info */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm text-green-800">
              Simpan link ke template Canva, font, logo, dan guidelines brand di sini.
              Asset ini akan muncul di brief untuk referensi tim produksi.
            </p>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-800">
                  {editingId ? "Edit Asset" : "Tambah Asset Baru"}
                </h2>
                <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Asset</label>
                  <input
                    type="text"
                    value={formData.assetName}
                    onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Contoh: Template Reels Promo"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Asset</label>
                  <select
                    value={formData.assetType}
                    onChange={(e) => setFormData({ ...formData, assetType: e.target.value as any })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="Canva Template">Canva Template</option>
                    <option value="Font">Font</option>
                    <option value="Logo">Logo</option>
                    <option value="Guidelines">Guidelines</option>
                    <option value="Other">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">URL</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="https://..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi (Opsional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 min-h-[80px]"
                    placeholder="Catatan tentang asset ini..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Simpan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Content */}
        {assets.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">Belum ada Asset</h3>
            <p className="text-slate-500 mb-4">Tambahkan link ke template, font, logo, dan guidelines brand</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Asset Pertama
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {Object.entries(assetTypeConfig).map(([type, config]) => {
              const typeAssets = groupedAssets[type] || [];
              if (typeAssets.length === 0) return null;

              const Icon = config.icon;
              return (
                <div key={type} className="bg-white rounded-2xl overflow-hidden">
                  <div className={`px-6 py-3 ${config.color} flex items-center gap-2`}>
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{type}</span>
                    <span className="text-sm opacity-75">({typeAssets.length})</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {typeAssets.map((asset) => (
                      <div key={asset.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-slate-800">{asset.assetName}</h4>
                              <a
                                href={asset.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-700"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                            {asset.description && (
                              <p className="text-sm text-slate-500 mt-1">{asset.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-4">
                            <button
                              onClick={() => handleEdit(asset)}
                              className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(asset.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
