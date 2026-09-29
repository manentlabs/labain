"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, Suspense, useCallback, useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";

const CHAT_HREF = "/home";
const DATA_HREF = "/data-usaha";
const CONVERSATIONS_ENDPOINT = "/api/conversations";
const CHANGED_EVENT = "labain:conversations-changed"; // dikirim HomeChat saat riwayat berubah

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
  History: ({ active }) => (
    <svg {...svgProps}>
      <circle cx="10" cy="10" r="7" {...stroke(active)} />
      <path d="M10 6v4l2.5 1.5" {...stroke(active)} />
    </svg>
  ),
  Data: ({ active }) => (
    <svg {...svgProps}>
      <path d="M3 17h14" {...stroke(active)} />
      <rect x="4" y="10" width="3" height="5" rx="0.8" {...stroke(active)} />
      <rect x="8.5" y="6" width="3" height="9" rx="0.8" {...stroke(active)} />
      <rect x="13" y="3" width="3" height="12" rx="0.8" {...stroke(active)} />
    </svg>
  ),
  Account: ({ active }) => (
    <svg {...svgProps}>
      <circle cx="10" cy="7" r="3" {...stroke(active)} />
      <path d="M4 17c0-3.314 2.686-5 6-5s6 1.686 6 5" {...stroke(active)} />
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
  Close: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

// ── Data navigasi ──────────────────────────────────────────
// Tamu hanya melihat Home. Pengguna login melihat Asisten dan Data Usaha; riwayat chat ada di bawahnya.
const guestItems = [{ href: "/", label: "Home", short: "Home", Icon: Icon.Home }];
const memberItems = [
  { href: CHAT_HREF, label: "Asisten", short: "Asisten", Icon: Icon.Assistant },
  { href: DATA_HREF, label: "Data Usaha", short: "Data", Icon: Icon.Data },
];

const PLAN_COLOR = { PRO: "#f59e0b", STARTER: "#059669" };
const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700";

// ── Daftar riwayat percakapan ──────────────────────────────
function useConversations(enabled) {
  const [list, setList] = useState([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(CONVERSATIONS_ENDPOINT);
      if (!res.ok) return;
      const d = await res.json();
      setList(d.conversations ?? []);
    } catch {
      // Riwayat gagal dimuat: navigasi lain tetap berfungsi.
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setList([]);
      return;
    }
    load();
    window.addEventListener(CHANGED_EVENT, load);
    return () => window.removeEventListener(CHANGED_EVENT, load);
  }, [enabled, load]);

  return { list, load };
}

