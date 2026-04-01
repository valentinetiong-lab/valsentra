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

  if (score > 100) score = 100;
  if (score < 0) score = 0;

  return score;
}