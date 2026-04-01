import type { ReliabilityEvent } from "./reliabilityEngine";

export type PaymentState =
  | "PENDING"
  | "LINK_SENT"
  | "SCREENSHOT_SUBMITTED"
  | "VERIFIED"
  | "SUSPICIOUS"
  | "BLOCKED";

export type PaymentVerificationDecision = {
  paymentState: PaymentState;
  paymentVerified: boolean;
  terminalMismatch: boolean;
  shouldBlock: boolean;
  reliabilityEvent?: ReliabilityEvent;
  reason: string;
};

export function sendPaymentLinkTransition(): PaymentState {
  return "LINK_SENT";
}

export function submitScreenshotTransition(): PaymentState {
  return "SCREENSHOT_SUBMITTED";
}

export function verifyPaymentAmount(
  expectedAmount: number,
  receivedAmount: number
): PaymentVerificationDecision {
  if (Number.isNaN(receivedAmount) || receivedAmount <= 0) {
    return {
      paymentState: "SUSPICIOUS",
      paymentVerified: false,
      terminalMismatch: true,
      shouldBlock: true,
      reliabilityEvent: "FRAUD_ATTEMPT",
      reason: "Invalid payment amount entered",
    };
  }

  if (receivedAmount !== expectedAmount) {
    return {
      paymentState: "BLOCKED",
      paymentVerified: false,
      terminalMismatch: true,
      shouldBlock: true,
      reliabilityEvent: "FRAUD_ATTEMPT",
      reason: `Payment mismatch. Expected ${expectedAmount}, got ${receivedAmount}`,
    };
  }

  return {
    paymentState: "VERIFIED",
    paymentVerified: true,
    terminalMismatch: false,
    shouldBlock: false,
    reliabilityEvent: "ORDER_COMPLETED",
    reason: "Payment verified successfully",
  };
}