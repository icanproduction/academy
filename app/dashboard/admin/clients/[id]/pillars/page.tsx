"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Sparkles,
  Target,
  ThumbsUp,
  ThumbsDown,
  Link2,
  ExternalLink,
  Loader2,
} from "lucide-react";

const COLORS = [
  { value: "blue", label: "Blue", bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-500" },
  { value: "purple", label: "Purple", bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-500" },
  { value: "green", label: "Green", bg: "bg-green-100", text: "text-green-700", border: "border-green-500" },
  { value: "orange", label: "Orange", bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-500" },
  { value: "pink", label: "Pink", bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-500" },
  { value: "teal", label: "Teal", bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-500" },
  { value: "red", label: "Red", bg: "bg-red-100", text: "text-red-700", border: "border-red-500" },
  { value: "yellow", label: "Yellow", bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-500" },
];

const getColorStyle = (color: string) => {
  return COLORS.find((c) => c.value === color) || COLORS[0];
};

interface Pillar {
  id: string;
  name: string;
  emoji: string;
  description: string;
  targetRatio: number;
  color: string;
  examples: string;
  referenceUrls: string[]; // New field for reference URLs
  dos: string;
  donts: string;
  order: number;
  active: boolean;
}

export default function ClientPillarsPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState("");
  const [editingPillar, setEditingPillar] = useState<Pillar | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPillar, setNewPillar] = useState<Partial<Pillar>>({
    name: "",
    emoji: "📌",
    description: "",
    targetRatio: 20,
    color: "blue",
    examples: "",
    referenceUrls: [""],
    dos: "",
    donts: "",
    order: 1,
    active: true,
  });

  // Fetch pillars from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch client info
        const clientRes = await fetch(`/api/clients/${clientId}`);
        if (clientRes.ok) {
          const clientData = await clientRes.json();
          setClientName(clientData.businessName || "Client");
        }

        // Fetch pillars
        const pillarsRes = await fetch(`/api/pillars?clientId=${clientId}`);
        if (pillarsRes.ok) {
          const pillarsData = await pillarsRes.json();
          // API returns { success, data: [...] }
          const pillarsArray = pillarsData.data || pillarsData;
          setPillars(Array.isArray(pillarsArray) ? pillarsArray : []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setPillars([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [clientId]);

  const totalRatio = (pillars || []).reduce((sum, p) => sum + p.targetRatio, 0);

  const handleSaveNew = async () => {
    if (!newPillar.name) return;

    try {
      setSaving(true);
      const res = await fetch("/api/pillars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          ...newPillar,
          referenceUrls: (newPillar.referenceUrls || []).filter(url => url.trim() !== ""),
          order: pillars.length + 1,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPillars([...pillars, { ...newPillar, id: data.id } as Pillar]);
        setNewPillar({
          name: "",
          emoji: "📌",
          description: "",
          targetRatio: 20,
          color: "blue",
          examples: "",
          referenceUrls: [""],
          dos: "",
          donts: "",
          order: pillars.length + 2,
          active: true,
        });
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Error creating pillar:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingPillar) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/pillars/${editingPillar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingPillar,
          referenceUrls: (editingPillar.referenceUrls || []).filter(url => url.trim() !== ""),
        }),
      });

      if (res.ok) {
        setPillars(pillars.map((p) => (p.id === editingPillar.id ? editingPillar : p)));
        setEditingPillar(null);
      }
    } catch (error) {
      console.error("Error updating pillar:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus content pillar ini?")) return;

    try {
      const res = await fetch(`/api/pillars/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPillars(pillars.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("Error deleting pillar:", error);
    }
  };

  // Reference URL helpers
  const addReferenceUrl = (pillar: Partial<Pillar>, onChange: (p: Partial<Pillar>) => void) => {
    const urls = pillar.referenceUrls || [];
    onChange({ ...pillar, referenceUrls: [...urls, ""] });
  };

  const updateReferenceUrl = (pillar: Partial<Pillar>, index: number, value: string, onChange: (p: Partial<Pillar>) => void) => {
    const urls = [...(pillar.referenceUrls || [])];
    urls[index] = value;
    onChange({ ...pillar, referenceUrls: urls });
  };

  const removeReferenceUrl = (pillar: Partial<Pillar>, index: number, onChange: (p: Partial<Pillar>) => void) => {
    const urls = (pillar.referenceUrls || []).filter((_, i) => i !== index);
    onChange({ ...pillar, referenceUrls: urls.length > 0 ? urls : [""] });
  };

  const PillarForm = ({
    pillar,
    onChange,
    onSave,
    onCancel,
    title,
  }: {
    pillar: Partial<Pillar>;
    onChange: (p: Partial<Pillar>) => void;
    onSave: () => void;
    onCancel: () => void;
    title: string;
  }) => (
    <div className="glass-card rounded-2xl p-6 border-2 border-accent/30">
      <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-accent" />
        {title}
      </h3>

      <div className="grid grid-cols-2 gap-5">
        {/* Name & Emoji */}
        <div>
          <label className="block text-sm font-medium mb-2">Nama Pillar *</label>
          <div className="flex gap-2">
            <input
              value={pillar.emoji || ""}
              onChange={(e) => onChange({ ...pillar, emoji: e.target.value })}
              className="w-14 border border-border rounded-lg px-3 py-2.5 text-center text-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              placeholder="📌"
            />
            <input
              value={pillar.name || ""}
              onChange={(e) => onChange({ ...pillar, name: e.target.value })}
              className="flex-1 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              placeholder="Contoh: Educate"
            />
          </div>
        </div>

        {/* Color & Ratio */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-2">Warna</label>
            <select
              value={pillar.color || "blue"}
              onChange={(e) => onChange({ ...pillar, color: e.target.value })}
              className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            >
              {COLORS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Target Ratio (%)</label>
            <input
              type="number"
              min={5}
              max={100}
              value={pillar.targetRatio || 20}
              onChange={(e) => onChange({ ...pillar, targetRatio: parseInt(e.target.value) || 20 })}
              className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
        </div>

        {/* Description */}
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-2">Deskripsi</label>
          <textarea
            value={pillar.description || ""}
            onChange={(e) => onChange({ ...pillar, description: e.target.value })}
            rows={2}
            className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            placeholder="Jelaskan jenis konten apa yang masuk pillar ini..."
          />
        </div>

        {/* Examples */}
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-2">Contoh Konten</label>
          <input
            value={pillar.examples || ""}
            onChange={(e) => onChange({ ...pillar, examples: e.target.value })}
            className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            placeholder="Contoh 1, Contoh 2, Contoh 3"
          />
        </div>

        {/* Reference URLs - NEW */}
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-accent" />
            Reference URLs
          </label>
          <div className="space-y-2">
            {(pillar.referenceUrls || [""]).map((url, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={url}
                  onChange={(e) => updateReferenceUrl(pillar, index, e.target.value, onChange)}
                  className="flex-1 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  placeholder="https://instagram.com/p/example"
                />
                <button
                  type="button"
                  onClick={() => removeReferenceUrl(pillar, index, onChange)}
                  className="p-2.5 rounded-lg text-fg-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addReferenceUrl(pillar, onChange)}
              className="text-sm text-accent hover:text-accent-hover flex items-center gap-1 mt-1"
            >
              <Plus className="w-4 h-4" />
              Tambah URL
            </button>
          </div>
        </div>

        {/* Do's */}
        <div>
          <label className="block text-sm font-medium mb-2 text-green-700 flex items-center gap-1">
            <ThumbsUp className="w-4 h-4" /> Do&apos;s
          </label>
          <textarea
            value={pillar.dos || ""}
            onChange={(e) => onChange({ ...pillar, dos: e.target.value })}
            rows={2}
            className="w-full border border-green-200 bg-green-50/50 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            placeholder="Hal yang BOLEH dilakukan..."
          />
        </div>

        {/* Don'ts */}
        <div>
          <label className="block text-sm font-medium mb-2 text-red-700 flex items-center gap-1">
            <ThumbsDown className="w-4 h-4" /> Don&apos;ts
          </label>
          <textarea
            value={pillar.donts || ""}
            onChange={(e) => onChange({ ...pillar, donts: e.target.value })}
            rows={2}
            className="w-full border border-red-200 bg-red-50/50 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            placeholder="Hal yang TIDAK BOLEH dilakukan..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-fg-muted hover:text-fg transition-colors"
        >
          Batal
        </button>
        <button
          onClick={onSave}
          disabled={!pillar.name || saving}
          className={cn(
            "px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors",
            !pillar.name || saving
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-accent hover:bg-accent-hover text-white"
          )}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/admin/clients/${clientId}`}
          className="inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Detail Client
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Content Pillars</h1>
            <p className="text-fg-muted text-sm mt-1">{clientName} • {pillars.length} pillars</p>
          </div>
          {!isCreating && !editingPillar && (
            <button
              onClick={() => setIsCreating(true)}
              className="bg-accent hover:bg-accent-hover text-white font-medium text-sm px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Pillar
            </button>
          )}
        </div>
      </div>

      {/* Ratio Overview */}
      {pillars.length > 0 && (
        <div className="glass-card rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              <h3 className="font-semibold">Target Ratio Overview</h3>
            </div>
            <span className={cn("text-sm font-medium", totalRatio === 100 ? "text-green-600" : "text-orange-600")}>
              Total: {totalRatio}%
            </span>
          </div>
          <div className="flex h-4 rounded-full overflow-hidden bg-slate-100">
            {pillars.map((p) => {
              const style = getColorStyle(p.color);
              return (
                <div
                  key={p.id}
                  className={cn("h-full transition-all", style.bg)}
                  style={{ width: `${p.targetRatio}%` }}
                  title={`${p.name}: ${p.targetRatio}%`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {pillars.map((p) => {
              const style = getColorStyle(p.color);
              return (
                <div key={p.id} className="flex items-center gap-1.5 text-xs">
                  <div className={cn("w-3 h-3 rounded", style.bg)} />
                  <span className="text-fg-muted">
                    {p.emoji} {p.name} ({p.targetRatio}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Form */}
      {isCreating && (
        <div className="mb-6">
          <PillarForm
            pillar={newPillar}
            onChange={setNewPillar}
            onSave={handleSaveNew}
            onCancel={() => setIsCreating(false)}
            title="Tambah Pillar Baru"
          />
        </div>
      )}

      {/* Pillars List */}
      <div className="space-y-4">
        {pillars.map((pillar) => {
          const style = getColorStyle(pillar.color);
          const isEditing = editingPillar?.id === pillar.id;

          if (isEditing) {
            return (
              <PillarForm
                key={pillar.id}
                pillar={editingPillar}
                onChange={setEditingPillar as any}
                onSave={handleUpdate}
                onCancel={() => setEditingPillar(null)}
                title="Edit Pillar"
              />
            );
          }

          return (
            <div
              key={pillar.id}
              className={cn(
                "glass-card rounded-2xl p-5 border-l-4 transition-all hover:shadow-md",
                style.border
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-2xl", style.bg)}>
                    {pillar.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-lg">{pillar.name}</h3>
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", style.bg, style.text)}>
                        {pillar.targetRatio}%
                      </span>
                    </div>
                    <p className="text-fg-secondary text-sm mb-3">{pillar.description}</p>

                    {pillar.examples && (
                      <div className="mb-2">
                        <span className="text-xs font-medium text-fg-muted">Contoh: </span>
                        <span className="text-xs text-fg-secondary">{pillar.examples}</span>
                      </div>
                    )}

                    {/* Reference URLs Display */}
                    {pillar.referenceUrls && pillar.referenceUrls.length > 0 && pillar.referenceUrls.some(url => url) && (
                      <div className="mb-3">
                        <span className="text-xs font-medium text-fg-muted flex items-center gap-1 mb-1">
                          <Link2 className="w-3 h-3" /> Referensi:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {pillar.referenceUrls.filter(url => url).map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover bg-accent/5 hover:bg-accent/10 px-2 py-1 rounded-md transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {new URL(url).hostname.replace("www.", "")}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 text-xs">
                      {pillar.dos && (
                        <div className="flex items-start gap-1 text-green-700">
                          <ThumbsUp className="w-3 h-3 mt-0.5 shrink-0" />
                          <span>{pillar.dos}</span>
                        </div>
                      )}
                      {pillar.donts && (
                        <div className="flex items-start gap-1 text-red-700">
                          <ThumbsDown className="w-3 h-3 mt-0.5 shrink-0" />
                          <span>{pillar.donts}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingPillar({...pillar, referenceUrls: pillar.referenceUrls || [""]})}
                    className="p-2 rounded-lg text-fg-muted hover:text-accent hover:bg-accent/10 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(pillar.id)}
                    className="p-2 rounded-lg text-fg-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {pillars.length === 0 && !isCreating && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Belum ada Content Pillars</h3>
          <p className="text-fg-muted text-sm mb-4">Tambahkan pillar untuk mengkategorikan konten client ini</p>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-accent hover:bg-accent-hover text-white font-medium text-sm px-5 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Pillar Pertama
          </button>
        </div>
      )}
    </div>
  );
}
