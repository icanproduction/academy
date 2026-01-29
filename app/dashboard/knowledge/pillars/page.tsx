"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Pillar {
  id: string;
  name: string;
  emoji: string;
  description: string;
  targetRatio: number;
  color: string;
  examples: string;
  dos: string;
  donts: string;
}

const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
  pink: { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700" },
  yellow: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
  red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
  gray: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700" },
};

export default function PillarsPage() {
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("ican_session");
    if (stored) {
      const sess = JSON.parse(stored);
      setSession(sess);
      fetchPillars(sess.id);
    }
  }, []);

  const fetchPillars = async (clientId: string) => {
    try {
      const res = await fetch(`/api/pillars?clientId=${clientId}`);
      const data = await res.json();
      // Handle both { success, data } format and direct array
      if (data.success && Array.isArray(data.data)) {
        setPillars(data.data);
      } else if (Array.isArray(data)) {
        setPillars(data);
      }
    } catch (error) {
      console.error("Error fetching pillars:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard/knowledge" className="hover:text-blue-600">
          Knowledge Bank
        </Link>
        <span>/</span>
        <span className="text-gray-900">Content Pillars</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Content Pillars</h1>
        <p className="text-gray-600 mt-1">
          Pilar konten yang sudah disetup oleh tim iCAN untuk strategi konten brand kamu
        </p>
      </div>

      {pillars.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Content Pillars Belum Disetup
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Tim iCAN akan membantu setup content pillars berdasarkan strategi brand kamu.
            Hubungi tim iCAN untuk mempercepat proses ini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pillars.map((pillar) => {
            const colors = colorClasses[pillar.color] || colorClasses.gray;
            const isExpanded = expandedId === pillar.id;

            return (
              <div
                key={pillar.id}
                className={`rounded-xl border-2 overflow-hidden transition-all ${colors.border} ${colors.bg}`}
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : pillar.id)}
                  className="w-full p-5 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{pillar.emoji}</div>
                    <div>
                      <h3 className={`font-semibold text-lg ${colors.text}`}>
                        {pillar.name}
                      </h3>
                      <p className="text-gray-600 text-sm mt-0.5">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${colors.text}`}>
                        {pillar.targetRatio}%
                      </div>
                      <div className="text-xs text-gray-500">target ratio</div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-5 pb-5 space-y-4 border-t border-white/50">
                    {pillar.examples && (
                      <div className="bg-white rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <span>💡</span> Contoh Konten
                        </h4>
                        <p className="text-gray-600 text-sm whitespace-pre-line">
                          {pillar.examples}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pillar.dos && (
                        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                          <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                            <span>✅</span> Do's
                          </h4>
                          <p className="text-green-700 text-sm whitespace-pre-line">
                            {pillar.dos}
                          </p>
                        </div>
                      )}

                      {pillar.donts && (
                        <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                          <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                            <span>❌</span> Don'ts
                          </h4>
                          <p className="text-red-700 text-sm whitespace-pre-line">
                            {pillar.donts}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Distribution Chart */}
      {pillars.length > 0 && (
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4">Distribusi Konten</h3>
          <div className="flex h-8 rounded-full overflow-hidden">
            {pillars.map((pillar, idx) => {
              const colors = colorClasses[pillar.color] || colorClasses.gray;
              return (
                <div
                  key={pillar.id}
                  className={`${colors.bg} ${colors.text} flex items-center justify-center text-xs font-medium`}
                  style={{ width: `${pillar.targetRatio}%` }}
                  title={`${pillar.name}: ${pillar.targetRatio}%`}
                >
                  {pillar.targetRatio >= 15 && `${pillar.targetRatio}%`}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            {pillars.map((pillar) => {
              const colors = colorClasses[pillar.color] || colorClasses.gray;
              return (
                <div key={pillar.id} className="flex items-center gap-2 text-sm">
                  <div className={`w-3 h-3 rounded-full ${colors.bg} border ${colors.border}`}></div>
                  <span className="text-gray-600">
                    {pillar.emoji} {pillar.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
        <p className="text-blue-700 text-sm">
          <span className="font-medium">💡 Info:</span> Content pillars dikelola oleh tim iCAN.
          Jika ada perubahan yang diperlukan, silakan hubungi tim iCAN.
        </p>
      </div>

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
