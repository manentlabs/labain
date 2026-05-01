"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { PLANS } from "@/app/lib/plan";

const FEATURES_LABEL = {
  caption:      "Generate caption",
  logo:         "Buat logo usaha",
  photo:        "Foto produk AI",
  profile:      "Profil bisnis usaha",
  customStyle:  "Gaya kustom",
  hd:           "Kualitas HD",
  bulkGenerate: "Generate massal",
};

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M3 8l3.5 3.5L13 4" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CrossIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path d="M5 5l6 6M11 5l-6 6" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

function UsageBar({ used, limit }) {
  const pct = limit >= 999 ? 100 : Math.min((used / limit) * 100, 100);
  const full = used >= limit && limit < 999;
  return (
    <div style={{
      width: "100%",
      background: "#f3f4f6",
      borderRadius: 100,
      height: 3,
      marginTop: 8,
      overflow: "hidden",
    }}>
      <div style={{
        width: `${pct}%`,
        height: "100%",
        borderRadius: 100,
        background: full ? "#ef4444" : "#059669",
        transition: "width 0.4s ease",
      }} />
    </div>
  );
}

function PlanCard({ planKey, plan, isActive, isFeatured, onUpgrade }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      border: isActive ? `1.5px solid ${plan.color}` : "0.5px solid #f0f0f0",
      padding: isFeatured ? "28px 16px 18px" : "18px 16px",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      transition: "border-color 0.2s",
    }}>

      {isFeatured && (
        <div style={{
          position: "absolute",
          top: -1,
          left: "50%",
          transform: "translateX(-50%)",
          background: plan.color,
          color: "#fff",
          fontSize: 10,
          fontWeight: 500,
          padding: "3px 12px",
          borderRadius: "0 0 8px 8px",
          whiteSpace: "nowrap",
          letterSpacing: "0.03em",
        }}>
          Terpopuler
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{plan.label}</span>
        {isActive && (
          <span style={{
            fontSize: 10,
            fontWeight: 500,
            padding: "2px 8px",
            borderRadius: 100,
            background: `${plan.color}18`,
            color: plan.color,
          }}>
            Aktif
          </span>
        )}
      </div>

      <div style={{ fontSize: 22, fontWeight: 500, color: "#111827", marginBottom: 14 }}>
        {plan.price === 0 ? (
          "Gratis"
        ) : (
          <>
            Rp{plan.price.toLocaleString("id-ID")}
            <span style={{ fontSize: 12, fontWeight: 400, color: "#9ca3af" }}>/bulan</span>
          </>
        )}
      </div>

      <div style={{ borderTop: "0.5px solid #f3f4f6", margin: "0 0 12px" }} />

      <p style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>
        Limit harian
      </p>
      <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
        {Object.entries(plan.limits).map(([feat, lim]) => (
          <div key={feat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>{FEATURES_LABEL[feat] ?? feat}</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: "#374151" }}>
              {lim >= 999 ? "Unlimited" : `${lim}×`}
            </span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "0.5px solid #f3f4f6", margin: "0 0 12px" }} />

      <p style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>
        Fitur
      </p>
      <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 6 }}>
        {Object.entries(plan.features).map(([feat, enabled]) => (
          <div key={feat} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            {enabled ? <CheckIcon /> : <CrossIcon />}
            <span style={{ fontSize: 11, color: enabled ? "#374151" : "#d1d5db" }}>
              {FEATURES_LABEL[feat] ?? feat}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "auto" }}>
        {isActive ? (
          <div style={{
            width: "100%",
            padding: "8px 0",
            textAlign: "center",
            fontSize: 12,
            color: plan.color,
            border: `0.5px solid ${plan.color}`,
            borderRadius: 8,
          }}>
            Plan saat ini
          </div>
        ) : (
          <button
            style={{
              width: "100%",
              padding: "8px 0",
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 8,
              border: "none",
              background: planKey === "FREE" ? "#f3f4f6" : plan.color,
              color: planKey === "FREE" ? "#6b7280" : "#fff",
              cursor: "pointer",
              transition: "opacity 0.15s",
            }}
            onMouseOver={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseOut={e => (e.currentTarget.style.opacity = "1")}
            onClick={() =>
			  onUpgrade({
				key: planKey,
				label: plan.label,
				price: plan.price,
			  })
			}
          >
            {planKey === "FREE" ? "Downgrade ke Free" : `Upgrade ke ${plan.label}`}
          </button>
        )}
      </div>
    </div>
  );
}

