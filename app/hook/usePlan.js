import { useEffect, useState } from "react";

export function usePlan() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/plan")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  /**
   * Cek apakah fitur bisa diakses
   * @param {string} feature
   */
  function canAccess(feature) {
    return data?.features?.[feature] ?? false;
  }

  /**
   * Ambil sisa quota hari ini untuk sebuah fitur
   * @param {string} feature
   * @returns {{ used: number, limit: number, remaining: number }}
   */
  function getQuota(feature) {
    const item = data?.usage?.find((u) => u.feature === feature);
    const used = item?.used ?? 0;
    const limit = item?.limit ?? 0;
    return { used, limit, remaining: Math.max(0, limit - used) };
  }

  return {
    loading,
    plan: data?.plan ?? null,
    planLabel: data?.planLabel ?? null,
    planExpiry: data?.planExpiry ?? null,
    features: data?.features ?? {},
    usage: data?.usage ?? [],
    canAccess,
    getQuota,
  };
}