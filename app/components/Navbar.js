"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

// ── Icons ──────────────────────────────────────────────────
const Icon = {
  Home: ({ active }) => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
        stroke={active ? "#059669" : "currentColor"} strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M8 18v-5h4v5"
        stroke={active ? "#059669" : "currentColor"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Caption: ({ active }) => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M4 4h12a1 1 0 011 1v7a1 1 0 01-1 1H7l-4 3V5a1 1 0 011-1z"
        stroke={active ? "#059669" : "currentColor"} strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  Profile: ({ active }) => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3" stroke={active ? "#059669" : "currentColor"} strokeWidth="1.4"/>
      <path d="M4 17c0-3.314 2.686-5 6-5s6 1.686 6 5"
        stroke={active ? "#059669" : "currentColor"} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  Logo: ({ active }) => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke={active ? "#059669" : "currentColor"} strokeWidth="1.4"/>
      <circle cx="10" cy="10" r="2.5" stroke={active ? "#059669" : "currentColor"} strokeWidth="1.4"/>
      <path d="M10 3v2M10 15v2M3 10h2M15 10h2"
        stroke={active ? "#059669" : "currentColor"} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  Foto: ({ active }) => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="5" width="16" height="12" rx="2" stroke={active ? "#059669" : "currentColor"} strokeWidth="1.4"/>
      <circle cx="10" cy="11" r="3" stroke={active ? "#059669" : "currentColor"} strokeWidth="1.4"/>
      <path d="M7 5l1-2h4l1 2"
        stroke={active ? "#059669" : "currentColor"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  UserCircle: () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M3 14c0-2.761 2.239-4 5-4s5 1.239 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  Star: () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5l3.5-.5z"
        stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  ),
  Logout: () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M10 11l3-3-3-3M13 8H6M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  ChevronUp: () => (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

const navItems = [
  { href: "/",        label: "Home",        Icon: Icon.Home },
  { href: "/caption", label: "Caption",     Icon: Icon.Caption },
  { href: "/profile", label: "Profile",     Icon: Icon.Profile },
  { href: "/logo",    label: "Logo Usaha",  Icon: Icon.Logo },
  { href: "/photo",   label: "Foto Produk", Icon: Icon.Foto },
];

const mobileNavItems = [navItems[0], navItems[1], navItems[3], navItems[4]];

export default function Navbar() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();
  const user = session?.user;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (!e.target.closest("[data-user-menu]")) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const logout = () => signOut({ callbackUrl: "/login" });

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "??";

  const [userPlan, setUserPlan] = useState("FREE");
  
  useEffect(() => {
	  if (!user) return;

	  fetch("/api/user/plan")
		.then(res => res.json())
		.then(data => {
		  setUserPlan(data.plan || "FREE");
		});
	}, [user]);

if (isMobile) {
  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 h-12 bg-white border-b border-gray-100 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img
            src="/labain.png"
            alt="Logo LabAIn"
            className="w-7 h-7 object-contain"
          />
          <h1 className="text-base font-bold text-gray-800">
            Lab<span className="text-emerald-600">AI</span>n
          </h1>
        </div>
        {user && (
		  <Link
			href="/update_profile"
			className="text-[11px] text-gray-400 truncate max-w-[140px] hover:text-emerald-600 transition-colors"
		  >
			{user.email}
		  </Link>
		)}
      </header>

      <div className="h-12" />

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100 flex justify-around items-center px-2 pb-safe pt-2">
        {mobileNavItems.slice(0, 2).map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors"
              style={active ? { background: "#ecfdf5" } : {}}
            >
              <item.Icon active={active} />
              <span
                className="text-[10px] font-medium"
                style={{ color: active ? "#059669" : "#9ca3af" }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        <Link
		  href={user ? "/plan" : "/register"}
		  className="w-10 h-10 rounded-full bg-emerald-600 grid place-items-center shadow-md shadow-emerald-200"
		>
		  <Icon.Profile />
		</Link>

        {mobileNavItems.slice(2).map((item) => {
          const active = pathname === item.href;
          const shortLabel = item.label === "Logo Usaha" ? "Logo" : "Foto";
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors"
              style={active ? { background: "#ecfdf5" } : {}}
            >
              <item.Icon active={active} />
              <span
                className="text-[10px] font-medium"
                style={{ color: active ? "#059669" : "#9ca3af" }}
              >
                {shortLabel}
              </span>
            </Link>
          );
        })}
      </nav>

    </>
  );
}

  // ── DESKTOP ─────────────────────────────────────────────
  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => { setExpanded(false); setMenuOpen(false); }}
      className="fixed top-0 left-0 h-screen bg-white border-r border-gray-100 flex flex-col z-50 overflow-hidden transition-[width] duration-200 ease-in-out"
      style={{ width: expanded ? 220 : 64 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-[18px] border-b border-gray-100 flex-shrink-0">
        <div className="w-8 h-8 flex-shrink-0">
		  <img 
			src="/labain.png" 
			alt="Icon Labain" 
			className="w-full h-full object-cover rounded-lg"
		  />
		</div>
        {expanded && (
          <span className="text-sm font-medium text-gray-800 whitespace-nowrap">
			  Lab<span className="text-emerald-500">AI</span>n
			</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 flex flex-col gap-0.5 overflow-hidden">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-2 py-2 rounded-lg transition-colors"
              style={active ? { background: "#ecfdf5" } : {}}
            >
              <span
                className="w-8 h-8 grid place-items-center flex-shrink-0"
                style={{ color: active ? "#059669" : "#9ca3af" }}
              >
                <item.Icon active={active} />
              </span>
              {expanded && (
                <span
                  className="text-[13px] whitespace-nowrap transition-colors"
                  style={{ color: active ? "#059669" : "#6b7280" }}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-2 border-t border-gray-100 flex-shrink-0" data-user-menu>
        {user ? (
          <div className="relative">
            {/* Dropdown */}
            {menuOpen && (
              <div className="absolute bottom-[calc(100%+6px)] left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-sm p-1 z-50">
                {/* User info row */}
                <div className="flex items-center gap-2 px-2.5 py-2 mb-1 rounded-lg bg-gray-50">
                  <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 grid place-items-center text-[10px] font-medium text-emerald-700 flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-gray-800 truncate max-w-[130px]">{user.email}</p>
                    <p className="text-[10px] text-gray-400">
					  Plan:{" "}
					  <span
						style={{
						  color:
							userPlan === "PRO"
							  ? "#f59e0b"
							  : userPlan === "STARTER"
							  ? "#059669"
							  : "#9ca3af",
						  fontWeight: 500,
						}}
					  >
						{userPlan}
					  </span>
					</p>
                  </div>
                </div>

                <Link
                  href="/update_profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 w-full px-2.5 py-2 text-[12.5px] text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-gray-400"><Icon.UserCircle /></span>
                  Profil saya
                </Link>

                <Link
                  href="/plan"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 w-full px-2.5 py-2 text-[12.5px] text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-gray-400"><Icon.Star /></span>
                  Pilih plan
                </Link>

                <hr className="my-1 border-gray-100" />

                <button
                  onClick={logout}
                  className="flex items-center gap-2.5 w-full px-2.5 py-2 text-[12.5px] text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Icon.Logout />
                  Keluar
                </button>
              </div>
            )}

            {/* Trigger button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 grid place-items-center text-[11px] font-medium text-emerald-700 flex-shrink-0">
                {initials}
              </div>
              {expanded && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[11px] font-medium text-gray-800 truncate max-w-[110px]">{user.email}</p>
                    <p className="text-[10px] text-gray-400">Klik untuk menu</p>
                  </div>
                  <span
                    className="text-gray-300 flex-shrink-0 transition-transform duration-150"
                    style={{ transform: menuOpen ? "rotate(180deg)" : "none" }}
                  >
                    <Icon.ChevronUp />
                  </span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-gray-100 grid place-items-center text-xs text-gray-400 flex-shrink-0">
              ?
            </div>
            {expanded && (
              <div>
                <p className="text-[10px] text-gray-400">Belum punya akun?</p>
                <Link href="/register" className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700">
                  Daftar sekarang
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}