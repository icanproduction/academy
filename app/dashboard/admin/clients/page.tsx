"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Loader2, Users, Plus, Search } from "lucide-react";

interface Client {
  id: string;
  businessName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  industry?: string;
  status: string;
  startDate?: string;
  role?: string;
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  // Form states
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newIndustry, setNewIndustry] = useState("");

  // Fetch clients from API
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/clients");
        if (res.ok) {
          const data = await res.json();
          // Ensure data is array and filter only clients (not admins)
          const clientsArray = Array.isArray(data) ? data : [];
          setClients(clientsArray.filter((c: Client) => c.role === "client"));
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  // Calculate current day based on start date
  const getCurrentDay = (startDate?: string): number => {
    if (!startDate) return 1;
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.min(diffDays, 90);
  };

  // Calculate phase based on current day
  const getPhase = (day: number): string => {
    if (day <= 30) return "Systematize";
    if (day <= 60) return "Execute";
    return "Optimize";
  };

  const filtered = clients.filter((c) => {
    const matchSearch = !search ||
      c.businessName?.toLowerCase().includes(search.toLowerCase()) ||
      c.contactPerson?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.status === filter;
    return matchSearch && matchFilter;
  });

  const statusStyle: Record<string, string> = {
    active: "bg-green-50 text-green-700",
    completed: "bg-blue-50 text-blue-700",
    paused: "bg-yellow-50 text-yellow-700",
  };
  const statusLabel: Record<string, string> = {
    active: "Aktif",
    completed: "Selesai",
    paused: "Pause",
  };

  const handleAddClient = async () => {
    if (!newName.trim() || !newContact.trim() || !newEmail.trim()) return;

    try {
      setSaving(true);
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          contactPerson: newContact,
          email: newEmail,
          phone: newPhone,
          industry: newIndustry,
          status: "active",
          role: "client",
          startDate: new Date().toISOString().split("T")[0],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Add to local state
        setClients([...clients, {
          id: data.id,
          businessName: newName,
          contactPerson: newContact,
          email: newEmail,
          phone: newPhone,
          industry: newIndustry,
          status: "active",
          role: "client",
          startDate: new Date().toISOString().split("T")[0],
        }]);

        // Reset form
        setNewName("");
        setNewContact("");
        setNewEmail("");
        setNewPhone("");
        setNewIndustry("");
        setShowAdd(false);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Gagal menambahkan client"}`);
      }
    } catch (error) {
      console.error("Error adding client:", error);
      alert("Gagal menambahkan client");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Kelola Client</h1>
          <p className="text-fg-muted text-sm mt-1">Daftar semua client iCAN Content System</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-accent hover:bg-accent-hover text-white font-medium text-sm px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tambah Client
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 max-w-sm relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-fg-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari client..."
            className="w-full border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "completed", "paused"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium transition-colors capitalize",
                filter === f ? "bg-accent text-white" : "bg-slate-100 text-fg-muted hover:text-fg"
              )}
            >
              {f === "all" ? "Semua" : statusLabel[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Client List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((client) => {
            const currentDay = getCurrentDay(client.startDate);
            const phase = client.status === "completed" ? "Completed" : getPhase(currentDay);

            return (
              <Link
                key={client.id}
                href={`/dashboard/admin/clients/${client.id}`}
                className="block bg-white border border-border rounded-xl p-5 hover:shadow-md hover:border-accent/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-accent/10 rounded-xl flex items-center justify-center text-accent font-bold">
                      {client.businessName?.[0] || "?"}
                    </div>
                    <div>
                      <p className="font-medium">{client.businessName}</p>
                      <p className="text-sm text-fg-muted">{client.contactPerson} · {client.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">Hari {currentDay}/90</p>
                      <p className="text-xs text-fg-muted">{phase}</p>
                    </div>
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${(currentDay / 90) * 100}%` }} />
                    </div>
                    <span className={cn("px-3 py-1 rounded-lg text-xs font-medium", statusStyle[client.status] || statusStyle.active)}>
                      {statusLabel[client.status] || "Aktif"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-semibold text-lg mb-2">
            {search || filter !== "all" ? "Tidak ada client yang cocok" : "Belum ada client"}
          </h3>
          <p className="text-fg-muted text-sm mb-4">
            {search || filter !== "all" ? "Coba ubah filter atau kata kunci pencarian" : "Tambahkan client pertama Anda"}
          </p>
          {!search && filter === "all" && (
            <button
              onClick={() => setShowAdd(true)}
              className="bg-accent hover:bg-accent-hover text-white font-medium text-sm px-5 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Client
            </button>
          )}
        </div>
      )}

      {/* Add Client Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-white border border-border rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-5">Tambah Client Baru</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nama Bisnis *</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Kedai Kopi Nusantara"
                  className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Contact Person *</label>
                <input
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  placeholder="Nama PIC"
                  className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@example.com"
                  type="email"
                  className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">No. Telepon</label>
                <input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+62 812 3456 7890"
                  className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Industri</label>
                <input
                  value={newIndustry}
                  onChange={(e) => setNewIndustry(e.target.value)}
                  placeholder="Contoh: F&B, Fashion, Beauty"
                  className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 text-sm text-fg-muted hover:text-fg"
                  disabled={saving}
                >
                  Batal
                </button>
                <button
                  onClick={handleAddClient}
                  disabled={!newName.trim() || !newContact.trim() || !newEmail.trim() || saving}
                  className={cn(
                    "font-medium px-5 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
                    !newName.trim() || !newContact.trim() || !newEmail.trim() || saving
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-accent hover:bg-accent-hover text-white"
                  )}
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
