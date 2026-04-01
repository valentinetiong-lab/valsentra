import {
  AutopilotQueueItem,
  AutopilotRule,
  RestaurantOrder,
} from "../types/autopilot";
import { calculateRiskScore, getRiskLevel } from "./riskEngine";

export function runAutopilot(
  orders: RestaurantOrder[],
  rules: AutopilotRule[]
): { queue: AutopilotQueueItem[]; revenueSaved: number } {
  const queue: AutopilotQueueItem[] = [];
  let revenueSaved = 0;

  for (const order of orders) {
    const riskScore = calculateRiskScore({
      amount: order.amount,
      reliabilityScore: order.reliabilityScore,
      depositPaid: order.depositPaid,
      orderType: order.orderType,
    });

    const calculatedRiskLevel = getRiskLevel(riskScore);

    for (const rule of rules) {
      if (!rule.enabled) continue;

      // RULE: Require deposit for larger dine-in groups
      if (
        rule.key === "DINE_IN_DEPOSIT_BY_GUESTS" &&
        order.orderType === "DINE_IN" &&
        (order.partySize ?? 0) >= (rule.config?.guestThreshold ?? 6) &&
        !order.depositPaid
      ) {
        queue.push({
          id: `DEP-${order.id}`,
          orderId: order.id,
          customerName: order.customerName,
          ruleKey: rule.key,
          action: "SEND_PAYMENT_LINK",
          reason: `Deposit required for larger dine-in group (${order.partySize ?? 0} guests)`,
          status: "QUEUED",
          createdAt: new Date().toISOString(),
          estimatedRevenueProtected: order.amount * 0.3,
        });
      }

      // RULE: Require deposit for high-value orders
      if (
        rule.key === "HIGH_VALUE_DEPOSIT" &&
        order.amount >= (rule.config?.amountThreshold ?? 150) &&
        !order.depositPaid
      ) {
        queue.push({
          id: `HIGHVAL-${order.id}`,
          orderId: order.id,
          customerName: order.customerName,
          ruleKey: rule.key,
          action: "SEND_PAYMENT_LINK",
          reason: `High-value order needs deposit (Risk: ${calculatedRiskLevel})`,
          status: "QUEUED",
          createdAt: new Date().toISOString(),
          estimatedRevenueProtected: order.amount * 0.3,
        });
      }

      // RULE: Low reliability requires deposit
      if (
        rule.key === "LOW_RELIABILITY_DEPOSIT" &&
        (order.reliabilityScore ?? 100) <
          (rule.config?.reliabilityThreshold ?? 50) &&
        !order.depositPaid
      ) {
        queue.push({
          id: `LOWREL-${order.id}`,
          orderId: order.id,
          customerName: order.customerName,
          ruleKey: rule.key,
          action: "SEND_PAYMENT_LINK",
          reason: `Low reliability customer requires deposit (Score: ${
            order.reliabilityScore ?? 100
          }, Risk: ${calculatedRiskLevel})`,
          status: "QUEUED",
          createdAt: new Date().toISOString(),
          estimatedRevenueProtected: order.amount * 0.3,
        });
      }

      // RULE: Auto block high-value unpaid
      if (
        rule.key === "AUTO_BLOCK_HIGH_VALUE_UNPAID" &&
        order.status === "Pending" &&
        !order.paymentVerified &&
        order.amount >= (rule.config?.amountThreshold ?? 250)
      ) {
        queue.push({
          id: `BLOCK-${order.id}`,
          orderId: order.id,
          customerName: order.customerName,
          ruleKey: rule.key,
          action: "BLOCK_ORDER",
          reason: `High-value unpaid order (Risk: ${calculatedRiskLevel})`,
          status: "QUEUED",
          createdAt: new Date().toISOString(),
          estimatedRevenueProtected: order.amount,
        });
      }

      // RULE: Hard block terminal mismatch
      if (
        rule.key === "HARD_BLOCK_TERMINAL_MISMATCH" &&
        order.status === "Paid" &&
        !order.paymentVerified
      ) {
        queue.push({
          id: `TERM-${order.id}`,
          orderId: order.id,
          customerName: order.customerName,
          ruleKey: rule.key,
          action: "BLOCK_ORDER",
          reason: "Marked paid without verification",
          status: "QUEUED",
          createdAt: new Date().toISOString(),
          estimatedRevenueProtected: order.amount,
        });
      }

      // RULE: Last-minute cancel -> offer waitlist
      if (
        rule.key === "LAST_MINUTE_CANCEL_WAITLIST" &&
        order.status === "Cancelled"
      ) {
        queue.push({
          id: `WAIT-${order.id}`,
          orderId: order.id,
          customerName: order.customerName,
          ruleKey: rule.key,
          action: "OFFER_WAITLIST",
          reason: "Cancelled slot can be recovered",
          status: "QUEUED",
          createdAt: new Date().toISOString(),
          estimatedRevenueProtected: order.amount,
        });

        revenueSaved += order.amount;
      }

      // RULE: No-show reduce reliability
      if (
        rule.key === "NO_SHOW_REDUCE_RELIABILITY" &&
        order.status === "No-show"
      ) {
        queue.push({
          id: `NOSHOW-${order.id}`,
          orderId: order.id,
          customerName: order.customerName,
          ruleKey: rule.key,
          action: "REDUCE_RELIABILITY",
          reason: `Customer was marked as no-show (Risk: ${calculatedRiskLevel})`,
          status: "QUEUED",
          createdAt: new Date().toISOString(),
        });
      }

      // RULE: Suspicious screenshot -> fraud flag
      if (
        rule.key === "PAYMENT_SCREENSHOT_FLAG" &&
        order.suspiciousPaymentScreenshot
      ) {
        queue.push({
          id: `FRAUD-${order.id}`,
          orderId: order.id,
          customerName: order.customerName,
          ruleKey: rule.key,
          action: "FLAG_FRAUD",
          reason: `Suspicious payment screenshot detected (Risk: ${calculatedRiskLevel})`,
          status: "QUEUED",
          createdAt: new Date().toISOString(),
          estimatedRevenueProtected: order.amount,
        });
      }
    }
  }

  return { queue, revenueSaved };
}