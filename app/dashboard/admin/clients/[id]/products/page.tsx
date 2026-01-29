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
  Package,
  Star,
  DollarSign,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface ClientProduct {
  id: string;
  productName: string;
  category: "Product" | "Service" | "Package";
  description: string;
  keyBenefits: string;
  priceType: "Fixed" | "Range" | "Starting From";
  priceMin: number;
  priceMax: number;
  usp: string;
  isFeatured: boolean;
  isActive: boolean;
}

export default function ProductsPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [products, setProducts] = useState<ClientProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    productName: "",
    category: "Product" as ClientProduct["category"],
    description: "",
    keyBenefits: "",
    priceType: "Fixed" as ClientProduct["priceType"],
    priceMin: 0,
    priceMax: 0,
    usp: "",
    isFeatured: false,
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

      const res = await fetch(`/api/clients/${clientId}/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
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
        ? `/api/clients/${clientId}/products/${editingId}`
        : `/api/clients/${clientId}/products`;

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

  const handleEdit = (product: ClientProduct) => {
    setEditingId(product.id);
    setFormData({
      productName: product.productName,
      category: product.category,
      description: product.description,
      keyBenefits: product.keyBenefits,
      priceType: product.priceType,
      priceMin: product.priceMin,
      priceMax: product.priceMax,
      usp: product.usp,
      isFeatured: product.isFeatured,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus produk ini?")) return;

    try {
      const res = await fetch(`/api/clients/${clientId}/products/${id}`, {
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
      productName: "",
      category: "Product",
      description: "",
      keyBenefits: "",
      priceType: "Fixed",
      priceMin: 0,
      priceMax: 0,
      usp: "",
      isFeatured: false,
    });
  };

  const formatPrice = (product: ClientProduct) => {
    const format = (n: number) => {
      if (n >= 1000000) return `Rp${(n / 1000000).toFixed(1)}jt`;
      if (n >= 1000) return `Rp${(n / 1000).toFixed(0)}K`;
      return `Rp${n.toLocaleString()}`;
    };

    if (product.priceType === "Range" && product.priceMax > product.priceMin) {
      return `${format(product.priceMin)} - ${format(product.priceMax)}`;
    }
    if (product.priceType === "Starting From") {
      return `Mulai ${format(product.priceMin)}`;
    }
    return format(product.priceMin);
  };

  const categoryColors = {
    Product: "bg-blue-100 text-blue-700",
    Service: "bg-purple-100 text-purple-700",
    Package: "bg-green-100 text-green-700",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
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
                <Package className="w-6 h-6 text-orange-600" />
                Products & Services
              </h1>
              <p className="text-slate-600">{clientName}</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk
          </button>
        </div>

        {/* Info */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
          <div>
            <p className="text-sm text-orange-800">
              Produk yang ditandai "Featured" akan diprioritaskan dalam AI brief generation.
              Pastikan USP dan key benefits diisi dengan detail.
            </p>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-800">
                  {editingId ? "Edit Produk" : "Tambah Produk Baru"}
                </h2>
                <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Produk</label>
                    <input
                      type="text"
                      value={formData.productName}
                      onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Nama produk/jasa"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="Product">Produk</option>
                      <option value="Service">Jasa/Service</option>
                      <option value="Package">Paket</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-h-[80px]"
                    placeholder="Deskripsi singkat produk/jasa..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Key Benefits</label>
                  <textarea
                    value={formData.keyBenefits}
                    onChange={(e) => setFormData({ ...formData, keyBenefits: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-h-[80px]"
                    placeholder="Manfaat utama bagi pelanggan..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">USP (Unique Selling Point)</label>
                  <textarea
                    value={formData.usp}
                    onChange={(e) => setFormData({ ...formData, usp: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-h-[80px]"
                    placeholder="Apa yang membuat produk ini berbeda dari kompetitor..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Harga</label>
                    <select
                      value={formData.priceType}
                      onChange={(e) => setFormData({ ...formData, priceType: e.target.value as any })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="Fixed">Fixed Price</option>
                      <option value="Range">Range</option>
                      <option value="Starting From">Mulai Dari</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Harga Min</label>
                    <input
                      type="number"
                      value={formData.priceMin}
                      onChange={(e) => setFormData({ ...formData, priceMin: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Harga Max</label>
                    <input
                      type="number"
                      value={formData.priceMax}
                      onChange={(e) => setFormData({ ...formData, priceMax: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="0"
                      disabled={formData.priceType !== "Range"}
                    />
                  </div>
                </div>

                <div className="flex items-center pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-slate-700 flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      Jadikan Featured Product
                    </span>
                  </label>
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
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
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
        {products.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">Belum ada Produk</h3>
            <p className="text-slate-500 mb-4">Tambahkan produk atau jasa yang ditawarkan client</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Produk Pertama
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {products
              .sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0))
              .map((product) => (
                <div
                  key={product.id}
                  className={`bg-white rounded-2xl p-6 ${product.isFeatured ? "ring-2 ring-yellow-400" : ""}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${product.isFeatured ? "bg-yellow-100" : "bg-orange-100"}`}>
                        <Package className={`w-5 h-5 ${product.isFeatured ? "text-yellow-600" : "text-orange-600"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800">{product.productName}</h3>
                          {product.isFeatured && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[product.category]}`}>
                            {product.category}
                          </span>
                          <span className="text-sm font-medium text-green-600">{formatPrice(product)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 mb-3">{product.description}</p>

                  {product.usp && (
                    <div className="flex items-start gap-2 text-sm bg-orange-50 p-3 rounded-lg">
                      <Sparkles className="w-4 h-4 text-orange-500 mt-0.5" />
                      <div>
                        <span className="font-medium text-orange-700">USP: </span>
                        <span className="text-orange-600">{product.usp}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
