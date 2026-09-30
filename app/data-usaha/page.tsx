"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/* ---------------------------------------------------------
   KONFIGURASI
   Endpoint ini dilayani oleh route di app/api/finance dan app/api/business.
   - FINANCE_ENDPOINT  GET ?month=YYYY-MM -> { entries }, DELETE /:id
   - BUSINESS_ENDPOINT GET -> { business | null }, PUT -> { business }
---------------------------------------------------------- */
const FINANCE_ENDPOINT = "/api/finance";
const BUSINESS_ENDPOINT = "/api/business";
const CHAT_HREF = "/home";

type FinanceEntry = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  category: string | null;
  quantity: number | null;
  unitPrice: number | null;
  entryDate: string; // "2026-09-29T00:00:00.000Z" (kolom DATE, selalu UTC)
};
type Business = {
  name: string;
  category: string;
  description: string;
  products: string;
  targetCustomer: string;
  location: string;
  channels: string;
  tone: string;
};

const emptyProfile: Business = {
  name: "",
  category: "",
  description: "",
  products: "",
  targetCustomer: "",
  location: "",
  channels: "",
  tone: "",
};

const PROFILE_FIELDS: { key: keyof Business; label: string; placeholder: string; max: number; long?: boolean }[] = [
  { key: "name", label: "Nama usaha", placeholder: "Contoh: Keripik Pisang Bu Rini", max: 100 },
  { key: "category", label: "Jenis usaha", placeholder: "Contoh: Makanan ringan", max: 100 },
  { key: "description", label: "Cerita usaha", placeholder: "Awal mula usaha dan hal yang membuatnya berbeda.", max: 1000, long: true },
  { key: "products", label: "Produk utama", placeholder: "Contoh: Keripik pisang rasa cokelat dan balado.", max: 1000, long: true },
  { key: "targetCustomer", label: "Target pembeli", placeholder: "Contoh: Ibu rumah tangga dan pekerja kantoran", max: 191 },
  { key: "location", label: "Kota atau daerah", placeholder: "Contoh: Banjar, Jawa Barat", max: 100 },
  { key: "channels", label: "Tempat berjualan", placeholder: "Contoh: Instagram, Shopee, WhatsApp", max: 191 },
  { key: "tone", label: "Gaya bahasa promosi", placeholder: "Contoh: Santai dan ramah", max: 100 },
];

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700";
const inputCls = `w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-500 focus:border-emerald-400 ${focusRing}`;

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const toParts = (key: string) => key.split("-").map(Number) as [number, number];
const shiftMonth = (key: string, delta: number) => {
  const [y, m] = toParts(key);
  return monthKey(new Date(y, m - 1 + delta, 1));
};
const monthLabel = (key: string) => {
  const [y, m] = toParts(key);
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(y, m - 1, 1));
};
// Kolom DATE selalu tengah malam UTC; format dalam UTC supaya tanggal tidak bergeser.
const dayLabel = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso));

/* ---------------- Unduh CSV ---------------- */

// Bungkus sel dengan tanda kutip. Sel yang diawali = + - @ diberi awalan ' supaya
// tidak dijalankan sebagai rumus di Excel (isi deskripsi berasal dari chat pengguna).
function csvCell(value: string | number | null | undefined) {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

// Pemisah titik koma dan BOM UTF-8 supaya langsung rapi saat dibuka di Excel versi Indonesia.
function buildCsv(rows: FinanceEntry[], income: number, expense: number) {
  const SEP = ";";
  const header = ["Tanggal", "Jenis", "Deskripsi", "Kategori", "Jumlah", "Harga satuan (Rp)", "Total (Rp)"];
  const lines = [header.map(csvCell).join(SEP)];

  for (const e of rows) {
    lines.push(
      [
        e.entryDate.slice(0, 10),
        e.type === "INCOME" ? "Pemasukan" : "Pengeluaran",
        e.description,
        e.category ?? "",
        e.quantity ?? "",
        e.unitPrice ?? "",
        e.amount,
      ]
        .map(csvCell)
        .join(SEP)
    );
  }

  lines.push("");
  lines.push(["", "", "", "", "", "Total pemasukan", income].map(csvCell).join(SEP));
  lines.push(["", "", "", "", "", "Total pengeluaran", expense].map(csvCell).join(SEP));
  lines.push(["", "", "", "", "", "Laba", income - expense].map(csvCell).join(SEP));

  return "\uFEFF" + lines.join("\r\n");
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Kotak ikon berwarna, sama dengan kartu di landing page.
function IconBox({ accent, bg, path }: { accent: string; bg: string; path: string }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: bg, color: accent }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={path} />
      </svg>
    </div>
  );
}

const ICON = {
  income: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
  expense: "M23 18l-9.5-9.5-5 5L1 6M17 18h6v-6",
  profit: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  business:
    "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
};

