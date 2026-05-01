"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const s = {
  page: {
    maxWidth: 520,
    margin: "0 auto",
    padding: "2rem 1.25rem",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  },
  title: {
    fontSize: 18,
    fontWeight: 500,
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 28,
  },
  card: {
    background: "#fff",
    border: "0.5px solid #f0f0f0",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  sectionLast: {
    padding: "20px 22px",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "#111827",
    marginBottom: 16,
    display: "flex",
    alignItems: "center",
    gap: 7,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#10b981",
    display: "inline-block",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: "#6b7280",
    marginBottom: 6,
    display: "block",
  },
  input: {
    width: "100%",
    border: "0.5px solid #e5e7eb",
    borderRadius: 9,
    padding: "10px 13px",
    fontSize: 13,
    color: "#111827",
    background: "#fafafa",
    outline: "none",
    fontFamily: "inherit",
    transition: "border 0.15s, box-shadow 0.15s, background 0.15s",
    marginBottom: 12,
    boxSizing: "border-box",
  },
  inputFocus: {
    border: "0.5px solid #10b981",
    boxShadow: "0 0 0 3px rgba(16,185,129,0.12)",
    background: "#fff",
  },
  hint: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: -8,
    marginBottom: 12,
  },
  btn: {
    width: "100%",
    padding: "11px 0",
    borderRadius: 9,
    border: "none",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    transition: "opacity 0.15s, background 0.15s",
    background: "#10b981",
    color: "#fff",
  },
  btnDisabled: {
    background: "#f3f4f6",
    color: "#d1d5db",
    cursor: "not-allowed",
  },
  toast: {
    position: "fixed",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: 13,
    fontWeight: 500,
    padding: "10px 18px",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    gap: 8,
    zIndex: 999,
    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
    transition: "opacity 0.3s",
  },
  googleCard: {
    background: "#f9fafb",
    border: "0.5px solid #f0f0f0",
    borderRadius: 12,
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  googleIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: "#fff",
    border: "0.5px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
};

function Field({ label, type = "text", value, onChange, placeholder, hint, focusedKey, setFocusedKey, fieldKey }) {
  const isFocused = focusedKey === fieldKey;
  return (
    <div>
      <label style={s.fieldLabel}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...s.input, ...(isFocused ? s.inputFocus : {}) }}
        onFocus={() => setFocusedKey(fieldKey)}
        onBlur={() => setFocusedKey(null)}
      />
      {hint && <p style={s.hint}>{hint}</p>}
    </div>
  );
}

function SaveButton({ loading, disabled, onClick, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{ ...s.btn, ...(disabled || loading ? s.btnDisabled : {}) }}
      onMouseOver={(e) => { if (!disabled && !loading) e.currentTarget.style.background = "#059669"; }}
      onMouseOut={(e) => { if (!disabled && !loading) e.currentTarget.style.background = "#10b981"; }}
    >
      {loading ? (
        <>
          <svg style={{ animation: "spin 0.7s linear infinite" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Menyimpan...
        </>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

function Toast({ message, type }) {
  if (!message) return null;
  const isError = type === "error";
  return (
    <div style={{
      ...s.toast,
      background: isError ? "#fef2f2" : "#ecfdf5",
      color: isError ? "#b91c1c" : "#065f46",
      border: `0.5px solid ${isError ? "#fca5a5" : "#6ee7b7"}`,
    }}>
      {isError ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {message}
    </div>
  );
}

export default function UpdateProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const isGoogleAccount = session?.user?.image?.includes("googleusercontent.com") || !session?.user?.hasPassword;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [focusedKey, setFocusedKey] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name ?? "");
      setEmail(session.user.email ?? "");
    }
  }, [session]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 3000);
  };

  const handleSaveProfile = async () => {
    if (!name.trim() || !email.trim()) return;
    setLoadingProfile(true);
    try {
      const res = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal menyimpan profil");
      await updateSession({ name, email });
      showToast("Profil berhasil diperbarui");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      showToast("Password baru tidak cocok", "error");
      return;
    }
    if (newPassword.length < 8) {
      showToast("Password minimal 8 karakter", "error");
      return;
    }
    setLoadingPassword(true);
    try {
      const res = await fetch("/api/user/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal mengubah password");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password berhasil diubah");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoadingPassword(false);
    }
  };

  const profileChanged =
    name !== (session?.user?.name ?? "") ||
    email !== (session?.user?.email ?? "");

  const passwordFilled = currentPassword && newPassword && confirmPassword;

  return (
    <div style={s.page}>
      <h1 style={s.title}>Pengaturan Akun</h1>
      <p style={s.subtitle}>Perbarui informasi profil dan keamanan akunmu.</p>

      {/* Profile card */}
      <div style={s.card}>
        <div style={s.sectionLast}>
          <p style={s.sectionTitle}>
            <span style={s.sectionDot} />
            Informasi Profil
          </p>
          <Field label="Nama lengkap" value={name} onChange={setName} placeholder="Nama kamu" fieldKey="name" focusedKey={focusedKey} setFocusedKey={setFocusedKey} />
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="email@kamu.com"
            hint={isGoogleAccount ? "Email terhubung dengan Google." : "Mengubah email akan mempengaruhi login kamu."}
            fieldKey="email" focusedKey={focusedKey} setFocusedKey={setFocusedKey}
          />
          <SaveButton loading={loadingProfile} disabled={!profileChanged} onClick={handleSaveProfile} label="Simpan profil" />
        </div>
      </div>

      {/* Password card */}
      {!isGoogleAccount ? (
        <div style={s.card}>
          <div style={s.sectionLast}>
            <p style={s.sectionTitle}>
              <span style={s.sectionDot} />
              Ubah Password
            </p>
            <Field label="Password saat ini" type="password" value={currentPassword} onChange={setCurrentPassword} placeholder="••••••••" fieldKey="currentPassword" focusedKey={focusedKey} setFocusedKey={setFocusedKey} />
            <Field label="Password baru" type="password" value={newPassword} onChange={setNewPassword} placeholder="••••••••" fieldKey="newPassword" focusedKey={focusedKey} setFocusedKey={setFocusedKey} />
            <Field label="Konfirmasi password baru" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" fieldKey="confirmPassword" focusedKey={focusedKey} setFocusedKey={setFocusedKey} />
            <SaveButton loading={loadingPassword} disabled={!passwordFilled} onClick={handleSavePassword} label="Ubah password" />
          </div>
        </div>
      ) : (
        <div style={s.googleCard}>
          <div style={s.googleIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 2 }}>Login via Google</p>
            <p style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.5 }}>Password dikelola melalui pengaturan akun Google kamu.</p>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}