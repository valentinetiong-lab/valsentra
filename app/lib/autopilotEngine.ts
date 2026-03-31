import {
  AutopilotEvaluationResult,
  AutopilotQueueItem,
  AutopilotRule,
  RestaurantOrder,
} from "@/app/types/autopilot";

const isLastMinuteCancellation = (
  order: RestaurantOrder,
  hoursThreshold: number
): boolean => {
  if (order.status !== "Cancelled") return false;

  const now = new Date();
  const slotDateTime = new Date(`${order.date}T${order.time}:00`);

  if (Number.isNaN(slotDateTime.getTime())) return false;

  const diffMs = slotDateTime.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return diffHours >= 0 && diffHours <= hoursThreshold;
};

export const evaluateRule = (
  rule: AutopilotRule,
  order: RestaurantOrder
): AutopilotEvaluationResult => {
  if (!rule.enabled) {
    return { matched: false, actions: [] };
  }

  switch (rule.key) {
    case "DINE_IN_DEPOSIT_BY_GUESTS": {
      const threshold = rule.config?.guestThreshold ?? 6;
      const matched =
        order.orderType === "DINE_IN" && (order.partySize ?? 0) >= threshold;

      return matched
        ? {
            matched: true,
            reason: `Dine-in party size ${order.partySize} reached threshold ${threshold}`,
            actions: rule.actions,
            estimatedRevenueProtected: order.amount * 0.3,
          }
        : { matched: false, actions: [] };
    }

    case "HIGH_VALUE_DEPOSIT": {
      const threshold = rule.config?.amountThreshold ?? 150;
      const matched = order.amount >= threshold;

      return matched
        ? {
            matched: true,
            reason: `Order amount RM${order.amount} exceeded threshold RM${threshold}`,
            actions: rule.actions,
            estimatedRevenueProtected: order.amount * 0.3,
          }
        : { matched: false, actions: [] };
    }

    case "LOW_RELIABILITY_DEPOSIT": {
      const threshold = rule.config?.reliabilityThreshold ?? 50;
      const score = order.reliabilityScore ?? 100;
      const matched = score < threshold;

      return matched
        ? {
            matched: true,
            reason: `Customer reliability ${score} is below threshold ${threshold}`,
            actions: rule.actions,
            estimatedRevenueProtected: order.amount * 0.3,
          }
        : { matched: false, actions: [] };
    }

    case "AUTO_BLOCK_HIGH_VALUE_UNPAID": {
      const threshold = rule.config?.amountThreshold ?? 250;
      const matched =
        order.status === "Pending" &&
        !order.paymentVerified &&
        order.amount >= threshold;

      return matched
        ? {
            matched: true,
            reason: `Pending unpaid high-value order RM${order.amount}`,
            actions: rule.actions,
            estimatedRevenueProtected: order.amount,
          }
        : { matched: false, actions: [] };
    }

    case "HARD_BLOCK_TERMINAL_MISMATCH": {
      const matched = order.status === "Paid" && !order.paymentVerified;

      return matched
        ? {
            matched: true,
            reason: "Order marked paid without payment verification",
            actions: rule.actions,
            estimatedRevenueProtected: order.amount,
          }
        : { matched: false, actions: [] };
    }

    case "LAST_MINUTE_CANCEL_WAITLIST": {
      const hours = rule.config?.lastMinuteHours ?? 6;
      const matched = isLastMinuteCancellation(order, hours);

      return matched
        ? {
            matched: true,
            reason: `Last-minute cancellation within ${hours} hours`,
            actions: rule.actions,
            estimatedRevenueProtected: order.amount,
          }
        : { matched: false, actions: [] };
    }

    case "NO_SHOW_REDUCE_RELIABILITY": {
      const matched = order.status === "No-show";

      return matched
        ? {
            matched: true,
            reason: "Customer marked as no-show",
            actions: rule.actions,
          }
        : { matched: false, actions: [] };
    }

    case "PAYMENT_SCREENSHOT_FLAG": {
      const matched = !!order.suspiciousPaymentScreenshot;

      return matched
        ? {
            matched: true,
            reason: "Suspicious payment screenshot detected",
            actions: rule.actions,
            estimatedRevenueProtected: order.amount,
          }
        : { matched: false, actions: [] };
    }

    default:
      return { matched: false, actions: [] };
  }
};

export const buildAutopilotQueue = (
  rules: AutopilotRule[],
  orders: RestaurantOrder[]
): AutopilotQueueItem[] => {
  const queue: AutopilotQueueItem[] = [];

  for (const order of orders) {
    for (const rule of rules) {
      const result = evaluateRule(rule, order);

      if (!result.matched) continue;

      for (const action of result.actions) {
        queue.push({
          id: `${order.id}-${rule.key}-${action}`,
          orderId: order.id,
          customerName: order.customerName,
          ruleKey: rule.key,
          action,
          status: "QUEUED",
          reason: result.reason ?? "Rule matched",
          createdAt: new Date().toISOString(),
          estimatedRevenueProtected: result.estimatedRevenueProtected,
        });
      }
    }
  }

  return queue;
};