"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { value: "skincare", label: "Skincare" },
  { value: "makeup", label: "Makeup" },
  { value: "bodycare", label: "Bodycare" },
  { value: "haircare", label: "Haircare" },
  { value: "service", label: "Service/Jasa" },
  { value: "digital", label: "Digital Product" },
  { value: "physical", label: "Physical Product" },
  { value: "other", label: "Lainnya" },
];

export default function NewProductPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    productName: "",
    category: "other",
    description: "",
    keyBenefits: "",
    priceType: "Fixed",
    priceMin: "",
    priceMax: "",
    usp: "",
    isFeatured: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem("ican_session");
    if (stored) {
      setSession(JSON.parse(stored));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${session.id}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          priceMin: parseInt(form.priceMin) || 0,
          priceMax: parseInt(form.priceMax) || 0,
        }),
      });

      if (res.ok) {
        router.push("/dashboard/knowledge/products");
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menyimpan produk");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard/knowledge" className="hover:text-blue-600">
          Knowledge Bank
        </Link>
        <span>/</span>
        <Link href="/dashboard/knowledge/products" className="hover:text-blue-600">
          Products
        </Link>
        <span>/</span>
        <span className="text-gray-900">Tambah Baru</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tambah Produk Baru</h1>
        <p className="text-gray-600 mt-1">
          Isi informasi produk atau jasa yang kamu tawarkan
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nama Produk / Jasa <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.productName}
            onChange={(e) => setForm({ ...form, productName: e.target.value })}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Contoh: Brightening Serum, Konsultasi Marketing, dll"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kategori
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deskripsi
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Jelaskan produk/jasa kamu secara singkat"
          />
        </div>

        {/* Key Benefits */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Key Benefits
          </label>
          <textarea
            value={form.keyBenefits}
            onChange={(e) => setForm({ ...form, keyBenefits: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Apa benefit utama produk ini untuk customer? (pisahkan dengan koma atau baris baru)"
          />
        </div>

        {/* Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Harga
            </label>
            <select
              value={form.priceType}
              onChange={(e) => setForm({ ...form, priceType: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Fixed">Harga Tetap</option>
              <option value="Range">Range Harga</option>
              <option value="Custom">Harga Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Harga (Rp)
            </label>
            <input
              type="number"
              value={form.priceMin}
              onChange={(e) => setForm({ ...form, priceMin: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>
        </div>

        {form.priceType === "Range" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Harga Maksimum (Rp)
            </label>
            <input
              type="number"
              value={form.priceMax}
              onChange={(e) => setForm({ ...form, priceMax: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>
        )}

        {/* USP */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Unique Selling Point (USP)
          </label>
          <input
            type="text"
            value={form.usp}
            onChange={(e) => setForm({ ...form, usp: e.target.value })}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Apa yang membedakan produk ini dari kompetitor?"
          />
        </div>

        {/* Featured */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isFeatured"
            checked={form.isFeatured}
            onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isFeatured" className="text-sm text-gray-700">
            Tandai sebagai produk unggulan (featured)
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={saving || !form.productName}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Menyimpan..." : "Simpan Produk"}
          </button>
          <Link
            href="/dashboard/knowledge/products"
            className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