export default function DataUsaha() {
  const currentMonth = monthKey(new Date());
  const [month, setMonth] = useState(currentMonth);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [entriesError, setEntriesError] = useState("");

  const [profile, setProfile] = useState<Business>(emptyProfile);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Catatan keuangan per bulan
  useEffect(() => {
    let cancelled = false;
    setEntriesLoading(true);
    setEntriesError("");
    fetch(`${FINANCE_ENDPOINT}?month=${month}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error("Sesi berakhir. Silakan masuk lagi.");
        if (!res.ok) throw new Error(data.error || "Catatan keuangan tidak bisa dimuat.");
        if (!cancelled) setEntries(data.entries ?? []);
      })
      .catch((e) => {
        if (cancelled) return;
        setEntries([]);
        setEntriesError(e instanceof Error ? e.message : "Catatan keuangan tidak bisa dimuat.");
      })
      .finally(() => !cancelled && setEntriesLoading(false));
    return () => {
      cancelled = true;
    };
  }, [month]);

  // Profil usaha
  useEffect(() => {
    let cancelled = false;
    fetch(BUSINESS_ENDPOINT)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.business) return;
        const next = { ...emptyProfile };
        for (const k of Object.keys(emptyProfile) as (keyof Business)[]) next[k] = data.business[k] ?? "";
        setProfile(next);
      })
      .catch(() => {})
      .finally(() => !cancelled && setProfileLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Saring lagi di browser kalau server mengirim lebih dari satu bulan.
  const monthEntries = useMemo(
    () =>
      entries
        .filter((e) => e.entryDate.slice(0, 7) === month)
        .sort((a, b) => b.entryDate.localeCompare(a.entryDate)),
    [entries, month]
  );

  const income = monthEntries.filter((e) => e.type === "INCOME").reduce((s, e) => s + e.amount, 0);
  const expense = monthEntries.filter((e) => e.type === "EXPENSE").reduce((s, e) => s + e.amount, 0);
  const profit = income - expense;

  function exportCsv() {
    if (monthEntries.length === 0) return;
    // Urut dari tanggal terlama supaya enak dibaca sebagai pembukuan.
    const rows = [...monthEntries].sort((a, b) => a.entryDate.localeCompare(b.entryDate));
    downloadFile(`catatan-keuangan-${month}.csv`, buildCsv(rows, income, expense), "text/csv;charset=utf-8");
  }

  async function removeEntry(e: FinanceEntry) {
    if (!window.confirm("Hapus catatan ini?")) return;
    try {
      const res = await fetch(`${FINANCE_ENDPOINT}/${e.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setEntries((prev) => prev.filter((x) => x.id !== e.id));
    } catch {
      setEntriesError("Catatan tidak bisa dihapus. Coba lagi.");
    }
  }

  async function saveProfile(ev: React.FormEvent) {
    ev.preventDefault();
    if (saving) return;
    setSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch(BUSINESS_ENDPOINT, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Profil tidak bisa disimpan. Coba lagi.");
      setProfileMsg({ ok: true, text: "Profil usaha tersimpan." });
    } catch (err) {
      setProfileMsg({ ok: false, text: err instanceof Error ? err.message : "Profil tidak bisa disimpan." });
    } finally {
      setSaving(false);
    }
  }

  const stat = (label: string, value: number, icon: string, accent: string, bg: string) => (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm md:px-5">
      <IconBox accent={accent} bg={bg} path={icon} />
      <p className="mt-3 text-xl font-bold text-gray-900 md:text-2xl" style={{ letterSpacing: "-0.02em", color: accent }}>
        {entriesLoading ? "…" : rupiah(value)}
      </p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
    </div>
  );

  return (
    <main className="min-h-[100dvh] bg-gray-50 pb-28 md:pb-10" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      {/* ================= HEADER ================= */}
      <header className="relative overflow-hidden border-b border-gray-100 bg-white">
        <div className="absolute -right-32 -top-32 h-[320px] w-[320px] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 h-[300px] w-[300px] rounded-full bg-indigo-400/10 blur-3xl" />

        <div className="relative mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8 md:flex-row md:items-end md:justify-between md:px-8 md:py-10">
          <div>
            <h1 className="text-3xl font-bold leading-tight text-gray-900" style={{ letterSpacing: "-0.035em" }}>
              Data usaha
            </h1>
            <p className="mt-2 max-w-md text-sm text-gray-600">
              Pantau pemasukan dan pengeluaran, lalu lengkapi profil usaha supaya Labain makin paham usahamu.
            </p>
          </div>

          <div className="flex items-center gap-1 self-start rounded-xl border border-gray-200 bg-white p-1 shadow-sm md:self-auto">
            <button
              type="button"
              onClick={() => setMonth(shiftMonth(month, -1))}
              aria-label="Bulan sebelumnya"
              className={`h-9 w-9 rounded-lg text-gray-600 hover:bg-gray-50 ${focusRing}`}
            >
              ‹
            </button>
            <span className="min-w-[8.5rem] text-center text-sm font-medium text-gray-800" aria-live="polite">
              {monthLabel(month)}
            </span>
            <button
              type="button"
              onClick={() => setMonth(shiftMonth(month, 1))}
              disabled={month >= currentMonth}
              aria-label="Bulan berikutnya"
              className={`h-9 w-9 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent ${focusRing}`}
            >
              ›
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8 md:px-8">
        {/* ================= RINGKASAN ================= */}
        <section aria-label={`Ringkasan keuangan ${monthLabel(month)}`} className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
          {stat("Pemasukan", income, ICON.income, "#059669", "#ecfdf5")}
          {stat("Pengeluaran", expense, ICON.expense, "#b45309", "#fffbeb")}
          {profit < 0
            ? stat("Laba", profit, ICON.profit, "#dc2626", "#fef2f2")
            : stat("Laba", profit, ICON.profit, "#0369a1", "#f0f9ff")}
        </section>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* ================= CATATAN ================= */}
          <section aria-labelledby="catatan" className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:col-span-3">
            <div className="flex flex-wrap items-start gap-3 p-5">
              <IconBox accent="#0369a1" bg="#f0f9ff" path={ICON.list} />
              <div className="min-w-0 flex-1">
                <h2 id="catatan" className="text-base font-bold text-gray-900">
                  Catatan bulan ini
                </h2>
                <p className="mt-1 text-sm text-gray-600">Dicatat otomatis dari percakapanmu dengan Labain.</p>
              </div>
              <button
                type="button"
                onClick={exportCsv}
                disabled={entriesLoading || monthEntries.length === 0}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white ${focusRing}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={ICON.download} />
                </svg>
                Unduh CSV
              </button>
            </div>

            {entriesError && (
              <p role="alert" className="px-5 pb-3 text-xs text-red-600">
                {entriesError}
              </p>
            )}

            {entriesLoading ? (
              <p className="border-t border-gray-100 px-5 py-6 text-sm text-gray-500">Memuat catatan…</p>
            ) : monthEntries.length === 0 ? (
              <div className="border-t border-gray-100 px-5 py-8 text-center">
                <p className="mx-auto max-w-sm text-sm text-gray-600">
                  Belum ada catatan di {monthLabel(month)}. Ceritakan penjualan atau biayamu ke Asisten, misalnya
                  &ldquo;Hari ini jual 40 bungkus @Rp15.000, biaya bahan Rp350.000&rdquo;.
                </p>
                <Link
                  href={CHAT_HREF}
                  className={`mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 ${focusRing}`}
                >
                  Buka Asisten
                </Link>
              </div>
            ) : (
              <ul className="m-0 list-none divide-y divide-gray-100 border-t border-gray-100 p-0">
                {monthEntries.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="w-14 shrink-0 text-xs text-gray-500">{dayLabel(e.entryDate)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-gray-800">{e.description}</p>
                      {(e.category || (e.quantity && e.unitPrice)) && (
                        <p className="truncate text-xs text-gray-500">
                          {[e.category, e.quantity && e.unitPrice ? `${e.quantity} × ${rupiah(e.unitPrice)}` : null]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={
                        e.type === "INCOME"
                          ? { background: "#ecfdf5", color: "#059669" }
                          : { background: "#fffbeb", color: "#b45309" }
                      }
                    >
                      {e.type === "INCOME" ? "+" : "−"}
                      {rupiah(e.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeEntry(e)}
                      aria-label={`Hapus catatan ${e.description}`}
                      className={`shrink-0 rounded px-2 py-1 text-gray-400 hover:text-red-600 ${focusRing}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ================= PROFIL USAHA ================= */}
          <section aria-labelledby="profil" className="rounded-2xl border border-gray-100 bg-white shadow-sm lg:col-span-2">
            <div className="flex items-start gap-3 p-5 pb-2">
              <IconBox accent="#059669" bg="#ecfdf5" path={ICON.business} />
              <div>
                <h2 id="profil" className="text-base font-bold text-gray-900">
                  Profil usaha
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Asisten memakai data ini supaya caption, harga, dan saran sesuai dengan usahamu.
                </p>
              </div>
            </div>

            <form onSubmit={saveProfile} className="space-y-4 p-5">
              {PROFILE_FIELDS.map((f) => (
                <div key={f.key}>
                  <label htmlFor={`biz-${f.key}`} className="mb-1.5 block text-sm font-medium text-gray-800">
                    {f.label}
                  </label>
                  {f.long ? (
                    <textarea
                      id={`biz-${f.key}`}
                      value={profile[f.key]}
                      onChange={(ev) => setProfile({ ...profile, [f.key]: ev.target.value })}
                      disabled={profileLoading}
                      rows={3}
                      maxLength={f.max}
                      placeholder={f.placeholder}
                      className={`${inputCls} resize-none`}
                    />
                  ) : (
                    <input
                      id={`biz-${f.key}`}
                      value={profile[f.key]}
                      onChange={(ev) => setProfile({ ...profile, [f.key]: ev.target.value })}
                      disabled={profileLoading}
                      required={f.key === "name"}
                      maxLength={f.max}
                      placeholder={f.placeholder}
                      className={inputCls}
                    />
                  )}
                </div>
              ))}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={saving || profileLoading}
                  className={`rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
                >
                  {saving ? "Menyimpan…" : "Simpan profil"}
                </button>
                <p role="status" className={`text-xs ${profileMsg?.ok ? "text-emerald-700" : "text-red-600"}`}>
                  {profileMsg?.text}
                </p>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}