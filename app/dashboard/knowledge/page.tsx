"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface KnowledgeStats {
  hasICP: boolean;
  audienceCount: number;
  productsCount: number;
  pillarsCount: number;
}

export default function KnowledgeBankPage() {
  const [stats, setStats] = useState<KnowledgeStats>({
    hasICP: false,
    audienceCount: 0,
    productsCount: 0,
    pillarsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("ican_session");
    if (stored) {
      const sess = JSON.parse(stored);
      setSession(sess);
      fetchStats(sess.id);
    }
  }, []);

  const fetchStats = async (clientId: string) => {
    try {
      const [icpRes, audienceRes, productsRes, pillarsRes] = await Promise.all([
        fetch(`/api/clients/${clientId}/icp`),
        fetch(`/api/clients/${clientId}/audience`),
        fetch(`/api/clients/${clientId}/products`),
        fetch(`/api/pillars?clientId=${clientId}`),
      ]);

      const [icpData, audienceData, productsData, pillarsData] = await Promise.all([
        icpRes.json(),
        audienceRes.json(),
        productsRes.json(),
        pillarsRes.json(),
      ]);

      setStats({
        hasICP: !!icpData.data,
        audienceCount: audienceData.data?.length || 0,
        productsCount: Array.isArray(productsData) ? productsData.length : 0,
        pillarsCount: Array.isArray(pillarsData) ? pillarsData.length : 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const completionPercentage = () => {
    let completed = 0;
    if (stats.hasICP) completed++;
    if (stats.audienceCount > 0) completed++;
    if (stats.productsCount > 0) completed++;
    if (stats.pillarsCount > 0) completed++;
    return Math.round((completed / 4) * 100);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Knowledge Bank</h1>
        <p className="text-gray-600 mt-1">
          Data brand kamu yang akan membantu AI membuat konten yang lebih relevan
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Kelengkapan Data</span>
          <span className="text-sm font-semibold text-blue-600">{completionPercentage()}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage()}%` }}
          ></div>
        </div>
        {completionPercentage() < 100 && (
          <p className="text-sm text-gray-500 mt-3">
            Lengkapi data Knowledge Bank untuk hasil AI yang lebih akurat
          </p>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ICP Card */}
        <Link href="/dashboard/knowledge/icp">
          <div className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">
                🎯
              </div>
              {stats.hasICP ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Lengkap
                </span>
              ) : (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                  Belum diisi
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mt-4 group-hover:text-blue-600 transition-colors">
              Ideal Customer Profile (ICP)
            </h3>
            <p className="text-gray-500 text-sm mt-2">
              Profile customer ideal kamu: demografi, psikografi, pain points, dan goals
            </p>
            <div className="mt-4 text-blue-600 text-sm font-medium flex items-center gap-1">
              {stats.hasICP ? "Lihat Detail" : "Isi Sekarang"}
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Target Audience Card */}
        <Link href="/dashboard/knowledge/audience">
          <div className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                👥
              </div>
              {stats.audienceCount > 0 ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  {stats.audienceCount} segment
                </span>
              ) : (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                  Belum diisi
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mt-4 group-hover:text-blue-600 transition-colors">
              Target Audience
            </h3>
            <p className="text-gray-500 text-sm mt-2">
              Segment audience kamu: karakteristik, interest, dan preferensi konten
            </p>
            <div className="mt-4 text-blue-600 text-sm font-medium flex items-center gap-1">
              Lihat Detail
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Products Card */}
        <Link href="/dashboard/knowledge/products">
          <div className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                📦
              </div>
              {stats.productsCount > 0 ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  {stats.productsCount} produk
                </span>
              ) : (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                  Belum diisi
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mt-4 group-hover:text-blue-600 transition-colors">
              Products / Services
            </h3>
            <p className="text-gray-500 text-sm mt-2">
              Daftar produk atau jasa kamu: deskripsi, benefit, dan harga
            </p>
            <div className="mt-4 text-blue-600 text-sm font-medium flex items-center gap-1">
              {stats.productsCount > 0 ? "Kelola Produk" : "Tambah Produk"}
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Pillars Card */}
        <Link href="/dashboard/knowledge/pillars">
          <div className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">
                📊
              </div>
              {stats.pillarsCount > 0 ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  {stats.pillarsCount} pilar
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                  Dikelola Admin
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mt-4 group-hover:text-blue-600 transition-colors">
              Content Pillars
            </h3>
            <p className="text-gray-500 text-sm mt-2">
              Pilar konten yang sudah disetup oleh tim iCAN untuk brand kamu
            </p>
            <div className="mt-4 text-blue-600 text-sm font-medium flex items-center gap-1">
              Lihat Detail
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
        <div className="flex gap-4">
          <div className="text-2xl">💡</div>
          <div>
            <h4 className="font-semibold text-blue-900">Kenapa Knowledge Bank penting?</h4>
            <p className="text-blue-700 text-sm mt-1">
              Semakin lengkap data Knowledge Bank, semakin relevan dan akurat konten yang dihasilkan AI.
              AI akan memahami brand kamu lebih baik dan membuat hook, caption, dan struktur konten yang sesuai.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
