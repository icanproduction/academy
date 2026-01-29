"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  User,
  Mail,
  Phone,
  Building2,
  Lock,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface Profile {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  industry: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const stored = localStorage.getItem("ican_session");
        if (!stored) return;

        const session = JSON.parse(stored);
        const res = await fetch(`/api/clients/${session.clientId}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setContactPerson(data.contactPerson || "");
          setPhone(data.phone || "");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      setMessage(null);

      const res = await fetch(`/api/clients/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactPerson,
          phone,
        }),
      });

      if (res.ok) {
        setProfile({ ...profile, contactPerson, phone });
        setMessage({ type: "success", text: "Profil berhasil diperbarui!" });

        // Update session storage
        const stored = localStorage.getItem("ican_session");
        if (stored) {
          const session = JSON.parse(stored);
          session.name = contactPerson || session.name;
          localStorage.setItem("ican_session", JSON.stringify(session));
        }
      } else {
        setMessage({ type: "error", text: "Gagal memperbarui profil" });
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage({ type: "error", text: "Terjadi kesalahan" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!profile) return;

    // Validate
    if (!currentPassword) {
      setMessage({ type: "error", text: "Masukkan password saat ini" });
      return;
    }
    if (!newPassword) {
      setMessage({ type: "error", text: "Masukkan password baru" });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password minimal 6 karakter" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Konfirmasi password tidak cocok" });
      return;
    }

    try {
      setSavingPassword(true);
      setMessage(null);

      const res = await fetch(`/api/clients/${profile.id}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Password berhasil diubah!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({ type: "error", text: data.error || "Gagal mengubah password" });
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setMessage({ type: "error", text: "Terjadi kesalahan" });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-fg-muted">Tidak dapat memuat profil</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-accent to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-accent/30">
          {profile.name?.[0] || "?"}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{profile.name}</h1>
          <p className="text-slate-500">{profile.email}</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={cn(
            "flex items-center gap-2 p-4 rounded-xl mb-6 animate-fade-in",
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          )}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Profile Info */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-lg text-slate-800 mb-5 flex items-center gap-2">
          <User className="w-5 h-5 text-accent" />
          Informasi Profil
        </h2>

        <div className="space-y-4">
          {/* Business Name (read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              <Building2 className="w-4 h-4 inline mr-1" />
              Nama Bisnis
            </label>
            <input
              type="text"
              value={profile.name}
              disabled
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">
              Hubungi admin untuk mengubah nama bisnis
            </p>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">
              Email tidak dapat diubah
            </p>
          </div>

          {/* Contact Person */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Contact Person
            </label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="Nama PIC"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              No. Telepon
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+62 812 3456 7890"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
          </div>

          {/* Industry (read-only) */}
          {profile.industry && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Industri
              </label>
              <input
                type="text"
                value={profile.industry}
                disabled
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          )}

          {/* Save Button */}
          <div className="pt-2">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                saving
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-accent to-blue-600 text-white shadow-lg shadow-accent/25 hover:shadow-xl"
              )}
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-semibold text-lg text-slate-800 mb-5 flex items-center gap-2">
          <Lock className="w-5 h-5 text-accent" />
          Ganti Password
        </h2>

        <div className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Password Saat Ini
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan password saat ini"
                className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Password Baru
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNewPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang password baru"
                className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Password tidak cocok</p>
            )}
          </div>

          {/* Change Password Button */}
          <div className="pt-2">
            <button
              onClick={handleChangePassword}
              disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                savingPassword || !currentPassword || !newPassword || !confirmPassword
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 hover:shadow-xl"
              )}
            >
              {savingPassword ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
              {savingPassword ? "Mengubah..." : "Ganti Password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
