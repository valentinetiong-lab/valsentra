import { AutopilotRule } from "@/app/types/autopilot";

export const defaultAutopilotRules: AutopilotRule[] = [
  {
    key: "DINE_IN_DEPOSIT_BY_GUESTS",
    title: "Require deposit for larger dine-in groups",
    description: "If dine-in guest count reaches threshold, require a deposit.",
    enabled: true,
    config: {
      guestThreshold: 6,
    },
    actions: ["REQUIRE_DEPOSIT", "SEND_PAYMENT_LINK"],
  },
  {
    key: "HIGH_VALUE_DEPOSIT",
    title: "Require deposit for high value orders",
    description: "If order value is high, require a deposit before confirming.",
    enabled: true,
    config: {
      amountThreshold: 150,
    },
    actions: ["REQUIRE_DEPOSIT", "SEND_PAYMENT_LINK"],
  },
  {
    key: "LOW_RELIABILITY_DEPOSIT",
    title: "Require deposit for low reliability customers",
    description: "Customers below reliability threshold must pay deposit.",
    enabled: true,
    config: {
      reliabilityThreshold: 50,
    },
    actions: ["REQUIRE_DEPOSIT", "SEND_PAYMENT_LINK"],
  },
  {
    key: "AUTO_BLOCK_HIGH_VALUE_UNPAID",
    title: "Auto-block high value unpaid orders",
    description: "Pending high value orders can be blocked automatically.",
    enabled: true,
    config: {
      amountThreshold: 250,
    },
    actions: ["BLOCK_ORDER"],
  },
  {
    key: "HARD_BLOCK_TERMINAL_MISMATCH",
    title: "Hard block terminal mismatch",
    description: "Do not mark paid if payment is not properly verified.",
    enabled: true,
    actions: ["BLOCK_ORDER"],
  },
  {
    key: "LAST_MINUTE_CANCEL_WAITLIST",
    title: "Offer cancelled slots to waitlist",
    description: "If cancellation is last-minute, trigger recovery flow.",
    enabled: true,
    config: {
      lastMinuteHours: 6,
    },
    actions: ["OFFER_WAITLIST", "RELEASE_SLOT"],
  },
  {
    key: "NO_SHOW_REDUCE_RELIABILITY",
    title: "Reduce reliability on no-show",
    description: "No-shows reduce future trust level.",
    enabled: true,
    actions: ["REDUCE_RELIABILITY"],
  },
  {
    key: "PAYMENT_SCREENSHOT_FLAG",
    title: "Flag suspicious payment screenshots",
    description: "Screenshot-based proof should trigger manual verification.",
    enabled: true,
    actions: ["FLAG_FRAUD"],
  },
];