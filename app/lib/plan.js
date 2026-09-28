/**
 * limits   : batas pemakaian per hari. 0 = tidak tersedia. >= 999 = tanpa batas.
 * capacity : kapasitas data yang disimpan (bukan kuota harian).
 */
export const PLANS = {
  FREE: {
    label: "Gratis",
    price: 0,
    color: "#6b7280",
    limits: { caption: 5, logo: 0, photo: 0, profile: 1, finance: 10, hpp: 3 },
    capacity: { historyDays: 7, products: 3 },
  },
  STARTER: {
    label: "Starter",
    price: 49000,
    color: "#2563eb",
    limits: { caption: 20, logo: 2, photo: 5, profile: 5, finance: 50, hpp: 15 },
    capacity: { historyDays: 90, products: 20 },
  },
  PRO: {
    label: "Pro",
    price: 129000,
    color: "#059669",
    limits: { caption: 100, logo: 10, photo: 20, profile: 50, finance: 999, hpp: 100 },
    capacity: { historyDays: 365, products: 200 },
  },
};

/** @typedef {"caption" | "logo" | "photo" | "profile" | "finance" | "hpp"} ToolKey */

/**
 * @param {keyof typeof PLANS} plan
 * @param {ToolKey} tool
 * @returns {number}
 */
export function getDailyLimit(plan, tool) {
  return PLANS[plan]?.limits?.[tool] ?? 0;
}

/**
 * Fitur dianggap tersedia jika batas hariannya lebih dari 0.
 * @param {keyof typeof PLANS} plan
 * @param {ToolKey} tool
 * @returns {boolean}
 */
export function canAccessFeature(plan, tool) {
  return getDailyLimit(plan, tool) > 0;
}

/**
 * @param {keyof typeof PLANS} plan
 * @param {"historyDays" | "products"} key
 * @returns {number}
 */
export function getCapacity(plan, key) {
  return PLANS[plan]?.capacity?.[key] ?? 0;
}