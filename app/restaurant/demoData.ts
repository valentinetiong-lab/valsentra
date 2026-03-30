export type OrderStatus =
  | "UNPAID"
  | "PAYMENT_SENT"
  | "PAID"
  | "CANCELLED"
  | "NO_SHOW";

export type OrderType =
  | "DINE_IN_RESERVATION"
  | "PREORDER_PICKUP"
  | "DELIVERY_PREORDER";

export type RestaurantOrder = {
  id: string;
  customerName: string;
  phone: string;
  orderType: OrderType;
  amount: number;
  guests: number;
  reservationTime: string;
  itemSummary: string;
  status: OrderStatus;
  depositRequired: boolean;
  depositPaid: boolean;
  reliabilityScore: number;
  terminalMismatch: boolean;
  notes: string;
  assignedStaff: string;
};

export type AuditItem = {
  id: number;
  action: string;
  staff: string;
  orderId: string;
  time: string;
};

export type WaitlistLead = {
  id: string;
  customerName: string;
  phone: string;
  preferredType: OrderType;
  showProbability: number;
  responseSpeedScore: number;
  reliabilityScore: number;
};

export const demoOrders: RestaurantOrder[] = [
  {
    id: "ORD-1001",
    customerName: "Sarah Lim",
    phone: "+60 12-345 6789",
    orderType: "PREORDER_PICKUP",
    amount: 168,
    guests: 1,
    reservationTime: "Today, 7:00 PM",
    itemSummary: "4 steaks, 2 sides, 2 drinks",
    status: "UNPAID",
    depositRequired: true,
    depositPaid: false,
    reliabilityScore: 65,
    terminalMismatch: false,
    notes: "Large pickup order. Payment not received yet.",
    assignedStaff: "Aiman",
  },
  {
    id: "ORD-1002",
    customerName: "Jason Tan",
    phone: "+60 11-222 3344",
    orderType: "DINE_IN_RESERVATION",
    amount: 320,
    guests: 6,
    reservationTime: "Today, 8:30 PM",
    itemSummary: "Table reservation for 6",
    status: "PAYMENT_SENT",
    depositRequired: true,
    depositPaid: false,
    reliabilityScore: 40,
    terminalMismatch: false,
    notes: "Deposit link sent. Waiting for customer.",
    assignedStaff: "Nadia",
  },
  {
    id: "ORD-1003",
    customerName: "Alicia Wong",
    phone: "+60 17-888 9900",
    orderType: "DELIVERY_PREORDER",
    amount: 92,
    guests: 1,
    reservationTime: "Today, 6:30 PM",
    itemSummary: "Family pasta set",
    status: "PAID",
    depositRequired: false,
    depositPaid: true,
    reliabilityScore: 90,
    terminalMismatch: false,
    notes: "Safe order. Ready for prep.",
    assignedStaff: "Faris",
  },
  {
    id: "ORD-1004",
    customerName: "Daniel Lee",
    phone: "+60 14-777 1212",
    orderType: "DINE_IN_RESERVATION",
    amount: 240,
    guests: 4,
    reservationTime: "Yesterday, 8:00 PM",
    itemSummary: "Reservation no-show",
    status: "NO_SHOW",
    depositRequired: true,
    depositPaid: false,
    reliabilityScore: 20,
    terminalMismatch: false,
    notes: "Repeat no-show risk customer.",
    assignedStaff: "Nadia",
  },
  {
    id: "ORD-1005",
    customerName: "Mira Hassan",
    phone: "+60 19-555 2020",
    orderType: "PREORDER_PICKUP",
    amount: 190,
    guests: 1,
    reservationTime: "Today, 9:15 PM",
    itemSummary: "Seafood platter + drinks",
    status: "UNPAID",
    depositRequired: false,
    depositPaid: false,
    reliabilityScore: 60,
    terminalMismatch: true,
    notes: "Staff entered wrong amount earlier. Recheck before release.",
    assignedStaff: "Aiman",
  },
];

