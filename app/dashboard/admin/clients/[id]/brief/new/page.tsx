"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Target,
  Package,
  MessageSquare,
  Link as LinkIcon,
  Clock,
  FileText,
  Loader2,
  CheckCircle,
} from "lucide-react";

interface ContentPillar {
  id: string;
  name: string;
  emoji: string;
  description: string;
  targetEmotion?: string;
  hookStyles?: string[];
  ctaType?: string;
}

interface Product {
  id: string;
  productName: string;
  priceMin: number;
  priceMax: number;
  priceType: string;
  isFeatured: boolean;
}

interface Client {
  id: string;
  businessName: string;
}

type Step = 1 | 2 | 3;

export default function NewBriefPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Data
  const [client, setClient] = useState<Client | null>(null);
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Form data
  const [selectedPillar, setSelectedPillar] = useState<string>("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [topic, setTopic] = useState("");
  const [keyMessage, setKeyMessage] = useState("");
  const [duration, setDuration] = useState<"15-30s" | "30-60s" | "60-90s">("15-30s");
  const [referenceLinks, setReferenceLinks] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [clientRes, pillarsRes, productsRes] = await Promise.all([
          fetch(`/api/clients/${clientId}`),
          fetch(`/api/pillars?clientId=${clientId}`),
          fetch(`/api/clients/${clientId}/products?isActive=true`),
        ]);

        if (clientRes.ok) {
          const data = await clientRes.json();
          setClient(data);
        }
        if (pillarsRes.ok) {
          const data = await pillarsRes.json();
          setPillars(Array.isArray(data) ? data : []);
        }
        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [clientId]);

  const formatPrice = (priceMin: number, priceMax: number, priceType: string) => {
    const format = (n: number) => {
      if (n >= 1000000) return `Rp${(n / 1000000).toFixed(1)}jt`;
      if (n >= 1000) return `Rp${Math.floor(n / 1000)}K`;
      return `Rp${n}`;
    };

    if (priceType === "Range" && priceMax > priceMin) {
      return `${format(priceMin)} - ${format(priceMax)}`;
    }
    return format(priceMin);
  };

  const handleGenerate = async () => {
    if (!selectedPillar || !topic || !keyMessage) return;

    try {
      setGenerating(true);

      const res = await fetch(`/api/clients/${clientId}/briefs/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pillarId: selectedPillar,
          productIds: selectedProducts,
          topic,
          keyMessage,
          duration,
          referenceLinks,
          notes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard/admin/clients/${clientId}/brief/${data.briefId}`);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to generate brief"}`);
      }
    } catch (error) {
      console.error("Error generating brief:", error);
      alert("Failed to generate brief");
    } finally {
      setGenerating(false);
    }
  };

  const canProceedStep1 = selectedPillar !== "";
  const canProceedStep2 = topic.trim() !== "" && keyMessage.trim() !== "";
  const canGenerate = canProceedStep1 && canProceedStep2;

  const selectedPillarData = pillars.find((p) => p.id === selectedPillar);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/admin/clients/${clientId}`}
          className="inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke {client?.businessName || "Client"}
        </Link>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center shadow-lg shadow-accent/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">New Reels Brief</h1>
            <p className="text-slate-500">Generate brief dengan AI untuk {client?.businessName}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${((step) / 3) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span className={step >= 1 ? "text-accent font-medium" : ""}>Pillar & Product</span>
            <span className={step >= 2 ? "text-accent font-medium" : ""}>Topic & Message</span>
            <span className={step >= 3 ? "text-accent font-medium" : ""}>Review & Generate</span>
          </div>
        </div>
      </div>

      {/* Step 1: Pillar & Product */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          {/* Pillar Selection */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              Pilih Content Pillar <span className="text-red-500">*</span>
            </h2>

            {pillars.length > 0 ? (
              <div className="space-y-3">
                {pillars.map((pillar) => (
                  <button
                    key={pillar.id}
                    onClick={() => setSelectedPillar(pillar.id)}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 text-left transition-all",
                      selectedPillar === pillar.id
                        ? "border-accent bg-accent/5"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{pillar.emoji || "📌"}</span>
                        <div>
                          <p className="font-semibold">{pillar.name}</p>
                          <p className="text-xs text-slate-500">
                            {pillar.targetEmotion || "Educate"} • Hook: {pillar.hookStyles?.join(", ") || "Various"} • CTA: {pillar.ctaType || "Follow"}
                          </p>
                        </div>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        selectedPillar === pillar.id
                          ? "border-accent bg-accent"
                          : "border-slate-300"
                      )}>
                        {selectedPillar === pillar.id && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Target className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Belum ada content pillars</p>
                <Link href={`/dashboard/admin/clients/${clientId}/pillars`} className="text-accent hover:underline text-sm">
                  Setup pillars terlebih dahulu
                </Link>
              </div>
            )}
          </div>

          {/* Product Selection */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-accent" />
              Produk yang Di-highlight <span className="text-slate-400 font-normal text-sm">(opsional)</span>
            </h2>

            {products.length > 0 ? (
              <div className="space-y-2">
                {products.map((product) => (
                  <label
                    key={product.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all",
                      selectedProducts.includes(product.id)
                        ? "bg-accent/10 border border-accent/30"
                        : "bg-slate-50 hover:bg-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts([...selectedProducts, product.id]);
                          } else {
                            setSelectedProducts(selectedProducts.filter((id) => id !== product.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent"
                      />
                      <span className="font-medium">{product.productName}</span>
                      {product.isFeatured && (
                        <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">Featured</span>
                      )}
                    </div>
                    <span className="text-sm text-slate-500">
                      {formatPrice(product.priceMin, product.priceMax, product.priceType)}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-sm">
                Belum ada products
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                canProceedStep1
                  ? "bg-accent hover:bg-accent-hover text-white"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Topic & Message */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-accent" />
              Topik / Angle <span className="text-red-500">*</span>
            </h2>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              placeholder="Contoh: Proses roasting kopi dari green bean sampai siap seduh, behind the scene di roastery kita"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
            />
            <p className="text-xs text-slate-400 mt-2">
              💡 Jelaskan topik atau sudut pandang konten yang ingin dibuat
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" />
              Key Message <span className="text-red-500">*</span>
            </h2>
            <textarea
              value={keyMessage}
              onChange={(e) => setKeyMessage(e.target.value)}
              rows={2}
              placeholder="Pesan utama yang HARUS tersampaikan. Contoh: Kopi Nusantara roasting fresh setiap minggu, bukan kopi lama di gudang"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
            />
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              Target Durasi
            </h2>
            <div className="flex gap-3">
              {(["15-30s", "30-60s", "60-90s"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-medium transition-all",
                    duration === d
                      ? "bg-accent text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canProceedStep2}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                canProceedStep2
                  ? "bg-accent hover:bg-accent-hover text-white"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Generate */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in">
          {/* Reference Links */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-accent" />
              Link Referensi <span className="text-slate-400 font-normal text-sm">(opsional)</span>
            </h2>
            <input
              type="url"
              value={referenceLinks}
              onChange={(e) => setReferenceLinks(e.target.value)}
              placeholder="https://instagram.com/reel/xyz123"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
            <p className="text-xs text-slate-400 mt-2">
              💡 Link Reels kompetitor atau style yang disukai
            </p>
          </div>

          {/* Notes */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-bold mb-4">Catatan Tambahan <span className="text-slate-400 font-normal text-sm">(opsional)</span></h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Catatan atau request khusus untuk brief ini"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
            />
          </div>

          {/* Review Summary */}
          <div className="glass-card rounded-2xl p-6 bg-slate-50">
            <h2 className="font-bold mb-4">📋 Review</h2>
            <div className="space-y-3 text-sm">
              <div className="flex">
                <span className="w-32 text-slate-500">Pillar</span>
                <span className="font-medium">
                  {selectedPillarData?.emoji} {selectedPillarData?.name}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500">Products</span>
                <span className="font-medium">
                  {selectedProducts.length > 0
                    ? products.filter((p) => selectedProducts.includes(p.id)).map((p) => p.productName).join(", ")
                    : "-"}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500">Topic</span>
                <span className="font-medium line-clamp-1">{topic}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500">Key Message</span>
                <span className="font-medium line-clamp-1">{keyMessage}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500">Duration</span>
                <span className="font-medium">{duration}</span>
              </div>
              {referenceLinks && (
                <div className="flex">
                  <span className="w-32 text-slate-500">Reference</span>
                  <span className="font-medium text-accent">1 link</span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className={cn(
                "flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-all",
                canGenerate && !generating
                  ? "bg-gradient-to-r from-accent to-blue-600 text-white shadow-lg shadow-accent/30 hover:shadow-xl"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Brief
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
