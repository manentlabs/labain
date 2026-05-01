export const PLANS = {
  FREE: {
    label: "Gratis",
    price: 0,
    color: "#6b7280",
    limits: {
      caption:  5,
      logo:     0,
      photo:    0,
      profile:  1,
    },
    features: {
      caption:        true,
      logo:           false,
      photo:          false,
      profile:        true,
    },
  },
  STARTER: {
    label: "Starter",
    price: 49000,
    color: "#2563eb",
    limits: {
      caption:  20,
      logo:     2,
      photo:    5,
      profile:  5,
    },
    features: {
      caption:        true,
      logo:           true,
      photo:          true,
      profile:        true,
    },
  },
  PRO: {
    label: "Pro",
    price: 129000,
    color: "#059669",
    limits: {
      caption:  100,
      logo:     10,
      photo:    20,
      profile:  50,
    },
    features: {
      caption:        true,
      logo:           true,
      photo:          true,
      profile:        true,
    },
  },
};

export function canAccessFeature(plan, feature) {
  return PLANS[plan]?.features?.[feature] ?? false;
}

export function getDailyLimit(plan, feature) {
  return PLANS[plan]?.limits?.[feature] ?? 0;
}