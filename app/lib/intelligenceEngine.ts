export type OrderRecord = {
  id: string;
  customerName: string;
  staffName?: string;
  amount: number;
  status: "PAID" | "CANCELLED" | "NO_SHOW" | "PENDING";
  riskLevel?: "LOW" | "MED" | "HIGH";
  reliabilityScore?: number;
  reservationTime: string;
  recovered?: boolean;
  createdAt?: string;
};

// 1. Dangerous Customers
export function getDangerousCustomers(orders: OrderRecord[]) {
  const map: Record<string, { noShows: number; cancelled: number; total: number }> = {};

  for (const o of orders) {
    if (!map[o.customerName]) {
      map[o.customerName] = { noShows: 0, cancelled: 0, total: 0 };
    }

    map[o.customerName].total++;

    if (o.status === "NO_SHOW") map[o.customerName].noShows++;
    if (o.status === "CANCELLED") map[o.customerName].cancelled++;
  }

  return Object.entries(map)
    .map(([name, data]) => ({
      customerName: name,
      noShows: data.noShows,
      cancelled: data.cancelled,
      total: data.total,
      riskScore: data.noShows * 2 + data.cancelled,
    }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);
}

// 2. Worst Time Slots
export function getWorstTimeSlots(orders: OrderRecord[]) {
  const slots: Record<string, number> = {};

  for (const o of orders) {
    if (o.status === "CANCELLED" || o.status === "NO_SHOW") {
      const hour = new Date(o.reservationTime).getHours();
      const key = `${hour}:00`;
      slots[key] = (slots[key] || 0) + 1;
    }
  }

  return Object.entries(slots)
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

// 3. Staff Mistakes
export function getStaffMistakes(orders: OrderRecord[]) {
  const staff: Record<string, number> = {};

  for (const o of orders) {
    if (o.status === "CANCELLED" || o.status === "NO_SHOW") {
      const name = o.staffName || "Unknown";
      staff[name] = (staff[name] || 0) + 1;
    }
  }

  return Object.entries(staff)
    .map(([name, mistakes]) => ({ name, mistakes }))
    .sort((a, b) => b.mistakes - a.mistakes);
}

// 4. Money Saved This Month
export function getMoneySavedThisMonth(orders: OrderRecord[]) {
  const now = new Date();
  let saved = 0;

  for (const o of orders) {
    if (!o.createdAt) continue;
    const d = new Date(o.createdAt);

    if (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear() &&
      o.recovered
    ) {
      saved += o.amount;
    }
  }

  return saved;
}

// 5. Predicted No-Show Probability
export function predictNoShowProbability(order: OrderRecord) {
  let score = 0;

  if (order.riskLevel === "HIGH") score += 40;
  if (order.riskLevel === "MED") score += 20;

  if ((order.reliabilityScore ?? 100) < 50) score += 30;
  if ((order.reliabilityScore ?? 100) < 30) score += 20;

  const hour = new Date(order.reservationTime).getHours();
  if (hour >= 20) score += 10; // late night higher no-show

  if (score > 100) score = 100;

  return score; // %
}

// 6. Slot Health Score
export function calculateSlotHealth(orders: OrderRecord[]) {
  const slots: Record<string, { total: number; bad: number }> = {};

  for (const o of orders) {
    const hour = new Date(o.reservationTime).getHours();
    const key = `${hour}:00`;

    if (!slots[key]) {
      slots[key] = { total: 0, bad: 0 };
    }

    slots[key].total++;

    if (o.status === "CANCELLED" || o.status === "NO_SHOW") {
      slots[key].bad++;
    }
  }

  return Object.entries(slots).map(([time, data]) => {
    const health = 100 - (data.bad / data.total) * 100;
    return { time, health: Math.round(health) };
  });
}

// 7. Revenue Leakage Map
export function calculateRevenueLeakage(orders: OrderRecord[]) {
  let leakage = 0;
  let recovered = 0;
  let paid = 0;

  for (const o of orders) {
    if (o.status === "PAID") paid += o.amount;
    if ((o.status === "CANCELLED" || o.status === "NO_SHOW") && !o.recovered) {
      leakage += o.amount;
    }
    if (o.recovered) recovered += o.amount;
  }

  return {
    paid,
    leakage,
    recovered,
  };
}