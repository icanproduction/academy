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
  Users,
  Star,
  MapPin,
  Briefcase,
  Heart,
  Target,
  AlertCircle,
} from "lucide-react";

interface ClientICP {
  id: string;
  icpName: string;
  ageRange: string;
  gender: string[];
  location: string[];
  occupation: string;
  interests: string[];
  painPoints: string;
  goals: string;
  contentPreferences: string;
  isPrimary: boolean;
}

export default function ICPPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [icps, setIcps] = useState<ClientICP[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState("");

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    icpName: "",
    ageRange: "",
    gender: [] as string[],
    location: [] as string[],
    occupation: "",
    interests: [] as string[],
    painPoints: "",
    goals: "",
    contentPreferences: "",
    isPrimary: false,
  });
  const [saving, setSaving] = useState(false);

  // Temp inputs for multi-select
  const [locationInput, setLocationInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

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

      const res = await fetch(`/api/clients/${clientId}/icp`);
      if (res.ok) {
        const data = await res.json();
        setIcps(Array.isArray(data) ? data : []);
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
        ? `/api/clients/${clientId}/icp/${editingId}`
        : `/api/clients/${clientId}/icp`;

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

  const handleEdit = (icp: ClientICP) => {
    setEditingId(icp.id);
    setFormData({
      icpName: icp.icpName,
      ageRange: icp.ageRange,
      gender: Array.isArray(icp.gender) ? icp.gender : [],
      location: Array.isArray(icp.location) ? icp.location : [],
      occupation: icp.occupation,
      interests: Array.isArray(icp.interests) ? icp.interests : [],
      painPoints: icp.painPoints,
      goals: icp.goals,
      contentPreferences: icp.contentPreferences,
      isPrimary: icp.isPrimary,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus ICP ini?")) return;

    try {
      const res = await fetch(`/api/clients/${clientId}/icp/${id}`, {
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
      icpName: "",
      ageRange: "",
      gender: [],
      location: [],
      occupation: "",
      interests: [],
      painPoints: "",
      goals: "",
      contentPreferences: "",
      isPrimary: false,
    });
    setLocationInput("");
    setInterestInput("");
  };

  const addLocation = () => {
    if (locationInput.trim() && !formData.location.includes(locationInput.trim())) {
      setFormData({ ...formData, location: [...formData.location, locationInput.trim()] });
      setLocationInput("");
    }
  };

  const removeLocation = (loc: string) => {
    setFormData({ ...formData, location: formData.location.filter((l) => l !== loc) });
  };

  const addInterest = () => {
    if (interestInput.trim() && !formData.interests.includes(interestInput.trim())) {
      setFormData({ ...formData, interests: [...formData.interests, interestInput.trim()] });
      setInterestInput("");
    }
  };

  const removeInterest = (interest: string) => {
    setFormData({ ...formData, interests: formData.interests.filter((i) => i !== interest) });
  };

  const toggleGender = (g: string) => {
    if (formData.gender.includes(g)) {
      setFormData({ ...formData, gender: formData.gender.filter((x) => x !== g) });
    } else {
      setFormData({ ...formData, gender: [...formData.gender, g] });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
                <Users className="w-6 h-6 text-purple-600" />
                Target Audience (ICP)
              </h1>
              <p className="text-slate-600">{clientName}</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah ICP
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5" />
          <div>
            <p className="text-sm text-purple-800">
              ICP (Ideal Customer Profile) membantu AI memahami target audience dan membuat konten yang lebih relevan.
              Tandai satu ICP sebagai Primary untuk prioritas utama.
            </p>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-800">
                  {editingId ? "Edit ICP" : "Tambah ICP Baru"}
                </h2>
                <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama ICP</label>
                    <input
                      type="text"
                      value={formData.icpName}
                      onChange={(e) => setFormData({ ...formData, icpName: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Contoh: Ibu Muda Urban"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Rentang Usia</label>
                    <input
                      type="text"
                      value={formData.ageRange}
                      onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Contoh: 25-35 tahun"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                  <div className="flex gap-4">
                    {["Pria", "Wanita", "Semua"].map((g) => (
                      <label key={g} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.gender.includes(g)}
                          onChange={() => toggleGender(g)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-slate-700">{g}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLocation())}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Tambah lokasi..."
                    />
                    <button
                      type="button"
                      onClick={addLocation}
                      className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.location.map((loc) => (
                      <span
                        key={loc}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                      >
                        <MapPin className="w-3 h-3" />
                        {loc}
                        <button type="button" onClick={() => removeLocation(loc)} className="ml-1 hover:text-purple-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pekerjaan</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Contoh: Karyawan, Wirausaha, Ibu Rumah Tangga"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Interests</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Tambah interest..."
                    />
                    <button
                      type="button"
                      onClick={addInterest}
                      className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.interests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm"
                      >
                        <Heart className="w-3 h-3" />
                        {interest}
                        <button type="button" onClick={() => removeInterest(interest)} className="ml-1 hover:text-pink-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pain Points</label>
                  <textarea
                    value={formData.painPoints}
                    onChange={(e) => setFormData({ ...formData, painPoints: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 min-h-[80px]"
                    placeholder="Masalah atau tantangan yang dihadapi target audience..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Goals / Aspirations</label>
                  <textarea
                    value={formData.goals}
                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 min-h-[80px]"
                    placeholder="Tujuan atau keinginan target audience..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Content Preferences</label>
                  <textarea
                    value={formData.contentPreferences}
                    onChange={(e) => setFormData({ ...formData, contentPreferences: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 min-h-[80px]"
                    placeholder="Jenis konten yang disukai (edukatif, entertaining, inspiring, dll)..."
                  />
                </div>

                <div className="flex items-center pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPrimary}
                      onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-slate-700 flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      Jadikan Primary ICP
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
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
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
        {icps.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">Belum ada ICP</h3>
            <p className="text-slate-500 mb-4">Tambahkan profil target audience untuk membantu AI membuat konten yang lebih relevan</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah ICP Pertama
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {icps.sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)).map((icp) => (
              <div
                key={icp.id}
                className={`bg-white rounded-2xl p-6 ${icp.isPrimary ? "ring-2 ring-yellow-400" : ""}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${icp.isPrimary ? "bg-yellow-100" : "bg-purple-100"}`}>
                      <Users className={`w-6 h-6 ${icp.isPrimary ? "text-yellow-600" : "text-purple-600"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-800">{icp.icpName}</h3>
                        {icp.isPrimary && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                            <Star className="w-3 h-3" />
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {icp.ageRange} • {Array.isArray(icp.gender) ? icp.gender.join(", ") : icp.gender}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(icp)}
                      className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(icp.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  {Array.isArray(icp.location) && icp.location.length > 0 && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <span className="text-slate-500">Lokasi: </span>
                        <span className="text-slate-700">{icp.location.join(", ")}</span>
                      </div>
                    </div>
                  )}
                  {icp.occupation && (
                    <div className="flex items-start gap-2">
                      <Briefcase className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <span className="text-slate-500">Pekerjaan: </span>
                        <span className="text-slate-700">{icp.occupation}</span>
                      </div>
                    </div>
                  )}
                  {icp.painPoints && (
                    <div className="flex items-start gap-2">
                      <Target className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <span className="text-slate-500">Pain Points: </span>
                        <span className="text-slate-700">{icp.painPoints}</span>
                      </div>
                    </div>
                  )}
                  {icp.goals && (
                    <div className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <span className="text-slate-500">Goals: </span>
                        <span className="text-slate-700">{icp.goals}</span>
                      </div>
                    </div>
                  )}
                </div>

                {Array.isArray(icp.interests) && icp.interests.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {icp.interests.map((interest) => (
                      <span key={interest} className="px-2 py-1 bg-pink-50 text-pink-600 text-xs rounded-full">
                        {interest}
                      </span>
                    ))}
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