// Dibungkus <Suspense> oleh pemakainya karena memakai useSearchParams.
function HistoryList({ list, onChanged, onNavigate, hoverDelete }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = pathname === CHAT_HREF ? searchParams.get("c") : null;

  async function remove(c) {
    if (!window.confirm("Hapus percakapan ini? Catatan keuanganmu tetap tersimpan.")) return;
    try {
      const res = await fetch(`${CONVERSATIONS_ENDPOINT}/${c.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      if (c.id === activeId) router.push(CHAT_HREF);
      onChanged();
    } catch {
      window.alert("Percakapan tidak bisa dihapus. Coba lagi.");
    }
  }

  if (list.length === 0) {
    return <p className="px-2 py-3 text-xs text-gray-500">Belum ada riwayat. Percakapanmu akan tersimpan di sini.</p>;
  }

  return (
    <ul className="m-0 list-none space-y-0.5 p-0">
      {list.map((c) => {
        const current = c.id === activeId;
        return (
          <li key={c.id} className="group flex items-center">
            <Link
              href={`${CHAT_HREF}?c=${c.id}`}
              onClick={onNavigate}
              aria-current={current ? "page" : undefined}
              title={c.title}
              className={`min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-[13px] transition-colors ${focusRing} ${
                current ? "bg-emerald-50 font-semibold text-emerald-800" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {c.title}
            </Link>
            <button
              type="button"
              onClick={() => remove(c)}
              aria-label={`Hapus percakapan ${c.title}`}
              className={`ml-1 shrink-0 rounded px-2 py-1 text-gray-400 hover:text-red-600 ${focusRing} ${
                hoverDelete ? "opacity-0 group-hover:opacity-100 focus-visible:opacity-100" : ""
              }`}
            >
              ×
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false); // sheet akun (mobile)
  const [historyOpen, setHistoryOpen] = useState(false); // sheet riwayat (mobile)
  const [userPlan, setUserPlan] = useState("FREE");
  const { data: session, status } = useSession();

  const loading = status === "loading";
  const user = session?.user;
  const email = user?.email;
  const initials = email ? email.slice(0, 2).toUpperCase() : "??";

  // Sidebar tetap terbuka selama menu akun terbuka, meski kursor keluar.
  const expanded = hovered || menuOpen;
  const anySheet = sheetOpen || historyOpen;

  // Saat sesi dimuat, menu member tetap dirender supaya tampilan tidak melompat.
  const items = loading || user ? memberItems : guestItems;
  const homeHref = user ? CHAT_HREF : "/";
  const { list: conversations, load: reloadConversations } = useConversations(!!email);

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
  const accountActive = isActive("/update_profile") || isActive("/plan");

  // Tutup menu saat klik di luar sidebar
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
    if (!menuOpen && !anySheet) return;
    const handler = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setSheetOpen(false);
        setHistoryOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [menuOpen, anySheet]);

  // Kunci scroll halaman saat sheet terbuka
  useEffect(() => {
    if (!anySheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [anySheet]);

  // Tutup menu dan sheet setelah pindah halaman
  useEffect(() => {
    setSheetOpen(false);
    setHistoryOpen(false);
    setMenuOpen(false);
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
      .then((d) => !cancelled && setUserPlan(d.plan || "FREE"))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [email]);

  const logout = () => signOut({ callbackUrl: "/login" });

  const planBadge = (
    <span style={{ color: PLAN_COLOR[userPlan] ?? "#6b7280", fontWeight: 500 }}>{userPlan}</span>
  );

  const historyButton = user ? (
    <button
      type="button"
      onClick={() => {
        setSheetOpen(false);
        setHistoryOpen((v) => !v);
      }}
      aria-expanded={historyOpen}
      aria-haspopup="dialog"
      className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors"
      style={historyOpen ? { background: "#ecfdf5" } : {}}
    >
      <Icon.History active={historyOpen} />
      <span className="text-[10px] font-medium" style={{ color: historyOpen ? "#059669" : "#6b7280" }}>
        Riwayat
      </span>
    </button>
  ) : (
    <span aria-hidden="true" className="w-10 h-10 rounded-lg bg-gray-100" />
  );

  return (
    <>
      {/* ═════════════ MOBILE (< md) ═════════════ */}
      <header className="md:hidden fixed top-0 inset-x-0 z-50 h-12 bg-white border-b border-gray-100 flex items-center justify-between px-4">
        <Link href={homeHref} className="flex items-center gap-2" aria-label="Labain, ke beranda">
          <img src="/labain.png" alt="" className="w-7 h-7 object-contain" />
          <span className="text-base font-bold text-gray-800">
            Lab<span className="text-emerald-600">AI</span>n
          </span>
        </Link>

        {!loading && !user && (
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

      {/* Sheet riwayat (mobile, khusus pengguna login) */}
      {historyOpen && user && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label="Tutup riwayat"
            onClick={() => setHistoryOpen(false)}
            className="absolute inset-0 bg-black/30 cursor-default"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Riwayat percakapan"
            className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl px-4 pt-4 flex flex-col max-h-[75dvh]"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}
          >
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <p className="text-[13px] font-semibold text-gray-800">Riwayat percakapan</p>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                aria-label="Tutup"
                className="w-8 h-8 grid place-items-center rounded-full text-gray-500 hover:bg-gray-100"
              >
                <Icon.Close />
              </button>
            </div>

            <Link
              href={CHAT_HREF}
              onClick={() => setHistoryOpen(false)}
              className="mb-3 flex-shrink-0 rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-[13px] font-semibold text-white hover:bg-emerald-700"
            >
              Percakapan baru
            </Link>

            <div className="flex-1 overflow-y-auto min-h-0">
              <Suspense fallback={null}>
                <HistoryList
                  list={conversations}
                  onChanged={reloadConversations}
                  onNavigate={() => setHistoryOpen(false)}
                />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {/* Sheet akun (mobile, khusus pengguna login) */}
      {sheetOpen && user && (
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
            aria-label="Menu akun"
            className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl px-4 pt-4"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 grid place-items-center text-[11px] font-medium text-emerald-700 flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-gray-800 truncate">{email}</p>
                  <p className="text-[11px] text-gray-500">Plan: {planBadge}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Tutup"
                className="w-8 h-8 grid place-items-center rounded-full text-gray-500 hover:bg-gray-100 flex-shrink-0"
              >
                <Icon.Close />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <Link href="/update_profile" className="flex items-center gap-3 px-3 py-3 rounded-xl text-[13px] text-gray-700 hover:bg-gray-50">
                <span className="text-gray-500"><Icon.UserCircle /></span>
                Akun saya
              </Link>
              <Link href="/plan" className="flex items-center gap-3 px-3 py-3 rounded-xl text-[13px] text-gray-700 hover:bg-gray-50">
                <span className="text-gray-500"><Icon.Star /></span>
                Plan &amp; penggunaan
              </Link>
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-[13px] text-red-600 hover:bg-red-50 text-left"
              >
                <Icon.Logout />
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      <nav
        aria-label="Navigasi utama"
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100 flex justify-around items-center px-2 pt-2"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
      >
        {items.map((item) => (
          <Fragment key={item.href}>
            <MobileItem item={item} active={isActive(item.href)} />
            {/* Riwayat muncul tepat setelah Asisten */}
            {item.href === CHAT_HREF && historyButton}
          </Fragment>
        ))}

        {loading ? (
          <span aria-hidden="true" className="w-10 h-10 rounded-lg bg-gray-100" />
        ) : user ? (
          <button
            type="button"
            onClick={() => {
              setHistoryOpen(false);
              setSheetOpen((v) => !v);
            }}
            aria-expanded={sheetOpen}
            aria-haspopup="dialog"
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors"
            style={accountActive ? { background: "#ecfdf5" } : {}}
          >
            <Icon.Account active={accountActive} />
            <span className="text-[10px] font-medium" style={{ color: accountActive ? "#059669" : "#6b7280" }}>
              Akun
            </span>
          </button>
        ) : (
          <MobileItem item={{ href: "/login", short: "Masuk", Icon: Icon.Account }} active={false} />
        )}
      </nav>

      {/* ═════════════ DESKTOP (≥ md) ═════════════ */}
      <aside
        data-user-menu
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setHovered(false);
        }}
        className="hidden md:flex fixed top-0 left-0 h-screen bg-white border-r border-gray-100 flex-col z-50 overflow-hidden transition-[width] duration-200 ease-in-out motion-reduce:transition-none"
        style={{ width: expanded ? 220 : 64 }}
      >
        {/* Logo */}
        <Link href={homeHref} className="flex items-center gap-3 px-4 py-[18px] border-b border-gray-100 flex-shrink-0" aria-label="Labain, ke beranda">
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
        <nav aria-label="Navigasi utama" className="p-2 flex flex-col gap-0.5 flex-shrink-0">
          {items.map((item) => (
            <DesktopItem key={item.href} item={item} active={isActive(item.href)} expanded={expanded} />
          ))}
        </nav>

        {/* Riwayat percakapan (tampil saat sidebar terbuka) */}
        <div className="flex-1 min-h-0 flex flex-col">
          {user && expanded && (
            <>
              <div className="flex items-center justify-between px-4 pt-3 pb-1 border-t border-gray-100 flex-shrink-0">
                <span className="text-[11px] font-semibold text-gray-500">Riwayat</span>
                <Link href={CHAT_HREF} className={`rounded text-[11px] font-medium text-emerald-700 hover:text-emerald-800 ${focusRing}`}>
                  + Baru
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2">
                <Suspense fallback={null}>
                  <HistoryList list={conversations} onChanged={reloadConversations} hoverDelete />
                </Suspense>
              </div>
            </>
          )}
        </div>

        {/* User section */}
        <div className="p-2 border-t border-gray-100 flex-shrink-0">
          {loading ? (
            <div className="px-2 py-1.5">
              <span aria-hidden="true" className="block w-8 h-8 rounded-full bg-gray-100" />
            </div>
          ) : user ? (
            <div className="relative">
              {menuOpen && (
                <div className="absolute bottom-[calc(100%+6px)] left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-sm p-1 z-50">
                  <div className="flex items-center gap-2 px-2.5 py-2 mb-1 rounded-lg bg-gray-50">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 grid place-items-center text-[10px] font-medium text-emerald-700 flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-gray-800 truncate max-w-[130px]">{email}</p>
                      <p className="text-[10px] text-gray-500">Plan: {planBadge}</p>
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