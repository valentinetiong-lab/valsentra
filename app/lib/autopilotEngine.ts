import {
  AutopilotQueueItem,
  AutopilotRule,
  RestaurantOrder,
} from "../types/autopilot";
import { calculateRiskScore, getRiskLevel } from "./riskEngine";
import { evaluateTimeAutomation } from "./timeAutomationEngine";

export function runAutopilot(
  orders: RestaurantOrder[],
  rules: AutopilotRule[]
): { queue: AutopilotQueueItem[]; revenueSaved: number } {
  const queue: AutopilotQueueItem[] = [];
  const seen = new Set<string>();
  let revenueSaved = 0;

  function pushQueueItem(item: AutopilotQueueItem) {
    const key = `${item.orderId}:${item.ruleKey}:${item.action}`;
    if (seen.has(key)) return;
    seen.add(key);
    queue.push(item);
  }

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

      if (
        rule.key === "DINE_IN_DEPOSIT_BY_GUESTS" &&
        order.orderType === "DINE_IN" &&
        (order.partySize ?? 0) >= (rule.config?.guestThreshold ?? 6) &&
        !order.depositPaid
      ) {
        pushQueueItem({
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

      if (
        rule.key === "HIGH_VALUE_DEPOSIT" &&
        order.amount >= (rule.config?.amountThreshold ?? 150) &&
        !order.depositPaid
      ) {
        pushQueueItem({
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

      if (
        rule.key === "LOW_RELIABILITY_DEPOSIT" &&
        (order.reliabilityScore ?? 100) <
          (rule.config?.reliabilityThreshold ?? 50) &&
        !order.depositPaid
      ) {
        pushQueueItem({
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

      if (
        rule.key === "AUTO_BLOCK_HIGH_VALUE_UNPAID" &&
        order.status === "Pending" &&
        !order.paymentVerified &&
        order.amount >= (rule.config?.amountThreshold ?? 250)
      ) {
        pushQueueItem({
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

      if (
        rule.key === "HARD_BLOCK_TERMINAL_MISMATCH" &&
        order.status === "Paid" &&
        !order.paymentVerified
      ) {
        pushQueueItem({
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

      if (
        rule.key === "LAST_MINUTE_CANCEL_WAITLIST" &&
        order.status === "Cancelled"
      ) {
        pushQueueItem({
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

      if (
        rule.key === "NO_SHOW_REDUCE_RELIABILITY" &&
        order.status === "No-show"
      ) {
        pushQueueItem({
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

      if (
        rule.key === "PAYMENT_SCREENSHOT_FLAG" &&
        order.suspiciousPaymentScreenshot
      ) {
        pushQueueItem({
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

      if (rule.key === "TIME_BASED_REMINDER") {
        const timeDecisions = evaluateTimeAutomation(
          order,
          new Date(),
          rule.config?.reminderHoursBefore ?? 24,
          rule.config?.unpaidReleaseMinutesBefore ?? 30
        ).filter((d) => d.action === "SEND_REMINDER");

        for (const decision of timeDecisions) {
          pushQueueItem({
            id: `REM-${order.id}`,
            orderId: order.id,
            customerName: order.customerName,
            ruleKey: rule.key,
            action: decision.action,
            reason: decision.reason,
            status: "QUEUED",
            createdAt: new Date().toISOString(),
            estimatedRevenueProtected: decision.estimatedRevenueProtected,
          });
        }
      }

      if (rule.key === "UNPAID_RELEASE_SLOT") {
        const timeDecisions = evaluateTimeAutomation(
          order,
          new Date(),
          rule.config?.reminderHoursBefore ?? 24,
          rule.config?.unpaidReleaseMinutesBefore ?? 30
        ).filter(
          (d) =>
            d.action === "RELEASE_SLOT" || d.action === "OFFER_WAITLIST"
        );

        for (const decision of timeDecisions) {
          pushQueueItem({
            id: `${decision.action}-${order.id}`,
            orderId: order.id,
            customerName: order.customerName,
            ruleKey: rule.key,
            action: decision.action,
            reason: decision.reason,
            status: "QUEUED",
            createdAt: new Date().toISOString(),
            estimatedRevenueProtected: decision.estimatedRevenueProtected,
          });
        }
      }
    }
  }

  return { queue, revenueSaved };
}