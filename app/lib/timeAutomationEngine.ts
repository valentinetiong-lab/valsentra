import { RestaurantOrder, AutopilotActionType } from "../types/autopilot";

export type TimeAutomationDecision = {
  action: AutopilotActionType;
  reason: string;
  estimatedRevenueProtected?: number;
};

function getMinutesUntilReservation(order: RestaurantOrder, now = new Date()) {
  const slot = new Date(`${order.date}T${order.time}:00`);
  if (Number.isNaN(slot.getTime())) return null;
  return Math.round((slot.getTime() - now.getTime()) / (1000 * 60));
}

export function evaluateTimeAutomation(
  order: RestaurantOrder,
  now = new Date(),
  reminderHoursBefore = 24,
  unpaidReleaseMinutesBefore = 30
): TimeAutomationDecision[] {
  const minutesUntil = getMinutesUntilReservation(order, now);
  if (minutesUntil === null) return [];

  const decisions: TimeAutomationDecision[] = [];
  const reminderWindowMinutes = reminderHoursBefore * 60;

  if (
    order.status === "Pending" &&
    !order.paymentVerified &&
    minutesUntil > 0 &&
    minutesUntil <= reminderWindowMinutes
  ) {
    decisions.push({
      action: "SEND_REMINDER",
      reason: `Reservation is within ${reminderHoursBefore} hours and payment is still unverified`,
      estimatedRevenueProtected: order.amount,
    });
  }

  if (
    order.status === "Pending" &&
    order.depositRequired &&
    !order.depositPaid &&
    minutesUntil > 0 &&
    minutesUntil <= unpaidReleaseMinutesBefore
  ) {
    decisions.push({
      action: "RELEASE_SLOT",
      reason: `Deposit still unpaid within ${unpaidReleaseMinutesBefore} minutes of reservation`,
      estimatedRevenueProtected: order.amount,
    });

    decisions.push({
      action: "OFFER_WAITLIST",
      reason: "Released slot should be offered to waitlist immediately",
      estimatedRevenueProtected: order.amount,
    });
  }

  return decisions;
}