function PaymentModal({ plan, onClose }) {
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState(null);
  const pollRef = useRef(null);

  // Bersihkan interval saat komponen unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Mulai polling setelah orderId tersedia
  useEffect(() => {
    if (!orderId) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?order_id=${orderId}`);
        const data = await res.json();
        const status = data?.transaction_status;

        if (status === "settlement" || status === "capture") {
          // Pembayaran berhasil
          clearInterval(pollRef.current);
          onClose();
          window.location.reload();
        } else if (status === "cancel" || status === "deny" || status === "expire") {
          // Pembayaran gagal/expired
          clearInterval(pollRef.current);
          onClose();
        }
        // status "pending" → lanjut polling
      } catch {
        // Abaikan error jaringan, polling tetap jalan
      }
    }, 3000);

    return () => clearInterval(pollRef.current);
  }, [orderId]);

  // Buat transaksi & buka Snap
  useEffect(() => {
    const startPayment = async () => {
      try {
        const res = await fetch("/api/payment/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });
        const data = await res.json();
        setLoading(false);

        if (data.order_id) setOrderId(data.order_id);

        window.snap.pay(data.token, {
          onSuccess: () => {
            clearInterval(pollRef.current);
            onClose();
            window.location.reload();
          },
          onPending: () => {
            // Snap tutup tapi status pending — polling tetap aktif
          },
          onError: () => {
            clearInterval(pollRef.current);
            onClose();
          },
          onClose: () => {
            // User tutup popup — polling tetap aktif sampai expire/sukses
          },
        });
      } catch {
        setLoading(false);
        onClose();
      }
    };

    startPayment();
  }, [plan]);

  if (!loading) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 18, height: 18,
          border: "2px solid #fff",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }} />
        <span style={{ color: "#fff", fontSize: 14 }}>Menyiapkan pembayaran...</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}


export default function PlanPage() {
  useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(null);

  useEffect(() => {
    fetch("/api/user/plan")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{
          width: 22, height: 22,
          border: "2px solid #059669",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.25rem", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      <h1 style={{ fontSize: 18, fontWeight: 500, color: "#111827", marginBottom: 4 }}>
        Plan &amp; Penggunaan
      </h1>
      <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 32 }}>
        Kelola langganan dan pantau penggunaan harian kamu.
      </p>

      {/* ── USAGE ── */}
      <section style={{ marginBottom: 36 }}>
        <p style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
          Penggunaan hari ini
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 10,
        }}>
          {data?.usage?.map(({ feature, used, limit }) => (
            <div key={feature} style={{
              background: "#fff",
              border: "0.5px solid #f0f0f0",
              borderRadius: 14,
              padding: "12px 14px",
            }}>
              <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
                {FEATURES_LABEL[feature] ?? feature}
              </p>
              <p style={{ fontSize: 18, fontWeight: 500, color: "#111827" }}>
                {used}{" "}
                <span style={{ fontSize: 12, fontWeight: 400, color: "#9ca3af" }}>
                  / {limit >= 999 ? "∞" : limit}
                </span>
              </p>
              <UsageBar used={used} limit={limit} />
            </div>
          ))}
        </div>

        {data?.planExpiry && (
          <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 10 }}>
            Plan aktif hingga:{" "}
            <span style={{ color: "#6b7280", fontWeight: 500 }}>
              {new Date(data.planExpiry).toLocaleDateString("id-ID", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </span>
          </p>
        )}
      </section>

      {/* ── PLANS ── */}
      <section>
        <p style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
          Pilih plan
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
        }}>
          {Object.keys(PLANS).map(key => (
            <PlanCard
              key={key}
              planKey={key}
              plan={PLANS[key]}
              isActive={(data?.plan ?? "FREE") === key}
              isFeatured={key === "PRO"}
              onUpgrade={selectedPlan => {
                if (key === "FREE") alert("Konfirmasi downgrade?");
                else setShowPayment(selectedPlan);
              }}
            />
          ))}
        </div>
      </section>

      {showPayment && (
        <PaymentModal plan={showPayment} onClose={() => setShowPayment(null)} />
      )}
    </div>
  );
}