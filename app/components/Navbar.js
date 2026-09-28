"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

/* ---------------------------------------------------------
   Ubah ke true saat halaman /assistant sudah siap.
   Sesuaikan FINANCE_HREF dan HPP_HREF dengan route aslimu.
---------------------------------------------------------- */
const ASSISTANT_ENABLED = false;
const FINANCE_HREF = "/keuangan";
const HPP_HREF = "/hpp";

// ── Icons ──────────────────────────────────────────────────
const svgProps = { width: 18, height: 18, viewBox: "0 0 20 20", fill: "none", "aria-hidden": true };
const stroke = (active) => ({
  stroke: active ? "#059669" : "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

const Icon = {
  Home: ({ active }) => (
    <svg {...svgProps}>
      <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" {...stroke(active)} />
      <path d="M8 18v-5h4v5" {...stroke(active)} />
    </svg>
  ),
  Assistant: ({ active }) => (
    <svg {...svgProps}>
      <path d="M10 2l1.6 4.4L16 8l-4.4 1.6L10 14l-1.6-4.4L4 8l4.4-1.6L10 2z" {...stroke(active)} />
      <path d="M15.5 13l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" {...stroke(active)} />
    </svg>
  ),
  Finance: ({ active }) => (
    <svg {...svgProps}>
      <path d="M3 6a2 2 0 012-2h9a1 1 0 011 1v2" {...stroke(active)} />
      <path d="M3 6v9a2 2 0 002 2h11a1 1 0 001-1V8a1 1 0 00-1-1H5a2 2 0 01-2-1z" {...stroke(active)} />
      <circle cx="13.5" cy="12" r="1" {...stroke(active)} />
    </svg>
  ),
  Hpp: ({ active }) => (
    <svg {...svgProps}>
      <path d="M3 10.5V4a1 1 0 011-1h6.5l6.5 6.5-7 7L3 10.5z" {...stroke(active)} />
      <circle cx="7" cy="7" r="1" {...stroke(active)} />
    </svg>
  ),
  Caption: ({ active }) => (
    <svg {...svgProps}>
      <path d="M4 4h12a1 1 0 011 1v7a1 1 0 01-1 1H7l-4 3V5a1 1 0 011-1z" {...stroke(active)} />
    </svg>
  ),
  Profile: ({ active }) => (
    <svg {...svgProps}>
      <circle cx="10" cy="7" r="3" {...stroke(active)} />
      <path d="M4 17c0-3.314 2.686-5 6-5s6 1.686 6 5" {...stroke(active)} />
    </svg>
  ),
  Logo: ({ active }) => (
    <svg {...svgProps}>
      <circle cx="10" cy="10" r="7" {...stroke(active)} />
      <circle cx="10" cy="10" r="2.5" {...stroke(active)} />
      <path d="M10 3v2M10 15v2M3 10h2M15 10h2" {...stroke(active)} />
    </svg>
  ),
  Foto: ({ active }) => (
    <svg {...svgProps}>
      <rect x="2" y="5" width="16" height="12" rx="2" {...stroke(active)} />
      <circle cx="10" cy="11" r="3" {...stroke(active)} />
      <path d="M7 5l1-2h4l1 2" {...stroke(active)} />
    </svg>
  ),
  More: ({ active }) => (
    <svg {...svgProps}>
      <rect x="3" y="3" width="6" height="6" rx="1.5" {...stroke(active)} />
      <rect x="11" y="3" width="6" height="6" rx="1.5" {...stroke(active)} />
      <rect x="3" y="11" width="6" height="6" rx="1.5" {...stroke(active)} />
      <rect x="11" y="11" width="6" height="6" rx="1.5" {...stroke(active)} />
    </svg>
  ),
  UserCircle: () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 14c0-2.761 2.239-4 5-4s5 1.239 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  Star: () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5l3.5-.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  ),
  Logout: () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 11l3-3-3-3M13 8H6M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ChevronUp: () => (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// ── Data navigasi ──────────────────────────────────────────
const home = { href: "/", label: "Home", short: "Home", Icon: Icon.Home };
const assistant = { href: "/assistant", label: "Asisten", short: "Asisten", Icon: Icon.Assistant };
const finance = { href: FINANCE_HREF, label: "Catat Keuangan", short: "Keuangan", Icon: Icon.Finance };
const hpp = { href: HPP_HREF, label: "Harga & HPP", short: "HPP", Icon: Icon.Hpp };
const caption = { href: "/caption", label: "Caption", short: "Caption", Icon: Icon.Caption };
const foto = { href: "/photo", label: "Foto Produk", short: "Foto", Icon: Icon.Foto };
const logo = { href: "/logo", label: "Logo Usaha", short: "Logo", Icon: Icon.Logo };
// Ini profil usaha, bukan profil akun (profil akun ada di /update_profile).
const profile = { href: "/profile", label: "Profil Usaha", short: "Profil", Icon: Icon.Profile };

const marketingItems = [caption, foto, logo, profile];

// Desktop: dikelompokkan sesuai pilar di landing page.
const navGroups = [
  { label: null, items: [home, ...(ASSISTANT_ENABLED ? [assistant] : [])] },
  { label: "Keuangan", items: [finance, hpp] },
  { label: "Pemasaran", items: marketingItems },
];

// Mobile: 2 item kiri, tombol akun di tengah, HPP, lalu "Lainnya" (alat pemasaran).
// Saat asisten aktif, ia menggantikan Home karena logo di header sudah ke beranda.
const mobileLeft = [ASSISTANT_ENABLED ? assistant : home, finance];

const PLAN_COLOR = { PRO: "#f59e0b", STARTER: "#059669" };

export default function Navbar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [userPlan, setUserPlan] = useState("FREE");
  const { data: session, status } = useSession();

  const user = session?.user;
  const email = user?.email;
  const initials = email ? email.slice(0, 2).toUpperCase() : "??";

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
  const moreActive = marketingItems.some((i) => isActive(i.href));

  // Tutup menu saat klik di luar
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (!e.target.closest("[data-user-menu]")) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Tutup menu dan sheet dengan Escape
  useEffect(() => {
    if (!menuOpen && !sheetOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setSheetOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [menuOpen, sheetOpen]);

  // Tutup sheet setelah pindah halaman
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  // Ambil plan pengguna
  useEffect(() => {
    if (!email) {
      setUserPlan("FREE");
      return;
    }
    let cancelled = false;
    fetch("/api/user/plan")
      .then((res) => res.json())
      .then((data) => !cancelled && setUserPlan(data.plan || "FREE"))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [email]);

  const logout = () => signOut({ callbackUrl: "/login" });

  if (status === "loading") return null;

  return (
    <>
      {/* ═════════════ MOBILE (< md) ═════════════ */}
      <header className="md:hidden fixed top-0 inset-x-0 z-50 h-12 bg-white border-b border-gray-100 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2" aria-label="Labain, ke beranda">
          <img src="/labain.png" alt="" className="w-7 h-7 object-contain" />
          <span className="text-base font-bold text-gray-800">
            Lab<span className="text-emerald-600">AI</span>n
          </span>
        </Link>

        {user ? (
          <Link
            href="/update_profile"
            className="text-[11px] text-gray-500 truncate max-w-[140px] hover:text-emerald-600 transition-colors"
          >
            {email}
          </Link>
        ) : (
          <div className="flex items-center gap-3 text-[12px]">
            <Link href="/login" className="font-medium text-gray-600 hover:text-gray-900">
              Masuk
            </Link>
            <Link href="/register" className="font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded-lg transition-colors">
              Daftar
            </Link>
          </div>
        )}
      </header>

      <div className="md:hidden h-12" />

      {/* Sheet "Lainnya": alat pemasaran */}
      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-black/30 cursor-default"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Alat pemasaran"
            className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl px-4 pt-4"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}
          >
            <p className="text-sm font-semibold text-gray-800 mb-3">Pemasaran</p>
            <div className="grid grid-cols-2 gap-2">
              {marketingItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl border border-gray-100"
                    style={active ? { background: "#ecfdf5", borderColor: "#a7f3d0" } : {}}
                  >
                    <span style={{ color: active ? "#059669" : "#6b7280" }}>
                      <item.Icon active={active} />
                    </span>
                    <span className="text-[13px] font-medium" style={{ color: active ? "#047857" : "#374151" }}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav
        aria-label="Navigasi utama"
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100 flex justify-around items-center px-2 pt-2"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
      >
        {mobileLeft.map((item) => (
          <MobileItem key={item.href} item={item} active={isActive(item.href)} />
        ))}

        <Link
          href={user ? "/plan" : "/login"}
          aria-label={user ? "Plan dan akun" : "Masuk"}
          className="w-10 h-10 rounded-full bg-emerald-600 text-white grid place-items-center shadow-md shadow-emerald-200"
        >
          <Icon.Profile />
        </Link>

        <MobileItem item={hpp} active={isActive(hpp.href)} />

        <button
          type="button"
          onClick={() => setSheetOpen((v) => !v)}
          aria-expanded={sheetOpen}
          aria-haspopup="dialog"
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors"
          style={moreActive ? { background: "#ecfdf5" } : {}}
        >
          <Icon.More active={moreActive} />
          <span className="text-[10px] font-medium" style={{ color: moreActive ? "#059669" : "#6b7280" }}>
            Lainnya
          </span>
        </button>
      </nav>

      {/* ═════════════ DESKTOP (≥ md) ═════════════ */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => {
          setExpanded(false);
          setMenuOpen(false);
        }}
        onFocus={() => setExpanded(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setExpanded(false);
            setMenuOpen(false);
          }
        }}
        className="hidden md:flex fixed top-0 left-0 h-screen bg-white border-r border-gray-100 flex-col z-50 overflow-hidden transition-[width] duration-200 ease-in-out motion-reduce:transition-none"
        style={{ width: expanded ? 220 : 64 }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 px-4 py-[18px] border-b border-gray-100 flex-shrink-0" aria-label="Labain, ke beranda">
          <div className="w-8 h-8 flex-shrink-0">
            <img src="/labain.png" alt="" className="w-full h-full object-cover rounded-lg" />
          </div>
          {expanded && (
            <span className="text-sm font-medium text-gray-800 whitespace-nowrap">
              Lab<span className="text-emerald-600">AI</span>n
            </span>
          )}
        </Link>

        {/* Nav */}
        <nav aria-label="Navigasi utama" className="flex-1 p-2 flex flex-col overflow-y-auto overflow-x-hidden">
          {navGroups.map((group, gi) => (
            <div key={gi} className="flex flex-col gap-0.5">
              {group.label && (
                <div className="h-7 px-2 flex items-end pb-1">
                  {expanded ? (
                    <p className="text-[11px] font-medium text-gray-500 whitespace-nowrap">{group.label}</p>
                  ) : (
                    <hr className="w-full border-gray-100" />
                  )}
                </div>
              )}
              {group.items.map((item) => (
                <DesktopItem key={item.href} item={item} active={isActive(item.href)} expanded={expanded} />
              ))}
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="p-2 border-t border-gray-100 flex-shrink-0" data-user-menu>
          {user ? (
            <div className="relative">
              {menuOpen && (
                <div className="absolute bottom-[calc(100%+6px)] left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-sm p-1 z-50">
                  <div className="flex items-center gap-2 px-2.5 py-2 mb-1 rounded-lg bg-gray-50">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 grid place-items-center text-[10px] font-medium text-emerald-700 flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-gray-800 truncate max-w-[130px]">{email}</p>
                      <p className="text-[10px] text-gray-500">
                        Plan:{" "}
                        <span style={{ color: PLAN_COLOR[userPlan] ?? "#6b7280", fontWeight: 500 }}>{userPlan}</span>
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/update_profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 text-[12.5px] text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-gray-500"><Icon.UserCircle /></span>
                    Akun saya
                  </Link>

                  <Link
                    href="/plan"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 text-[12.5px] text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-gray-500"><Icon.Star /></span>
                    Plan &amp; penggunaan
                  </Link>

                  <hr className="my-1 border-gray-100" />

                  <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 text-[12.5px] text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Icon.Logout />
                    Keluar
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label="Menu akun"
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 grid place-items-center text-[11px] font-medium text-emerald-700 flex-shrink-0">
                  {initials}
                </div>
                {expanded && (
                  <>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[11px] font-medium text-gray-800 truncate max-w-[110px]">{email}</p>
                      <p className="text-[10px] text-gray-500">Klik untuk menu</p>
                    </div>
                    <span
                      className="text-gray-400 flex-shrink-0 transition-transform duration-150"
                      style={{ transform: menuOpen ? "none" : "rotate(180deg)" }}
                    >
                      <Icon.ChevronUp />
                    </span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <Link
                href="/login"
                aria-label="Masuk"
                className="w-8 h-8 rounded-full bg-gray-100 grid place-items-center text-xs text-gray-500 flex-shrink-0 hover:bg-gray-200 transition-colors"
              >
                ?
              </Link>
              {expanded && (
                <div className="flex flex-col gap-0.5">
                  <Link href="/login" className="text-[12px] font-semibold text-gray-700 hover:text-gray-900">
                    Masuk
                  </Link>
                  <Link href="/register" className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800">
                    Daftar gratis
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function DesktopItem({ item, active, expanded }) {
  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className="flex items-center gap-3 px-2 py-2 rounded-lg transition-colors hover:bg-gray-50"
      style={active ? { background: "#ecfdf5" } : {}}
    >
      <span className="w-8 h-8 grid place-items-center flex-shrink-0" style={{ color: active ? "#059669" : "#6b7280" }}>
        <item.Icon active={active} />
      </span>
      {expanded && (
        <span className="text-[13px] whitespace-nowrap" style={{ color: active ? "#047857" : "#4b5563" }}>
          {item.label}
        </span>
      )}
    </Link>
  );
}

function MobileItem({ item, active }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors"
      style={active ? { background: "#ecfdf5" } : {}}
    >
      <item.Icon active={active} />
      <span className="text-[10px] font-medium" style={{ color: active ? "#059669" : "#6b7280" }}>
        {item.short}
      </span>
    </Link>
  );
}