"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Product {
  id: string;
  productName: string;
  category: string;
  description: string;
  keyBenefits: string;
  priceType: string;
  priceMin: number;
  priceMax: number;
  usp: string;
  isFeatured: boolean;
  isActive: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("ican_session");
    if (stored) {
      const sess = JSON.parse(stored);
      setSession(sess);
      fetchProducts(sess.id);
    }
  }, []);

  const fetchProducts = async (clientId: string) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/products`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Yakin ingin menghapus produk ini?")) return;

    try {
      const res = await fetch(`/api/clients/${session.id}/products/${productId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProducts(products.filter((p) => p.id !== productId));
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard/knowledge" className="hover:text-blue-600">
          Knowledge Bank
        </Link>
        <span>/</span>
        <span className="text-gray-900">Products</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products / Services</h1>
          <p className="text-gray-600 mt-1">
            Kelola daftar produk atau jasa yang kamu tawarkan
          </p>
        </div>
        <Link
          href="/dashboard/knowledge/products/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Produk
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Belum Ada Produk
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Tambahkan produk atau jasa kamu agar AI bisa menyarankan konten yang relevan dengan offering kamu
          </p>
          <Link
            href="/dashboard/knowledge/products/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Produk Pertama
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{product.productName}</h3>
                    {product.isFeatured && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 capitalize">{product.category}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/dashboard/knowledge/products/${product.id}/edit`}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {product.description && (
                <p className="text-gray-600 text-sm mt-3 line-clamp-2">
                  {product.description}
                </p>
              )}

              {product.keyBenefits && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Key Benefits:</p>
                  <p className="text-sm text-gray-700 line-clamp-2">{product.keyBenefits}</p>
                </div>
              )}

              <div className="mt-4 pt-3 border-t flex items-center justify-between">
                <div>
                  {product.priceMin > 0 && (
                    <span className="text-sm font-medium text-green-600">
                      {product.priceType === "Range" && product.priceMax > product.priceMin
                        ? `${formatPrice(product.priceMin)} - ${formatPrice(product.priceMax)}`
                        : formatPrice(product.priceMin)}
                    </span>
                  )}
                </div>
                {product.usp && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {product.usp.length > 30 ? product.usp.substring(0, 30) + "..." : product.usp}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Back Button */}
      <div className="mt-8">
        <Link
          href="/dashboard/knowledge"
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Knowledge Bank
        </Link>
      </div>
    </div>
  );
}
