"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Film,
  Images,
  Smartphone,
  Instagram,
  Check,
  Link as LinkIcon,
  Sparkles,
  Package,
  Lightbulb,
  PenLine,
  Loader2,
  RefreshCw,
} from "lucide-react";

type ContentType = "reels" | "carousel" | "story";
type Platform = "instagram" | "tiktok";
type TopicMode = "own" | "ai" | null;

interface FormData {
  contentType: ContentType | null;
  platforms: Platform[];
  pillarId: string;
  productIds: string[];
  topicMode: TopicMode;
  selectedTopicId: string | null;
  title: string;
  description: string;
  referenceLinks: string;
}

interface Pillar {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  targetRatio: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
}

interface TopicSuggestion {
  id: string;
  title: string;
  description: string;
  angle: string;
}

const PILLAR_COLORS: Record<string, string> = {
  blue: "border-blue-300 bg-blue-50 hover:border-blue-400",
  green: "border-green-300 bg-green-50 hover:border-green-400",
  orange: "border-orange-300 bg-orange-50 hover:border-orange-400",
  purple: "border-purple-300 bg-purple-50 hover:border-purple-400",
  pink: "border-pink-300 bg-pink-50 hover:border-pink-400",
  yellow: "border-yellow-300 bg-yellow-50 hover:border-yellow-400",
  red: "border-red-300 bg-red-50 hover:border-red-400",
  gray: "border-gray-300 bg-gray-50 hover:border-gray-400",
};

const PILLAR_SELECTED: Record<string, string> = {
  blue: "border-blue-500 bg-blue-100 ring-2 ring-blue-500/20",
  green: "border-green-500 bg-green-100 ring-2 ring-green-500/20",
  orange: "border-orange-500 bg-orange-100 ring-2 ring-orange-500/20",
  purple: "border-purple-500 bg-purple-100 ring-2 ring-purple-500/20",
  pink: "border-pink-500 bg-pink-100 ring-2 ring-pink-500/20",
  yellow: "border-yellow-500 bg-yellow-100 ring-2 ring-yellow-500/20",
  red: "border-red-500 bg-red-100 ring-2 ring-red-500/20",
  gray: "border-gray-500 bg-gray-100 ring-2 ring-gray-500/20",
};

