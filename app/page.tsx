import Link from "next/link";
import Image from "next/image";

const FEATURES = [
  {
    icon: "▶",
    title: "Video Masterclass",
    desc: "19 materi dalam 5 modul. Pelajari sistem konten yang terbukti berhasil.",
  },
  {
    icon: "◈",
    title: "Brand Playbook",
    desc: "Dokumen lengkap identitas brand kamu — voice, visual, strategi — disiapkan oleh tim iCAN.",
  },
  {
    icon: "▦",
    title: "Content Calendar",
    desc: "Rencanakan, jadwalkan, dan kelola pipeline konten tim kamu dalam satu tempat.",
  },
  {
    icon: "✦",
    title: "Content QC",
    desc: "Review konten dengan feedback detail per frame. Fitur annotation langsung di video.",
  },
  {
    icon: "◇",
    title: "Asset Library",
    desc: "Akses template, bumper, grafis, dan asset brand yang dibuat khusus untuk bisnis kamu.",
  },
  {
    icon: "☎",
    title: "Mentoring Calls",
    desc: "5 sesi mentoring bersama tim iCAN selama 90 hari perjalanan kamu.",
  },
];

const STEPS = [
  { phase: "Systematize", day: "Hari 1–30", desc: "Bangun fondasi brand, playbook, dan sistem konten dari nol." },
  { phase: "Execute", day: "Hari 31–60", desc: "Mulai produksi dan publish konten bersama tim menggunakan sistem yang sudah dibangun." },
  { phase: "Optimize", day: "Hari 61–90", desc: "Ukur performa, perbaiki proses, dan tingkatkan output konten secara konsisten." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/logo-black.png" alt="iCAN" width={32} height={32} />
            <span className="text-xl font-bold tracking-tight">iCAN</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-fg-secondary hover:text-fg transition-colors">
              Masuk
            </Link>
            <Link
              href="/login"
              className="bg-accent hover:bg-accent-hover text-white font-medium text-sm px-5 py-2.5 rounded-lg transition-colors"
            >
              Mulai Sekarang
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-accent/10 text-accent text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            Program 90 Hari — Content System
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
            Bikin tim in-house kamu
            <br />
            <span className="text-accent">lebih jago dari agency</span>
          </h1>
          <p className="text-xl text-fg-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Berhenti bayar mahal ke agency. Bangun sistem konten yang bikin tim kamu
            bisa produksi konten berkualitas — konsisten, efisien, dan sesuai brand.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="bg-accent hover:bg-accent-hover text-white font-semibold text-lg px-8 py-4 rounded-xl transition-colors shadow-lg shadow-accent/25"
            >
              Mulai Perjalanan 90 Hari
            </Link>
          </div>
          <p className="text-sm text-fg-muted mt-4">
            Dibuat oleh pemilik agency yang tau persis kemana uang kamu pergi.
          </p>
        </div>
      </section>

      {/* 3 Phases */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Sistem 90 Hari</h2>
            <p className="text-fg-secondary">Tiga fase untuk transformasi operasional konten kamu</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.phase} className="bg-white border border-border rounded-2xl p-8 shadow-sm">
                <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center font-bold text-lg mb-4">
                  {i + 1}
                </div>
                <h3 className="text-xl font-bold mb-1">{step.phase}</h3>
                <p className="text-sm text-accent font-medium mb-3">{step.day}</p>
                <p className="text-fg-secondary text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Semua yang Kamu Butuhkan</h2>
            <p className="text-fg-secondary">Satu platform untuk mengatur seluruh operasional konten</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="border border-border rounded-2xl p-6 hover:shadow-md transition-shadow">
                <span className="text-2xl mb-4 block">{f.icon}</span>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-fg-secondary text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Siap bangun sistem konten kamu?</h2>
          <p className="text-fg-secondary mb-8">
            Gabung iCAN Content System dan transformasi tim kamu dalam 90 hari.
          </p>
          <Link
            href="/login"
            className="inline-block bg-accent hover:bg-accent-hover text-white font-semibold text-lg px-8 py-4 rounded-xl transition-colors shadow-lg shadow-accent/25"
          >
            Mulai Sekarang
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <p className="text-sm text-fg-muted">
            &copy; {new Date().getFullYear()} iCan Production. All rights reserved.
          </p>
          <Image src="/images/logo-black.png" alt="iCAN" width={24} height={24} />
        </div>
      </footer>
    </div>
  );
}
