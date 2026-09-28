/** Test prices shown on the landing page. Change here only. */
export const PRICING = {
  currency: "₫",
  monthly: 49000,
  yearly: 349000,
  isTestPrice: true,
} as const;

export function formatVnd(n: number) {
  return `${n.toLocaleString("vi-VN")}${PRICING.currency}`;
}