export default function NewContentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [session, setSession] = useState<any>(null);
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // AI Topics state
  const [topicSuggestions, setTopicSuggestions] = useState<TopicSuggestion[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [topicsGenerated, setTopicsGenerated] = useState(false);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [cachedContext, setCachedContext] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    contentType: null,
    platforms: [],
    pillarId: "",
    productIds: [],
    topicMode: null,
    selectedTopicId: null,
    title: "",
    description: "",
    referenceLinks: "",
  });

  const totalSteps = 5;

  useEffect(() => {
    const stored = localStorage.getItem("ican_session");
    if (stored) {
      const sess = JSON.parse(stored);
      setSession(sess);
      fetchData(sess.id);
    }
  }, []);

  const fetchData = async (clientId: string) => {
    try {
      // Fetch pillars and products in parallel
      const [pillarsRes, productsRes] = await Promise.all([
        fetch(`/api/pillars?clientId=${clientId}`),
        fetch(`/api/client-products?clientId=${clientId}`),
      ]);

      const pillarsData = await pillarsRes.json();
      if (pillarsData.success && Array.isArray(pillarsData.data)) {
        setPillars(pillarsData.data);
      } else if (Array.isArray(pillarsData)) {
        setPillars(pillarsData);
      }

      const productsData = await productsRes.json();
      // Map productName to name for consistency
      const mapProduct = (p: any): Product => ({
        id: p.id,
        name: p.productName || p.name || "",
        category: p.category || "",
        description: p.description || "",
        price: p.priceMin ? `Rp ${p.priceMin.toLocaleString()}` : "",
      });

      if (productsData.success && Array.isArray(productsData.data)) {
        setProducts(productsData.data.map(mapProduct));
      } else if (Array.isArray(productsData)) {
        setProducts(productsData.map(mapProduct));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate AI topic suggestions
  const generateTopicSuggestions = useCallback(async () => {
    if (!session || loadingTopics) return;

    setLoadingTopics(true);
    setTopicsError(null);
    try {
      const selectedPillar = pillars.find(p => p.id === formData.pillarId);
      const selectedProducts = products.filter(p => formData.productIds.includes(p.id));

      const res = await fetch("/api/ai/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: session.id,
          contentType: formData.contentType,
          platforms: formData.platforms,
          pillar: selectedPillar,
          products: selectedProducts,
          cachedContext: cachedContext,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTopicSuggestions(data.topics);
        if (data.context) {
          setCachedContext(data.context);
        }
        setTopicsGenerated(true);
        setTopicsError(null);
      } else {
        console.error("Error generating topics:", data.error);
        setTopicsError(data.error || "Gagal generate topic suggestions");
      }
    } catch (error: any) {
      console.error("Error:", error);
      setTopicsError(error.message || "Terjadi kesalahan jaringan");
    } finally {
      setLoadingTopics(false);
    }
  }, [session, formData, pillars, products, cachedContext, loadingTopics]);

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.contentType !== null;
      case 2:
        return formData.platforms.length > 0;
      case 3:
        return formData.pillarId !== "";
      case 4:
        return true; // Product selection is optional (can select "none")
      case 5:
        if (formData.topicMode === "own") {
          return formData.title.trim() !== "";
        } else if (formData.topicMode === "ai") {
          return formData.selectedTopicId !== null;
        }
        return false;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps && canProceed()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCreate = async () => {
    if (!session) return;

    // Get final title and description
    let finalTitle = formData.title;
    let finalDescription = formData.description;

    if (formData.topicMode === "ai" && formData.selectedTopicId) {
      const selectedTopic = topicSuggestions.find(t => t.id === formData.selectedTopicId);
      if (selectedTopic) {
        finalTitle = selectedTopic.title;
        finalDescription = `${selectedTopic.description}\n\nAngle: ${selectedTopic.angle}`;
      }
    }

    setCreating(true);
    try {
      const res = await fetch("/api/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: session.id,
          title: finalTitle,
          contentType: formData.contentType,
          platforms: formData.platforms,
          pillarId: formData.pillarId,
          productIds: formData.productIds,
          referenceLinks: formData.referenceLinks,
          description: finalDescription,
          status: "idea_draft",
        }),
      });

      const data = await res.json();

      if (data.success && data.id) {
        router.push(`/dashboard/contents/${data.id}`);
      } else {
        alert(data.error || "Gagal membuat konten");
        setCreating(false);
      }
    } catch (error) {
      console.error("Error creating content:", error);
      alert("Terjadi kesalahan");
      setCreating(false);
    }
  };

  const togglePlatform = (platform: Platform) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const toggleProduct = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter((p) => p !== productId)
        : [...prev.productIds, productId],
    }));
  };

  const getSelectedPillar = () => pillars.find(p => p.id === formData.pillarId);
  const getSelectedProducts = () => products.filter(p => formData.productIds.includes(p.id));

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/contents"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Buat Konten Baru</h1>
          <p className="text-slate-500 mt-1">Step {step} dari {totalSteps}</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex-1 flex items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                s < step
                  ? "bg-gradient-to-br from-emerald-500 to-green-500 text-white"
                  : s === step
                  ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white"
                  : "bg-slate-100 text-slate-400"
              )}
            >
              {s < step ? <Check className="w-4 h-4" /> : s}
            </div>
            {s < 5 && (
              <div
                className={cn(
                  "flex-1 h-1 mx-2 rounded-full transition-all",
                  s < step ? "bg-emerald-500" : "bg-slate-200"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex justify-between mb-8 px-1 text-xs">
        <span className={cn(step >= 1 ? "text-slate-700" : "text-slate-400")}>Tipe</span>
        <span className={cn(step >= 2 ? "text-slate-700" : "text-slate-400")}>Platform</span>
        <span className={cn(step >= 3 ? "text-slate-700" : "text-slate-400")}>Pillar</span>
        <span className={cn(step >= 4 ? "text-slate-700" : "text-slate-400")}>Produk</span>
        <span className={cn(step >= 5 ? "text-slate-700" : "text-slate-400")}>Topic</span>
      </div>

      {/* Step Content */}
      <div className="glass-card rounded-2xl p-8 mb-6">
        {/* Step 1: Select Type */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Pilih Tipe Konten</h2>
            <p className="text-slate-500 mb-6">Tentukan jenis konten yang ingin kamu buat</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setFormData({ ...formData, contentType: "reels" })}
                className={cn(
                  "p-6 rounded-2xl border-2 text-left transition-all duration-300",
                  formData.contentType === "reels"
                    ? "border-pink-500 bg-pink-50 ring-2 ring-pink-500/20"
                    : "border-slate-200 hover:border-pink-300 hover:bg-pink-50/50"
                )}
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-4">
                  <Film className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">Reels / Video</h3>
                <p className="text-sm text-slate-500">Video pendek untuk Instagram Reels dan TikTok</p>
              </button>

              <button
                onClick={() => setFormData({ ...formData, contentType: "carousel" })}
                className={cn(
                  "p-6 rounded-2xl border-2 text-left transition-all duration-300",
                  formData.contentType === "carousel"
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20"
                    : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                )}
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-4">
                  <Images className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">Carousel</h3>
                <p className="text-sm text-slate-500">Slide images untuk Instagram Feed</p>
              </button>

              <button
                onClick={() => setFormData({ ...formData, contentType: "story" })}
                className={cn(
                  "p-6 rounded-2xl border-2 text-left transition-all duration-300",
                  formData.contentType === "story"
                    ? "border-purple-500 bg-purple-50 ring-2 ring-purple-500/20"
                    : "border-slate-200 hover:border-purple-300 hover:bg-purple-50/50"
                )}
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center mb-4">
                  <Smartphone className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">Story</h3>
                <p className="text-sm text-slate-500">Story untuk Instagram dan TikTok</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Platforms */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Pilih Platform</h2>
            <p className="text-slate-500 mb-6">Konten ini akan diposting di platform mana?</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => togglePlatform("instagram")}
                className={cn(
                  "p-6 rounded-2xl border-2 text-left transition-all duration-300",
                  formData.platforms.includes("instagram")
                    ? "border-pink-500 bg-gradient-to-br from-purple-50 to-pink-50 ring-2 ring-pink-500/20"
                    : "border-slate-200 hover:border-pink-300"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                    <Instagram className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800">Instagram</h3>
                    <p className="text-sm text-slate-500">Reels, Feed, Story</p>
                  </div>
                  {formData.platforms.includes("instagram") && (
                    <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </button>

              <button
                onClick={() => togglePlatform("tiktok")}
                className={cn(
                  "p-6 rounded-2xl border-2 text-left transition-all duration-300",
                  formData.platforms.includes("tiktok")
                    ? "border-slate-800 bg-slate-50 ring-2 ring-slate-800/20"
                    : "border-slate-200 hover:border-slate-400"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800">TikTok</h3>
                    <p className="text-sm text-slate-500">Video, Story</p>
                  </div>
                  {formData.platforms.includes("tiktok") && (
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </button>
            </div>
            <p className="text-sm text-slate-400 mt-4 text-center">
              Kamu bisa pilih satu atau kedua platform
            </p>
          </div>
        )}

        {/* Step 3: Select Pillar */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Pilih Content Pillar</h2>
            <p className="text-slate-500 mb-6">Konten ini masuk ke kategori apa?</p>

            {loading ? (
              <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
                ))}
              </div>
            ) : pillars.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Belum ada content pillar yang disetup.</p>
                <p className="text-sm">Hubungi tim iCAN untuk setup content pillars.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pillars.map((pillar) => (
                  <button
                    key={pillar.id}
                    onClick={() => setFormData({ ...formData, pillarId: pillar.id })}
                    className={cn(
                      "p-5 rounded-xl border-2 text-left transition-all",
                      formData.pillarId === pillar.id
                        ? PILLAR_SELECTED[pillar.color] || PILLAR_SELECTED.gray
                        : PILLAR_COLORS[pillar.color] || PILLAR_COLORS.gray
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{pillar.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-800">{pillar.name}</p>
                          <span className="text-xs text-slate-500">{pillar.targetRatio}%</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{pillar.description}</p>
                      </div>
                      {formData.pillarId === pillar.id && (
                        <Check className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Select Products */}
        {step === 4 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Highlight Produk/Service</h2>
            <p className="text-slate-500 mb-6">Pilih produk/service yang ingin di-highlight (opsional)</p>

            {/* No product option */}
            <button
              onClick={() => setFormData({ ...formData, productIds: [] })}
              className={cn(
                "w-full p-4 rounded-xl border-2 text-left transition-all mb-4",
                formData.productIds.length === 0
                  ? "border-slate-500 bg-slate-50 ring-2 ring-slate-500/20"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-700">Tidak ada produk yang di-highlight</p>
                  <p className="text-sm text-slate-500">Konten tanpa fokus produk tertentu</p>
                </div>
                {formData.productIds.length === 0 && (
                  <Check className="w-5 h-5 text-slate-600" />
                )}
              </div>
            </button>

            {products.length > 0 && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 bg-white text-sm text-slate-500">atau pilih produk</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      className={cn(
                        "p-4 rounded-xl border-2 text-left transition-all",
                        formData.productIds.includes(product.id)
                          ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20"
                          : "border-slate-200 hover:border-emerald-300"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 truncate">{product.name}</p>
                          <p className="text-xs text-slate-500">{product.category}</p>
                        </div>
                        {formData.productIds.includes(product.id) && (
                          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-slate-400 mt-4 text-center">
                  Kamu bisa pilih lebih dari satu produk
                </p>
              </>
            )}

            {products.length === 0 && (
              <div className="text-center py-4 text-slate-500 text-sm">
                <p>Belum ada produk yang ditambahkan.</p>
                <Link href="/dashboard/knowledge/products" className="text-blue-600 hover:underline">
                  Tambah produk di Knowledge Bank
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Topic Selection */}
        {step === 5 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Tentukan Topic</h2>
            <p className="text-slate-500 mb-6">Pilih cara menentukan topic konten kamu</p>

            {/* Summary of previous selections */}
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="px-3 py-1 bg-white rounded-full border">
                  {formData.contentType === "reels" ? "🎬 Reels" : formData.contentType === "carousel" ? "📸 Carousel" : "📱 Story"}
                </span>
                <span className="px-3 py-1 bg-white rounded-full border">
                  {formData.platforms.map(p => p === "instagram" ? "Instagram" : "TikTok").join(", ")}
                </span>
                <span className="px-3 py-1 bg-white rounded-full border">
                  {getSelectedPillar()?.emoji} {getSelectedPillar()?.name}
                </span>
                {formData.productIds.length > 0 && (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
                    {formData.productIds.length} produk dipilih
                  </span>
                )}
              </div>
            </div>

            {/* Topic mode selection */}
            {!formData.topicMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setFormData({ ...formData, topicMode: "own" })}
                  className="p-6 rounded-2xl border-2 border-slate-200 text-left transition-all hover:border-blue-300 hover:bg-blue-50/50"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-4">
                    <PenLine className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">Saya sudah punya topic</h3>
                  <p className="text-sm text-slate-500">Masukkan judul dan deskripsi topic konten kamu sendiri</p>
                </button>

                <button
                  onClick={() => {
                    setFormData({ ...formData, topicMode: "ai" });
                    if (!topicsGenerated) {
                      generateTopicSuggestions();
                    }
                  }}
                  className="p-6 rounded-2xl border-2 border-slate-200 text-left transition-all hover:border-violet-300 hover:bg-violet-50/50"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-4">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">Bantu carikan topic</h3>
                  <p className="text-sm text-slate-500">AI akan merekomendasikan 5 topic yang sesuai</p>
                </button>
              </div>
            )}

            {/* Own topic form */}
            {formData.topicMode === "own" && (
              <div className="space-y-4">
                <button
                  onClick={() => setFormData({ ...formData, topicMode: null, title: "", description: "" })}
                  className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali pilih mode
                </button>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Judul / Topic <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Contoh: 5 Tips Skincare untuk Pemula"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Deskripsi / Ide Awal
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Jelaskan ide konten kamu secara singkat..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <LinkIcon className="w-4 h-4 inline mr-1" />
                    Link Referensi (opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.referenceLinks}
                    onChange={(e) => setFormData({ ...formData, referenceLinks: e.target.value })}
                    placeholder="https://instagram.com/reel/..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* AI topic suggestions */}
            {formData.topicMode === "ai" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setFormData({ ...formData, topicMode: null, selectedTopicId: null })}
                    className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali pilih mode
                  </button>

                  {topicsGenerated && !loadingTopics && (
                    <button
                      onClick={generateTopicSuggestions}
                      className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Generate ulang
                    </button>
                  )}
                </div>

                {loadingTopics ? (
                  <div className="py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">AI sedang menyusun rekomendasi topic...</p>
                    <p className="text-sm text-slate-400 mt-1">Berdasarkan pillar, produk, dan brand kamu</p>
                  </div>
                ) : topicsError ? (
                  <div className="py-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <p className="text-slate-700 font-medium mb-2">Gagal generate topic suggestions</p>
                    <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">{topicsError}</p>
                    <button
                      onClick={generateTopicSuggestions}
                      className="px-4 py-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Coba lagi
                    </button>
                  </div>
                ) : topicSuggestions.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600 mb-2">Pilih salah satu topic yang sesuai:</p>
                    {topicSuggestions.map((topic, idx) => (
                      <button
                        key={topic.id}
                        onClick={() => setFormData({ ...formData, selectedTopicId: topic.id })}
                        className={cn(
                          "w-full p-4 rounded-xl border-2 text-left transition-all",
                          formData.selectedTopicId === topic.id
                            ? "border-violet-500 bg-violet-50 ring-2 ring-violet-500/20"
                            : "border-slate-200 hover:border-violet-300"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-semibold text-sm",
                            formData.selectedTopicId === topic.id
                              ? "bg-violet-500 text-white"
                              : "bg-slate-100 text-slate-600"
                          )}>
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-800 mb-1">{topic.title}</h4>
                            <p className="text-sm text-slate-600 mb-2">{topic.description}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Lightbulb className="w-3 h-3" />
                              Angle: {topic.angle}
                            </p>
                          </div>
                          {formData.selectedTopicId === topic.id && (
                            <Check className="w-5 h-5 text-violet-600 shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p>Gagal memuat rekomendasi topic.</p>
                    <button
                      onClick={generateTopicSuggestions}
                      className="text-violet-600 hover:underline mt-2"
                    >
                      Coba lagi
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={step === 1}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all",
            step === 1
              ? "text-slate-300 cursor-not-allowed"
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          <ArrowLeft className="w-5 h-5" />
          Kembali
        </button>

        <div className="flex items-center gap-3">
          {step < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all",
                canProceed()
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              Lanjut
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={!canProceed() || creating}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                canProceed() && !creating
                  ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              {creating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Membuat Konten...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Buat Konten & Chat AI
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Info Box */}
      {step === 5 && formData.topicMode && (
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-blue-700 text-sm flex items-start gap-2">
            <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>
              Setelah klik "Buat Konten", kamu akan masuk ke halaman AI Assistant yang akan membantu develop ide konten kamu menjadi hook, struktur, dan caption yang siap posting.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
