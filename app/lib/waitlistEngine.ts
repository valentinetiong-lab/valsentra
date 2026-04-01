type OrderType =
  | "DINE_IN_RESERVATION"
  | "PREORDER_PICKUP"
  | "DELIVERY_PREORDER";

export type WaitlistLead = {
  id: number;
  customerName: string;
  phone: string;
  preferredType: OrderType;
  showProbability: number;
  responseSpeedScore: number;
  reliabilityScore: number;
};

export type RecoverableOrder = {
  id: string;
  orderType: OrderType;
  amount: number;
};

export type WaitlistMatchResult = {
  bestLead: WaitlistLead | null;
  recoverableRevenue: number;
  recoveryScore: number;
  reason: string;
};

function calculateLeadScore(lead: WaitlistLead) {
  return (
    lead.showProbability * 0.5 +
    lead.responseSpeedScore * 0.2 +
    lead.reliabilityScore * 0.3
  );
}

export function findBestWaitlistLead(
  order: RecoverableOrder,
  waitlist: WaitlistLead[]
): WaitlistMatchResult {
  const matches = waitlist.filter(
    (lead) => lead.preferredType === order.orderType
  );

  if (matches.length === 0) {
    return {
      bestLead: null,
      recoverableRevenue: 0,
      recoveryScore: 0,
      reason: "No suitable waitlist lead found",
    };
  }

  const sorted = [...matches].sort(
    (a, b) => calculateLeadScore(b) - calculateLeadScore(a)
  );

  const bestLead = sorted[0];
  const recoveryScore = Math.round(calculateLeadScore(bestLead));

  return {
    bestLead,
    recoverableRevenue: order.amount,
    recoveryScore,
    reason:
      "Best fit based on show probability, response speed, and reliability",
  };
}