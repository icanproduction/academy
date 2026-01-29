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
  BookOpen,
  Building2,
  Package,
  Users,
  Target,
  MoreHorizontal,
  GripVertical,
  Check,
  AlertCircle,
} from "lucide-react";

interface KnowledgeBankItem {
  id: string;
  title: string;
  content: string;
  category: "Brand" | "Product" | "Audience" | "Competitor" | "Other";
  priority: number;
  includeInBrief: boolean;
  isActive: boolean;
}

const categoryConfig = {
  Brand: { icon: Building2, color: "bg-blue-100 text-blue-700", label: "Brand" },
  Product: { icon: Package, color: "bg-green-100 text-green-700", label: "Produk" },
  Audience: { icon: Users, color: "bg-purple-100 text-purple-700", label: "Audience" },
  Competitor: { icon: Target, color: "bg-orange-100 text-orange-700", label: "Kompetitor" },
  Other: { icon: MoreHorizontal, color: "bg-gray-100 text-gray-700", label: "Lainnya" },
};

export default function KnowledgeBankPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [items, setItems] = useState<KnowledgeBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState("");

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "Brand" as KnowledgeBankItem["category"],
    priority: 1,
    includeInBrief: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    try {
      // Fetch client info
      const clientRes = await fetch(`/api/clients/${clientId}`);
      if (clientRes.ok) {
        const client = await clientRes.json();
        setClientName(client.businessName);
      }

      // Fetch knowledge bank items
      const res = await fetch(`/api/clients/${clientId}/knowledge-bank`);
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
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
        ? `/api/clients/${clientId}/knowledge-bank/${editingId}`
        : `/api/clients/${clientId}/knowledge-bank`;

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

  const handleEdit = (item: KnowledgeBankItem) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      content: item.content,
      category: item.category,
      priority: item.priority,
      includeInBrief: item.includeInBrief,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus item ini?")) return;

    try {
      const res = await fetch(`/api/clients/${clientId}/knowledge-bank/${id}`, {
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
      title: "",
      content: "",
      category: "Brand",
      priority: 1,
      includeInBrief: true,
    });
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, KnowledgeBankItem[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                <BookOpen className="w-6 h-6 text-blue-600" />
                Knowledge Bank
              </h1>
              <p className="text-slate-600">{clientName}</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Knowledge
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              Knowledge Bank berisi informasi penting tentang brand yang akan digunakan AI untuk generate brief.
              Tandai item dengan "Include in Brief" untuk menyertakan dalam context AI.
            </p>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-800">
                  {editingId ? "Edit Knowledge" : "Tambah Knowledge Baru"}
                </h2>
                <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Judul</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Contoh: Brand Story, Core Values, dll"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Brand">Brand</option>
                    <option value="Product">Produk</option>
                    <option value="Audience">Audience</option>
                    <option value="Competitor">Kompetitor</option>
                    <option value="Other">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Konten</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[150px]"
                    placeholder="Tulis informasi detail yang akan digunakan AI..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prioritas</label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">Angka kecil = prioritas tinggi</p>
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.includeInBrief}
                        onChange={(e) => setFormData({ ...formData, includeInBrief: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Include in Brief</span>
                    </label>
                  </div>
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
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">Belum ada Knowledge</h3>
            <p className="text-slate-500 mb-4">Tambahkan informasi brand untuk membantu AI generate brief yang lebih akurat</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Knowledge Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(categoryConfig).map(([category, config]) => {
              const categoryItems = groupedItems[category] || [];
              if (categoryItems.length === 0) return null;

              const Icon = config.icon;
              return (
                <div key={category} className="bg-white rounded-2xl overflow-hidden">
                  <div className={`px-6 py-3 ${config.color} flex items-center gap-2`}>
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{config.label}</span>
                    <span className="text-sm opacity-75">({categoryItems.length})</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {categoryItems.sort((a, b) => a.priority - b.priority).map((item) => (
                      <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-slate-800">{item.title}</h4>
                              {item.includeInBrief && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                  <Check className="w-3 h-3" />
                                  In Brief
                                </span>
                              )}
                              <span className="text-xs text-slate-400">Priority: {item.priority}</span>
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-2">{item.content}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
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
