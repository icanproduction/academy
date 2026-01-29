"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Audience {
  id: string;
  segmentName: string;
  description: string;
  ageRange: string;
  gender: string;
  location: string;
  interests: string;
  painPoints: string;
  contentPreferences: string;
  activeHours: string;
  order: number;
}

export default function AudiencePage() {
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("ican_session");
    if (stored) {
      const sess = JSON.parse(stored);
      setSession(sess);
      fetchAudiences(sess.id);
    }
  }, []);

  const fetchAudiences = async (clientId: string) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/audience`);
      const data = await res.json();
      if (data.success && data.data) {
        setAudiences(data.data);
      }
    } catch (error) {
      console.error("Error fetching audiences:", error);
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
            {[1, 2].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
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
        <span className="text-gray-900">Target Audience</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Target Audience</h1>
          <p className="text-gray-600 mt-1">
            Segment audience yang menjadi target konten brand kamu
          </p>
        </div>
      </div>

      {audiences.length === 0 ? (
        <div className="bg-yellow-50 rounded-xl p-8 text-center border border-yellow-100">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            Target Audience Belum Diisi
          </h3>
          <p className="text-yellow-700">
            Tim iCAN akan membantu mendefinisikan target audience berdasarkan strategi brand kamu.
            Hubungi tim iCAN jika kamu ingin mempercepat proses ini.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {audiences.map((audience, idx) => (
            <div
              key={audience.id}
              className="bg-white rounded-xl p-6 shadow-sm border"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {audience.segmentName}
                    </h3>
                    <p className="text-gray-500 text-sm">{audience.description}</p>
                  </div>
                </div>
                {idx === 0 && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    Primary
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {audience.ageRange && (
                  <div className="flex items-start gap-2">
                    <span className="text-lg">🎂</span>
                    <div>
                      <p className="text-xs text-gray-500">Usia</p>
                      <p className="text-sm text-gray-700">{audience.ageRange}</p>
                    </div>
                  </div>
                )}

                {audience.gender && (
                  <div className="flex items-start gap-2">
                    <span className="text-lg">👤</span>
                    <div>
                      <p className="text-xs text-gray-500">Gender</p>
                      <p className="text-sm text-gray-700 capitalize">{audience.gender}</p>
                    </div>
                  </div>
                )}

                {audience.location && (
                  <div className="flex items-start gap-2">
                    <span className="text-lg">📍</span>
                    <div>
                      <p className="text-xs text-gray-500">Lokasi</p>
                      <p className="text-sm text-gray-700">{audience.location}</p>
                    </div>
                  </div>
                )}

                {audience.interests && (
                  <div className="flex items-start gap-2">
                    <span className="text-lg">💝</span>
                    <div>
                      <p className="text-xs text-gray-500">Interests</p>
                      <p className="text-sm text-gray-700">{audience.interests}</p>
                    </div>
                  </div>
                )}

                {audience.painPoints && (
                  <div className="flex items-start gap-2">
                    <span className="text-lg">😰</span>
                    <div>
                      <p className="text-xs text-gray-500">Pain Points</p>
                      <p className="text-sm text-gray-700">{audience.painPoints}</p>
                    </div>
                  </div>
                )}

                {audience.contentPreferences && (
                  <div className="flex items-start gap-2">
                    <span className="text-lg">📱</span>
                    <div>
                      <p className="text-xs text-gray-500">Content Preferences</p>
                      <p className="text-sm text-gray-700">{audience.contentPreferences}</p>
                    </div>
                  </div>
                )}

                {audience.activeHours && (
                  <div className="flex items-start gap-2">
                    <span className="text-lg">⏰</span>
                    <div>
                      <p className="text-xs text-gray-500">Active Hours</p>
                      <p className="text-sm text-gray-700">{audience.activeHours}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
        <p className="text-blue-700 text-sm">
          <span className="font-medium">💡 Info:</span> Target audience dikelola oleh tim iCAN.
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
