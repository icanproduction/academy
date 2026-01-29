"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ICP {
  id: string;
  demographics: string;
  psychographics: string;
  painPoints: string;
  goals: string;
  objections: string;
  whereTheyHangOut: string;
  buyingBehavior: string;
  notes: string;
}

export default function ICPPage() {
  const router = useRouter();
  const [icp, setICP] = useState<ICP | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("ican_session");
    if (stored) {
      const sess = JSON.parse(stored);
      setSession(sess);
      fetchICP(sess.id);
    }
  }, []);

  const fetchICP = async (clientId: string) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/icp`);
      const data = await res.json();
      if (data.success && data.data) {
        setICP(data.data);
      }
    } catch (error) {
      console.error("Error fetching ICP:", error);
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
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const InfoSection = ({ emoji, title, content }: { emoji: string; title: string; content: string }) => (
    <div className="bg-white rounded-xl p-5 shadow-sm border">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xl">{emoji}</span>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      {content ? (
        <p className="text-gray-600 whitespace-pre-line">{content}</p>
      ) : (
        <p className="text-gray-400 italic">Belum diisi</p>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard/knowledge" className="hover:text-blue-600">
          Knowledge Bank
        </Link>
        <span>/</span>
        <span className="text-gray-900">ICP</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ideal Customer Profile (ICP)</h1>
          <p className="text-gray-600 mt-1">
            Profile customer ideal yang menjadi target utama brand kamu
          </p>
        </div>
        {session?.role === "admin" && (
          <Link
            href={`/dashboard/admin/clients/${session?.id}/icp/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit ICP
          </Link>
        )}
      </div>

      {!icp ? (
        <div className="bg-yellow-50 rounded-xl p-8 text-center border border-yellow-100">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            ICP Belum Diisi
          </h3>
          <p className="text-yellow-700 mb-4">
            Tim iCAN akan membantu mengisi data ICP berdasarkan informasi brand kamu.
            Hubungi tim iCAN jika kamu ingin mempercepat proses ini.
          </p>
          {session?.role === "admin" && (
            <Link
              href={`/dashboard/admin/clients/${session?.id}/icp/edit`}
              className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Isi ICP Sekarang
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <InfoSection
            emoji="👤"
            title="Demographics"
            content={icp.demographics}
          />
          <InfoSection
            emoji="🧠"
            title="Psychographics"
            content={icp.psychographics}
          />
          <InfoSection
            emoji="😰"
            title="Pain Points"
            content={icp.painPoints}
          />
          <InfoSection
            emoji="🎯"
            title="Goals & Aspirations"
            content={icp.goals}
          />
          <InfoSection
            emoji="🤔"
            title="Common Objections"
            content={icp.objections}
          />
          <InfoSection
            emoji="📱"
            title="Where They Hang Out"
            content={icp.whereTheyHangOut}
          />
          <InfoSection
            emoji="💳"
            title="Buying Behavior"
            content={icp.buyingBehavior}
          />
          {icp.notes && (
            <InfoSection
              emoji="📝"
              title="Additional Notes"
              content={icp.notes}
            />
          )}
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
