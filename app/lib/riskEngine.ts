export function calculateRiskScore(order: {
  amount: number;
  reliabilityScore?: number;
  depositPaid?: boolean;
  isNewCustomer?: boolean;
  orderType?: string;
}) {
  let score = 0;

  // High value order
  if (order.amount >= 300) score += 2;
  else if (order.amount >= 150) score += 1;

  // New customer = higher risk
  if (order.isNewCustomer) score += 2;

  // Low reliability = higher risk
  if ((order.reliabilityScore ?? 100) < 50) score += 2;
  else if ((order.reliabilityScore ?? 100) < 70) score += 1;

  // No deposit paid = higher risk
  if (!order.depositPaid) score += 2;

  // Pickup orders slightly riskier than dine-in
  if (order.orderType === "PICKUP") score += 1;

  return score;
}

export function getRiskLevel(score: number): "LOW" | "MED" | "HIGH" {
  if (score >= 5) return "HIGH";
  if (score >= 3) return "MED";
  return "LOW";
}