export const demoAudit: AuditItem[] = [
  {
    id: 1,
    action: "Sent payment link",
    staff: "Nadia",
    orderId: "ORD-1002",
    time: "Today, 5:05 PM",
  },
  {
    id: 2,
    action: "Mismatch detected",
    staff: "Aiman",
    orderId: "ORD-1005",
    time: "Today, 5:22 PM",
  },
  {
    id: 3,
    action: "Marked payment verified",
    staff: "Faris",
    orderId: "ORD-1003",
    time: "Today, 4:48 PM",
  },
];

export const waitlistLeads: WaitlistLead[] = [
  {
    id: "WL-001",
    customerName: "Nurin",
    phone: "+60 12-111 2222",
    preferredType: "DINE_IN_RESERVATION",
    showProbability: 86,
    responseSpeedScore: 92,
    reliabilityScore: 88,
  },
  {
    id: "WL-002",
    customerName: "Arif",
    phone: "+60 18-555 6666",
    preferredType: "PREORDER_PICKUP",
    showProbability: 81,
    responseSpeedScore: 80,
    reliabilityScore: 84,
  },
  {
    id: "WL-003",
    customerName: "Mei",
    phone: "+60 16-333 7777",
    preferredType: "DINE_IN_RESERVATION",
    showProbability: 75,
    responseSpeedScore: 89,
    reliabilityScore: 79,
  },
];

export const automationRules = {
  depositRequiredAbove: 150,
  highRiskRequiresDeposit: true,
  reminderHoursBefore: 24,
  autoCancelIfUnpaidHours: 12,
  reliabilityPenaltyNoShow: 20,
  blacklistThreshold: 10,
};

export function updateReliabilityAfterNoShow(score: number) {
  const newScore = score - automationRules.reliabilityPenaltyNoShow;
  return Math.max(newScore, 0);
}

export function isBlacklisted(score: number) {
  return score <= automationRules.blacklistThreshold;
}

export function detectFraud(order: RestaurantOrder) {
  if (order.terminalMismatch) return "TERMINAL_MISMATCH";
  if (order.reliabilityScore < 20) return "HIGH_RISK_CUSTOMER";
  if (order.amount >= 300 && order.status !== "PAID") return "HIGH_VALUE_UNPAID";
  return null;
}

export function getReminderStatus(order: RestaurantOrder) {
  if (order.status === "PAID") return "No reminder needed";
  if (order.status === "PAYMENT_SENT") return "Reminder scheduled";
  if (order.status === "UNPAID") return "Payment reminder needed";
  return "Closed";
}

export function getBestWaitlistLead(order: RestaurantOrder) {
  const matches = waitlistLeads.filter((lead) => lead.preferredType === order.orderType);

  if (matches.length === 0) return null;

  const sorted = [...matches].sort((a, b) => {
    const aScore = a.showProbability + a.responseSpeedScore + a.reliabilityScore;
    const bScore = b.showProbability + b.responseSpeedScore + b.reliabilityScore;
    return bScore - aScore;
  });

  return sorted[0];
}

export function getRecoveryPlan(order: RestaurantOrder) {
  if (order.status === "CANCELLED" || order.status === "NO_SHOW") {
    const bestLead = getBestWaitlistLead(order);
    if (!bestLead) return "No suitable waitlist lead found";
    return `Offer slot/order to ${bestLead.customerName} first`;
  }

  if (order.status === "UNPAID") {
    return "Send payment reminder and hold until verified";
  }

  if (order.status === "PAYMENT_SENT") {
    return "Await payment, then confirm";
  }

  return "No recovery action needed";
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function getOrderTypeLabel(orderType: OrderType) {
  switch (orderType) {
    case "DINE_IN_RESERVATION":
      return "Dine-in";
    case "PREORDER_PICKUP":
      return "Pickup";
    case "DELIVERY_PREORDER":
      return "Delivery";
    default:
      return orderType;
  }
}

// Reliability system
export function reduceReliability(score: number) {
  const newScore = score - 20;
  return Math.max(newScore, 0);
}

export function increaseReliability(score: number) {
  const newScore = score + 5;
  return Math.min(newScore, 100);
}

