"use client";

import { useEffect, useState } from "react";
import { PLANS, canAccessFeature, getDailyLimit } from "@/app/lib/plan";

export function usePlan() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/user/plan")
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (!r.ok) throw new Error(d?.error || "Gagal memuat paket");
        return d;
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const plan = data?.plan && PLANS[data.plan] ? data.plan : null;
  const usage = Array.isArray(data?.usage) ? data.usage : [];

  /**
   * Cek apakah fitur bisa diakses di paket aktif (limit harian > 0).
   * @param {string} feature
   */
  function canAccess(feature) {
    return plan ? canAccessFeature(plan, feature) : false;
  }

  /**
   * Ambil sisa kuota hari ini untuk sebuah fitur.
   * Limit diambil dari data usage; jika belum ada, dari definisi paket.
   * @param {string} feature
   * @returns {{ used: number, limit: number, remaining: number }}
   */
  function getQuota(feature) {
    const item = usage.find((u) => u.feature === feature);
    const used = item?.used ?? 0;
    const limit = item?.limit ?? (plan ? getDailyLimit(plan, feature) : 0);
    return { used, limit, remaining: Math.max(0, limit - used) };
  }

  return {
    loading,
    plan,
    planLabel: data?.planLabel ?? null,
    planExpiry: data?.planExpiry ?? null,
    usage,
    canAccess,
    getQuota,
  };
}