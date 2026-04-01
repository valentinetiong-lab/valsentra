export type ReliabilityEvent =
  | "ORDER_COMPLETED"
  | "DEPOSIT_PAID"
  | "ORDER_CANCELLED"
  | "NO_SHOW"
  | "LATE_ARRIVAL"
  | "FRAUD_ATTEMPT";

const RELIABILITY_WEIGHTS: Record<ReliabilityEvent, number> = {
  ORDER_COMPLETED: 2,
  DEPOSIT_PAID: 5,
  ORDER_CANCELLED: -10,
  NO_SHOW: -25,
  LATE_ARRIVAL: -5,
  FRAUD_ATTEMPT: -40,
};

function clampScore(score: number) {
  if (score > 100) return 100;
  if (score < 0) return 0;
  return score;
}

export function applyReliabilityEvent(
  currentScore: number,
  event: ReliabilityEvent
) {
  const nextScore = currentScore + RELIABILITY_WEIGHTS[event];
  return clampScore(nextScore);
}

export function calculateReliability(customer: {
  completed: number;
  cancelled: number;
  noShows: number;
  depositsPaid: number;
  late: number;
}) {
  let score = 100;

  score += customer.completed * 2;
  score -= customer.cancelled * 10;
  score -= customer.noShows * 25;
  score += customer.depositsPaid * 5;
  score -= customer.late * 5;

  return clampScore(score);
}

export function getReliabilityBand(score: number) {
  if (score <= 10) return "BLACKLISTED";
  if (score < 50) return "RISKY";
  if (score < 75) return "WATCH";
  return "TRUSTED";
}